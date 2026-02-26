import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../lib/api';
import TicketComments from '../components/TicketComments';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [supportUsers, setSupportUsers] = useState([]);

  const fetchData = async () => {
    const [ticketsResponse, usersResponse] = await Promise.all([
      api.get('/tickets'),
      api.get('/users?role=support'),
    ]);
    setTickets(ticketsResponse.data.tickets || []);
    setSupportUsers(usersResponse.data.users || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assignTicket = async (ticketId, assignedTo) => {
    await api.patch(`/tickets/${ticketId}/assign`, { assignedTo });
    fetchData();
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">All Tickets</h2>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <article key={ticket.ticket_id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">{ticket.subject}</h3>
                  <p className="text-xs text-slate-500">Client: {ticket.client_id} · Status: {ticket.status}</p>
                </div>
                <select className="rounded border px-2 py-1" value={ticket.assigned_to || ''} onChange={(e) => assignTicket(ticket.ticket_id, e.target.value)}>
                  <option value="">Unassigned</option>
                  {supportUsers.map((user) => (
                    <option value={user.id} key={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <TicketComments ticketId={ticket.ticket_id} />
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
