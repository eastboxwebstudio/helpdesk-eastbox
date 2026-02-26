import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwtVerify, SignJWT } from 'jose';

const app = new Hono();

app.use('*', cors());

const encoder = new TextEncoder();

const buildJwtSecret = (secret) => encoder.encode(secret);

const signToken = async (payload, secret) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(buildJwtSecret(secret));
};

const verifyToken = async (token, secret) => {
  const { payload } = await jwtVerify(token, buildJwtSecret(secret));
  return payload;
};

const proxyToSheetsApi = async (env, action, body = {}) => {
  const response = await fetch(env.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || `Sheets API error: ${response.status}`);
  }

  return result;
};

const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ message: 'Missing token' }, 401);

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ message: 'Invalid token' }, 401);
  }
};

const roleMiddleware = (roles) => async (c, next) => {
  const user = c.get('user');
  if (!roles.includes(user.role)) {
    return c.json({ message: 'Forbidden' }, 403);
  }
  await next();
};

const isTicketVisibleToUser = (ticket, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'client') return String(ticket.client_id) === String(user.id);
  return String(ticket.assigned_to) === String(user.id);
};

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const users = await proxyToSheetsApi(c.env, 'users.list');
  const user = users.data.find((entry) => entry.email === email);

  if (!user || user.password_hash !== password) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  const token = await signToken(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    c.env.JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

app.get('/users', authMiddleware, roleMiddleware(['admin']), async (c) => {
  const role = c.req.query('role');
  const users = await proxyToSheetsApi(c.env, 'users.list');
  const filtered = role ? users.data.filter((user) => user.role === role) : users.data;
  return c.json({ users: filtered });
});

app.get('/tickets', authMiddleware, roleMiddleware(['admin']), async (c) => {
  const response = await proxyToSheetsApi(c.env, 'tickets.list');
  return c.json({ tickets: response.data });
});

app.get('/tickets/my', authMiddleware, roleMiddleware(['client']), async (c) => {
  const user = c.get('user');
  const response = await proxyToSheetsApi(c.env, 'tickets.byClient', { clientId: user.id });
  return c.json({ tickets: response.data });
});

app.get('/tickets/assigned', authMiddleware, roleMiddleware(['support']), async (c) => {
  const user = c.get('user');
  const response = await proxyToSheetsApi(c.env, 'tickets.byAssignee', { assignedTo: user.id });
  return c.json({ tickets: response.data });
});

app.post('/tickets', authMiddleware, roleMiddleware(['client']), async (c) => {
  const user = c.get('user');
  const payload = await c.req.json();
  const response = await proxyToSheetsApi(c.env, 'tickets.create', {
    ticket: {
      ...payload,
      client_id: user.id,
      status: 'Pending',
    },
  });
  return c.json(response, 201);
});

app.patch('/tickets/:id/status', authMiddleware, roleMiddleware(['support', 'admin']), async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const response = await proxyToSheetsApi(c.env, 'tickets.updateStatus', { ticketId: id, status });
  return c.json(response);
});

app.patch('/tickets/:id/assign', authMiddleware, roleMiddleware(['admin']), async (c) => {
  const id = c.req.param('id');
  const { assignedTo } = await c.req.json();
  const response = await proxyToSheetsApi(c.env, 'tickets.assign', { ticketId: id, assignedTo });
  return c.json(response);
});

app.get('/tickets/:id/comments', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const ticketResponse = await proxyToSheetsApi(c.env, 'tickets.byId', { ticketId: id });
  const ticket = ticketResponse.data;

  if (!ticket || !isTicketVisibleToUser(ticket, user)) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  const commentsResponse = await proxyToSheetsApi(c.env, 'comments.byTicket', { ticketId: id });
  return c.json({ comments: commentsResponse.data });
});

app.post('/tickets/:id/comments', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const { message } = await c.req.json();

  const ticketResponse = await proxyToSheetsApi(c.env, 'tickets.byId', { ticketId: id });
  const ticket = ticketResponse.data;

  if (!ticket || !isTicketVisibleToUser(ticket, user)) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  const response = await proxyToSheetsApi(c.env, 'comments.create', {
    comment: {
      ticket_id: id,
      user_id: user.id,
      message,
    },
  });
  return c.json(response, 201);
});

export default app;
