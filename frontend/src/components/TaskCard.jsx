import toast from 'react-hot-toast';
import { useTaskStore } from '../store/taskStore';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function TaskCard({ task, projectId }) {
  const { deleteTask } = useTaskStore();

  const handleDelete = async () => {
    try {
      await deleteTask(projectId, task._id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="card mb-3 group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-gray-800 leading-snug flex-1">{task.title}</p>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity shrink-0"
          title="Delete task"
        >
          ✕
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {task.assignee.name}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        by {task.createdBy?.name} · {new Date(task.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
