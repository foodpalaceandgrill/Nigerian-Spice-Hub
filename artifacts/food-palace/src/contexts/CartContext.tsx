import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";

export interface CartItem {
  id: string; // unique local ID for the cart item (since multiple items can be the same product with different addons)
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  addonIds?: number[];
  addonNames?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("food_palace_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("food_palace_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Check if exact same item exists (same product, variant, addons, notes)
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId &&
          JSON.stringify(i.addonIds?.sort() || []) === JSON.stringify(item.addonIds?.sort() || []) &&
          i.notes === item.notes
      );

      if (existingIndex >= 0) {
        const newItems = [...prev];
        const existing = newItems[existingIndex];
        const newQuantity = existing.quantity + item.quantity;
        newItems[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          totalPrice: newQuantity * existing.unitPrice,
        };
        return newItems;
      }

      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}