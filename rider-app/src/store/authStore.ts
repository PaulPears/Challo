import { create } from 'zustand';

interface AuthState {
  reqId: string | null;
  setReqId: (reqId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  reqId: null,
  setReqId: (reqId) => set({ reqId }),
}));
