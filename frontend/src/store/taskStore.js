import { create } from 'zustand';
import api from '../services/api';

const STATUSES = ['todo', 'in-progress', 'done'];

export const useTaskStore = create((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`);
      set({ tasks: data.tasks, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load tasks', loading: false });
    }
  },

  createTask: async (projectId, payload) => {
    const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
    set((state) => ({ tasks: [data.task, ...state.tasks] }));
    return data.task;
  },

  updateTask: async (projectId, taskId, updates) => {
    const { data } = await api.put(`/projects/${projectId}/tasks/${taskId}`, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? data.task : t)),
    }));
    return data.task;
  },

  deleteTask: async (projectId, taskId) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
  },

  // Called by socket events to sync remote changes without HTTP round-trip
  applySocketCreate: (task) => {
    set((state) => {
      if (state.tasks.find((t) => t._id === task._id)) return state;
      return { tasks: [task, ...state.tasks] };
    });
  },

  applySocketUpdate: (task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
    }));
  },

  applySocketDelete: ({ _id }) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== _id) }));
  },

  getByStatus: (status) => {
    return useTaskStore.getState().tasks.filter((t) => t.status === status);
  },

  clearTasks: () => set({ tasks: [], error: null }),

  STATUSES,
}));
