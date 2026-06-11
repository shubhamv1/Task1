import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Zustand chosen over Redux: no boilerplate, built-in persistence, direct state mutation via immer-style setters.
// For this app's scale, Redux would add complexity without benefit.
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (credentials) => {
        set({ loading: true });
        const { data } = await api.post('/auth/login', credentials);
        set({ user: data.user, token: data.token, loading: false });
        return data;
      },

      register: async (userData) => {
        set({ loading: true });
        const { data } = await api.post('/auth/register', userData);
        set({ user: data.user, token: data.token, loading: false });
        return data;
      },

      loadUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch {
          set({ user: null, token: null });
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
