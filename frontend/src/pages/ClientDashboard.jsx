import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../lib/api';
import TicketComments from '../components/TicketComments';

const emptyTicket = { subject: '', category: 'General', description: '', urgency: 'Medium' };

export default function ClientDashboard() {
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState(emptyTicket);

  const fetchTickets = async () => {
    const response = await api.get('/tickets/my');
    setTickets(response.data.tickets || []);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const createTicket = async (event) => {
    event.preventDefault();
    await api.post('/tickets', formData);
    setFormData(emptyTicket);
    fetchTickets();
  };

  return (
    <DashboardLayout title="Client Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={createTicket} className="space-y-3 rounded-xl border bg-white p-4 lg:col-span-1">
          <h2 className="font-semibold">Open New Ticket</h2>
          <input className="w-full rounded border px-3 py-2" placeholder="Title" value={formData.subject} onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))} required />
          <input className="w-full rounded border px-3 py-2" placeholder="Category" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} required />
          <textarea className="w-full rounded border px-3 py-2" placeholder="Description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} required />
          <select className="w-full rounded border px-3 py-2" value={formData.urgency} onChange={(e) => setFormData((p) => ({ ...p, urgency: e.target.value }))}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
          <button className="w-full rounded bg-blue-600 py-2 text-white">Submit Ticket</button>
        </form>

        <section className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">My Tickets</h2>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <article key={ticket.ticket_id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{ticket.subject}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{ticket.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
                <p className="mt-2 text-xs text-slate-500">Urgency: {ticket.urgency} · Category: {ticket.category}</p>
                <TicketComments ticketId={ticket.ticket_id} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
