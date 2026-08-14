import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string; 
  listingId: string;
  type: string;
  title: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  participants: number;
  roomTypeId?: string;
  roomTypeName?: string;
  addOnIds: string[];
  totalMinor: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalMinor: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ 
        items: [...state.items, { ...item, id: crypto.randomUUID() }] 
      })),
      removeItem: (id) => set((state) => ({ 
        items: state.items.filter((item) => item.id !== id) 
      })),
      clearCart: () => set({ items: [] }),
      getTotalMinor: () => get().items.reduce((sum, item) => sum + item.totalMinor, 0),
    }),
    {
      name: 'safarinexa-cart',
    }
  )
);
