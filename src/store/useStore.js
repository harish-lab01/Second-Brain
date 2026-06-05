import { create } from 'zustand';

const useStore = create((set) => ({
  // Notes
  notes: [],
  setNotes: (notes) => set({ notes }),

  // Collections — globally available so NoteCard can read without prop drilling
  collections: [],
  setCollections: (collections) => set({ collections }),

  // Toast — single source of truth, NO auto-timeout here.
  // Toast.jsx handles its own timeout via useEffect to avoid double-timer.
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type, id: Date.now() } });
  },
  clearToast: () => set({ toast: null }),

  // Active chat
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
}));

export default useStore;
