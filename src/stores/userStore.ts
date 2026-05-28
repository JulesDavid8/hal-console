import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
}

type UserAlert = Record<string, unknown>;

interface UserState {
  currentUser: User | null;
  users: Record<string, User>; // userId -> user

  // Actions
  setCurrentUser: (user: User) => void;
  createUser: (name: string, email?: string) => User;
  logout: () => void;
  getUserAlerts: (userId: string) => UserAlert[]; // placeholder for now
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: {},

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      createUser: (name, email) => {
        const newUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          users: { ...state.users, [newUser.id]: newUser },
          currentUser: newUser,
        }));

        return newUser;
      },

      logout: () => {
        set({ currentUser: null });
      },

      getUserAlerts: (userId) => {
        // Placeholder - will be replaced with real alert storage per user
        void userId;
        return [];
      },
    }),
    {
      name: 'hal-user-storage',
    }
  )
);
