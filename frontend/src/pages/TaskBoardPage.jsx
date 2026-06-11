import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import TaskColumn from '../components/TaskColumn';
import CreateTaskModal from '../components/CreateTaskModal';
import { connectSocket, joinProject, leaveProject, getSocket } from '../services/socket';

const STATUSES = ['todo', 'in-progress', 'done'];

export default function TaskBoardPage() {
  const { projectId } = useParams();
  const { tasks, fetchTasks, loading, applySocketCreate, applySocketUpdate, applySocketDelete, clearTasks } =
    useTaskStore();
  const { currentProject, fetchProject } = useProjectStore();
  const { token } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
    fetchTasks(projectId);

    // Connect socket and join project room for real-time task updates
    const socket = connectSocket(token);
    joinProject(projectId);

    // Socket may already be connected (e.g. opened at login), so the 'connect'
    // event won't fire again — seed the indicator from the current state.
    setConnected(socket.connected);
    socket.on('connect', () => {
      setConnected(true);
      joinProject(projectId); // re-join room after a reconnect
    });
    socket.on('disconnect', () => setConnected(false));

    // Apply real-time task events emitted by the server
    socket.on('task:created', applySocketCreate);
    socket.on('task:updated', applySocketUpdate);
    socket.on('task:deleted', applySocketDelete);

    return () => {
      leaveProject(projectId);
      socket.off('task:created', applySocketCreate);
      socket.off('task:updated', applySocketUpdate);
      socket.off('task:deleted', applySocketDelete);
      clearTasks();
    };
  }, [projectId]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Projects
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          {currentProject?.name || 'Loading...'}
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {connected ? 'Live' : 'Connecting...'}
          </span>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-1.5">
            + Add Task
          </button>
        </div>
      </div>

      {currentProject?.description && (
        <p className="text-gray-500 text-sm mb-5">{currentProject.description}</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            projectId={projectId}
          />
        ))}
      </div>

      {showModal && (
        <CreateTaskModal projectId={projectId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
