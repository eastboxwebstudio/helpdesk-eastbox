import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function TicketComments({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    setComments(response.data.comments || []);
  };

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    await api.post(`/tickets/${ticketId}/comments`, { message });
    setMessage('');
    await fetchComments();
    setLoading(false);
  };

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <div className="mb-2 space-y-2">
        {comments.map((comment) => (
          <p className="text-xs text-slate-600" key={comment.comment_id}>
            <span className="font-medium">{comment.user_id}:</span> {comment.message}
          </p>
        ))}
        {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
      </div>
      <form onSubmit={submitComment} className="flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1 text-sm"
          placeholder="Add update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
