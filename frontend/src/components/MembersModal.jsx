import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProjectStore } from '../store/projectStore';

export default function MembersModal({ project, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addMemberByEmail } = useProjectStore();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter an email');
    setLoading(true);
    try {
      await addMemberByEmail(project._id, email.trim());
      toast.success('Member added!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Project Members</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input flex-1"
            placeholder="Add member by email"
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        <p className="text-xs font-medium text-gray-500 mb-2">
          {(project.members || []).length} member(s)
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {(project.members || []).map((m) => (
            <div key={m._id || m} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-medium">
                {(m.name || '?').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{m.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 truncate">{m.email}</p>
              </div>
              {project.owner?._id === (m._id || m) && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">owner</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
