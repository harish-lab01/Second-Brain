import { create } from 'zustand';

const useStore = create((set) => ({
  // Notes
  notes: [],
  setNotes: (notes) => set({ notes }),

  // Collections — stored globally so NoteCard can read them without a prop
  collections: [],
  setCollections: (collections) => set({ collections }),

  // Toast
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),

  // Active chat
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
}));

export default useStore;
