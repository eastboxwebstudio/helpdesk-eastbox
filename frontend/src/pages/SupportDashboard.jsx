import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../lib/api';
import TicketComments from '../components/TicketComments';

const STATUSES = ['Pending', 'In Progress', 'Resolved'];

export default function SupportDashboard() {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    const response = await api.get('/tickets/assigned');
    setTickets(response.data.tickets || []);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateStatus = async (ticketId, status) => {
    await api.patch(`/tickets/${ticketId}/status`, { status });
    fetchTickets();
  };

  return (
    <DashboardLayout title="Support Dashboard">
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Assigned Tickets</h2>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <article key={ticket.ticket_id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{ticket.subject}</h3>
                <select className="rounded border px-2 py-1" value={ticket.status} onChange={(e) => updateStatus(ticket.ticket_id, e.target.value)}>
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-slate-600">{ticket.description}</p>
              <TicketComments ticketId={ticket.ticket_id} />
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
