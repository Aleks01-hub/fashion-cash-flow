import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  customers as seedCustomers,
  products as seedProducts,
  reservations as seedReservations,
  stores,
  type Customer,
  type Product,
  type Reservation,
} from "./mock-data";
import { brl, isOverdue } from "./format";

export type ParsedCommand =
  | {
      type: "venda";
      produto: string;
      cor: string;
      tamanho: string;
      quantidade: number;
      forma_pagamento: string;
      valor: number;
      productId: string;
    }
  | {
      type: "abate_av";
      cliente: string;
      customerId: string;
      valor: number;
      forma_pagamento: string;
    };

type Ctx = {
  products: Product[];
  customers: Customer[];
  reservations: Reservation[];
  store: string;
  setStore: (s: string) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  registerSale: (c: Extract<ParsedCommand, { type: "venda" }>) => void;
  registerAv: (c: Extract<ParsedCommand, { type: "abate_av" }>) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (c: Omit<Customer, "id" | "payments" | "purchases">) => void;
  restock: (productId: string, color: string, size: string, qty: number) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  feed: { id: string; text: string; at: string }[];
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [reservations] = useState<Reservation[]>(seedReservations);
  const [store, setStore] = useState<string>(stores[0]!);
  const [online, setOnline] = useState(true);
  const [feed, setFeed] = useState<{ id: string; text: string; at: string }[]>([]);

  const push = useCallback((text: string) => {
    const entry = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
    setFeed((f) => [entry, ...f].slice(0, 20));
    toast(text, { description: online ? "Sincronizado em tempo real" : "Salvo localmente (offline)" });
  }, [online]);

  const registerSale = useCallback(
    (c: Extract<ParsedCommand, { type: "venda" }>) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== c.productId
            ? p
            : {
                ...p,
                variations: p.variations.map((v) =>
                  v.color === c.cor && v.size === c.tamanho
                    ? { ...v, qty: Math.max(0, v.qty - c.quantidade) }
                    : v,
                ),
              },
        ),
      );
      push(`Venda registrada: ${c.produto} ${c.cor} ${c.tamanho} — ${brl(c.valor)} (${c.forma_pagamento})`);
    },
    [push],
  );

  const registerAv = useCallback(
    (c: Extract<ParsedCommand, { type: "abate_av" }>) => {
      setCustomers((prev) =>
        prev.map((cu) => {
          if (cu.id !== c.customerId || !cu.av) return cu;
          const balance = Math.max(0, cu.av.balance - c.valor);
          return {
            ...cu,
            av: { ...cu.av, balance },
            payments: [
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                amount: c.valor,
                method: c.forma_pagamento,
                balanceAfter: balance,
              },
              ...cu.payments,
            ],
          };
        }),
      );
      push(`Vendedor Alex registrou abate de ${brl(c.valor)} no AV de ${c.cliente} (${c.forma_pagamento})`);
    },
    [push],
  );

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const addCustomer = useCallback(
    (c: Omit<Customer, "id" | "payments" | "purchases">) => {
      setCustomers((prev) => [{ ...c, id: crypto.randomUUID(), payments: [], purchases: [] }, ...prev]);
      push(`Nova ficha cadastrada: ${c.name}`);
    },
    [push],
  );

  const restock = useCallback(
    (productId: string, color: string, size: string, qty: number) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== productId
            ? p
            : {
                ...p,
                variations: p.variations.map((v) =>
                  v.color === color && v.size === size ? { ...v, qty: v.qty + qty } : v,
                ),
              },
        ),
      );
      push(`Entrada de estoque (Aba de Viagem): ${color} ${size} +${qty}`);
    },
    [push],
  );

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const value = useMemo(
    () => ({
      products,
      customers,
      reservations,
      store,
      setStore,
      online,
      setOnline,
      registerSale,
      registerAv,
      updateCustomer,
      addCustomer,
      restock,
      updateProduct,
      feed,
    }),
    [products, customers, reservations, store, online, registerSale, registerAv, updateCustomer, addCustomer, restock, updateProduct, feed],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa do StoreProvider");
  return ctx;
}

export const customerStatus = (c: Customer) =>
  c.av && c.av.balance > 0 && isOverdue(c.av.dueDate) ? "atraso" : "em_dia";
