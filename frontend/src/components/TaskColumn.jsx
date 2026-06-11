import toast from 'react-hot-toast';
import TaskCard from './TaskCard';
import { useTaskStore } from '../store/taskStore';

const STATUS_META = {
  todo: { label: 'To Do', color: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
};

const NEXT_STATUS = { todo: 'in-progress', 'in-progress': 'done', done: null };

export default function TaskColumn({ status, tasks, projectId }) {
  const { updateTask } = useTaskStore();
  const meta = STATUS_META[status];

  const handleDrop = async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('status');
    if (currentStatus === status) return;
    try {
      await updateTask(projectId, taskId, { status });
      toast.success('Task moved');
    } catch {
      toast.error('Failed to move task');
    }
  };

  return (
    <div
      className="flex-1 min-w-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
        <span className="ml-auto text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="p-3 flex-1 min-h-[200px]">
        {tasks.map((task) => (
          <div
            key={task._id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task._id);
              e.dataTransfer.setData('status', task.status);
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <TaskCard task={task} projectId={projectId} />
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">Drop tasks here</p>
        )}
      </div>
    </div>
  );
}
