import { create } from 'zustand';
import api from '../services/api';

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data.projects, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load projects', loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/projects/${id}`);
      set({ currentProject: data.project, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load project', loading: false });
    }
  },

  createProject: async (payload) => {
    const { data } = await api.post('/projects', payload);
    set((state) => ({ projects: [data.project, ...state.projects] }));
    return data.project;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({ projects: state.projects.filter((p) => p._id !== id) }));
  },

  clearCurrentProject: () => set({ currentProject: null }),
}));
