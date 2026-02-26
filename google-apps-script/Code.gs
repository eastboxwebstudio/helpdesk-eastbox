const SHEET_NAMES = {
  users: 'Users',
  tickets: 'Tickets',
  comments: 'Comments',
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;

    switch (action) {
      case 'users.list':
        return jsonResponse({ data: readAllRows(SHEET_NAMES.users) });
      case 'tickets.list':
        return jsonResponse({ data: readAllRows(SHEET_NAMES.tickets) });
      case 'tickets.byId':
        return jsonResponse({ data: findByField(SHEET_NAMES.tickets, 'ticket_id', payload.ticketId) });
      case 'tickets.byClient':
        return jsonResponse({ data: filterRows(SHEET_NAMES.tickets, 'client_id', payload.clientId) });
      case 'tickets.byAssignee':
        return jsonResponse({ data: filterRows(SHEET_NAMES.tickets, 'assigned_to', payload.assignedTo) });
      case 'tickets.create':
        return jsonResponse(createTicket(payload.ticket));
      case 'tickets.updateStatus':
        return jsonResponse(updateTicket(payload.ticketId, { status: payload.status }));
      case 'tickets.assign':
        return jsonResponse(updateTicket(payload.ticketId, { assigned_to: payload.assignedTo }));
      case 'comments.byTicket':
        return jsonResponse({ data: filterRows(SHEET_NAMES.comments, 'ticket_id', payload.ticketId) });
      case 'comments.create':
        return jsonResponse(createComment(payload.comment));
      default:
        return jsonResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function readAllRows(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const [headers, ...data] = rows;
  return data.map((row) => rowToObject(headers, row));
}

function filterRows(sheetName, key, value) {
  return readAllRows(sheetName).filter((row) => String(row[key]) === String(value));
}

function findByField(sheetName, key, value) {
  const rows = filterRows(sheetName, key, value);
  return rows.length > 0 ? rows[0] : null;
}

function createTicket(ticket) {
  const timestamp = new Date().toISOString();
  const record = {
    ticket_id: `T-${Date.now()}`,
    client_id: ticket.client_id,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    status: ticket.status || 'Pending',
    urgency: ticket.urgency,
    assigned_to: ticket.assigned_to || '',
    created_at: timestamp,
    updated_at: timestamp,
  };

  appendRow(SHEET_NAMES.tickets, record);
  return { data: record };
}

function updateTicket(ticketId, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.tickets);
  const rows = sheet.getDataRange().getValues();
  const [headers, ...data] = rows;
  const indexMap = headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});

  for (let i = 0; i < data.length; i += 1) {
    if (String(data[i][indexMap.ticket_id]) === String(ticketId)) {
      Object.keys(updates).forEach((field) => {
        if (indexMap[field] !== undefined) {
          data[i][indexMap[field]] = updates[field];
        }
      });
      data[i][indexMap.updated_at] = new Date().toISOString();
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([data[i]]);
      return { data: rowToObject(headers, data[i]) };
    }
  }

  throw new Error('Ticket not found');
}

function createComment(comment) {
  const record = {
    comment_id: `C-${Date.now()}`,
    ticket_id: comment.ticket_id,
    user_id: comment.user_id,
    message: comment.message,
    timestamp: new Date().toISOString(),
  };

  appendRow(SHEET_NAMES.comments, record);
  return { data: record };
}

function appendRow(sheetName, objectData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((header) => objectData[header] ?? '');
  sheet.appendRow(row);
}

function rowToObject(headers, row) {
  return headers.reduce((acc, header, idx) => {
    acc[header] = row[idx];
    return acc;
  }, {});
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
