import { create } from 'zustand';

const useStore = create((set) => ({
  // Notes
  notes: [],
  setNotes: (notes) => set({ notes }),

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
