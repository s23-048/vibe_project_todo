import React, { useState } from 'react';
import api from '../api/client';
import { UserPlus, Loader2 } from 'lucide-react';

const AddMemberControl = ({ projectId, onMemberAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email: email.trim() });
      setSuccess(`${res.data.member.user?.name || email} added!`);
      setEmail('');
      onMemberAdded(res.data.member);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="flex items-center gap-2">
      <input
        type="email"
        placeholder="Add member by email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-lg glass-input text-xs placeholder-slate-500 w-48"
        id="add-member-email-input"
      />
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-400 border border-brand-500/20 hover:bg-brand-500/10 transition-all disabled:opacity-40"
        id="add-member-submit-button"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
        Add
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
      {success && <span className="text-[10px] text-emerald-400">{success}</span>}
    </form>
  );
};

export default AddMemberControl;
