import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { customers as seedCustomers, products as seedProducts, reservations as seedReservations, sales as seedSales, stores, type Customer, type Product, type Reservation, type Sale, type SalePaymentMethod } from "./mock-data";
import { brl, isOverdue } from "./format";

export type ParsedCommand =
  | { type: "venda"; produto: string; cor: string; tamanho: string; quantidade: number; forma_pagamento: string; valor: number; productId: string }
  | { type: "abate_av"; cliente: string; customerId: string; valor: number; forma_pagamento: string };

type NewSale = Omit<Sale, "id" | "number" | "date" | "store" | "paymentStatus"> & { store?: string };

type Ctx = {
  products: Product[]; customers: Customer[]; reservations: Reservation[]; sales: Sale[];
  store: string; setStore: (s: string) => void; online: boolean; setOnline: (v: boolean) => void;
  registerSale: (c: Extract<ParsedCommand, { type: "venda" }>) => void;
  createSale: (sale: NewSale) => boolean; updateSale: (id: string, sale: NewSale) => boolean; cancelSale: (id: string) => boolean;
  registerAv: (c: Extract<ParsedCommand, { type: "abate_av" }>) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (c: Omit<Customer, "id" | "payments" | "purchases">) => void;
  restock: (productId: string, color: string, size: string, qty: number) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void; addProduct: (p: Omit<Product, "id">) => void; deleteProduct: (id: string) => void;
  addLedgerPurchase: (customerId: string, items: string, price: number) => void; addLedgerPayment: (customerId: string, amount: number, method: string) => void;
  feed: { id: string; text: string; at: string }[];
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => { try { return JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem("modah:products") || "null" : "null") ?? seedProducts; } catch { return seedProducts; } });
  const [customers, setCustomers] = useState<Customer[]>(() => { try { const saved = JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem("modah:customers") || "null" : "null") ?? seedCustomers; return saved.map((c: Customer) => ({ ...c, birthDate: c.birthDate || c.notes?.match(/Nascimento:\\s*(\\d{4}-\\d{2}-\\d{2})/)?.[1] || "" })); } catch { return seedCustomers; } });
  const [reservations] = useState<Reservation[]>(seedReservations);
  const [sales, setSales] = useState<Sale[]>(() => { try { return JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem("modah:sales") || "null" : "null") ?? seedSales; } catch { return seedSales; } });
  const [store, setStore] = useState<string>(stores[0]!);
  const [online, setOnline] = useState(true);
  const [feed, setFeed] = useState<{ id: string; text: string; at: string }[]>([]);

  useEffect(() => { window.localStorage.setItem("modah:products", JSON.stringify(products)); }, [products]);
  useEffect(() => { window.localStorage.setItem("modah:customers", JSON.stringify(customers)); }, [customers]);
  useEffect(() => { window.localStorage.setItem("modah:sales", JSON.stringify(sales)); }, [sales]);

  const push = useCallback((text: string) => {
    const entry = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
    setFeed((f) => [entry, ...f].slice(0, 20));
    toast(text, { description: online ? "Sincronizado em tempo real" : "Salvo localmente (offline)" });
  }, [online]);

  const createSale = useCallback((sale: NewSale) => {
    if (!sale.items.length || sale.total <= 0) { toast.error("Adicione itens e um valor válido."); return false; }
    const stock = new Map<string, number>();
    for (const item of sale.items) {
      const key = item.productId + "|" + item.color + "|" + item.size;
      const product = products.find((p) => p.id === item.productId);
      const variation = product?.variations.find((v) => v.color === item.color && v.size === item.size);
      const available = variation?.qty ?? 0;
      const used = stock.get(key) ?? 0;
      if (!variation || available - used < item.quantity) { toast.error("Estoque insuficiente para concluir a venda."); return false; }
      stock.set(key, used + item.quantity);
    }
    setProducts((prev) => prev.map((p) => ({
      ...p,
      variations: p.variations.map((v) => {
        const key = p.id + "|" + v.color + "|" + v.size;
        const sold = stock.get(key) ?? 0;
        return sold ? { ...v, qty: v.qty - sold } : v;
      }),
    })));

    const number = sales.reduce((max, s) => Math.max(max, s.number), 1000) + 1;
    const date = new Date().toISOString();
    const record: Sale = {
      ...sale, id: crypto.randomUUID(), number, date, store: sale.store || store,
      paymentStatus: sale.paymentMethod === "Ficha (AV)" && sale.amountPaid < sale.total ? "pendente" : "pago",
    };
    setSales((prev) => [record, ...prev]);

    if (sale.customerId) {
      setCustomers((prev) => prev.map((c) => {
        if (c.id !== sale.customerId) return c;
        const itemsText = sale.items.map((i) => i.productName + " " + i.color + " " + i.size + " x" + i.quantity).join(", ");
        if (sale.paymentMethod !== "Ficha (AV)") {
          return { ...c, purchases: [{ id: record.id, date, items: itemsText, price: sale.total, method: sale.paymentMethod }, ...c.purchases] };
        }
        const av = c.av
          ? { ...c.av, total: c.av.total + sale.total, balance: c.av.balance + Math.max(0, sale.total - sale.amountPaid) }
          : { total: sale.total, balance: Math.max(0, sale.total - sale.amountPaid), dueDate: sale.dueDate ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) };
        return {
          ...c, av,
          purchases: [{ id: record.id, date, items: itemsText, price: sale.total, method: "Ficha (AV)" }, ...c.purchases],
          payments: sale.amountPaid > 0 ? [{ id: crypto.randomUUID(), date, amount: sale.amountPaid, method: sale.paymentMethod, balanceAfter: av.balance }, ...c.payments] : c.payments,
        };
      }));
    }
    push("Venda #" + number + " registrada — " + brl(sale.total) + " (" + sale.paymentMethod + ")");
    return true;
  }, [push, products, sales, store]);

  const updateSale = useCallback((id: string, sale: NewSale) => {
    const old = sales.find((s) => s.id === id);
    if (!old) return false;
    setProducts((prev) => prev.map((p) => {
      const oldItems = old.items.filter((i) => i.productId === p.id);
      const newItems = sale.items.filter((i) => i.productId === p.id);
      return { ...p, variations: p.variations.map((v) => {
        const returned = oldItems.filter((i) => i.color === v.color && i.size === v.size).reduce((n, i) => n + i.quantity, 0);
        const sold = newItems.filter((i) => i.color === v.color && i.size === v.size).reduce((n, i) => n + i.quantity, 0);
        return returned || sold ? { ...v, qty: v.qty + returned - sold } : v;
      }) };
    }));
    const record: Sale = { ...sale, id, number: old.number, date: old.date, store: sale.store || store, paymentStatus: sale.paymentMethod === "Ficha (AV)" && sale.amountPaid < sale.total ? "pendente" : "pago" };
    setSales((prev) => prev.map((s) => s.id === id ? record : s));
    if (sale.customerId) {
      setCustomers((prev) => prev.map((c) => c.id === sale.customerId ? { ...c, purchases: [{ id, date: old.date, items: sale.items.map((i) => i.productName + " " + i.color + " " + i.size + " x" + i.quantity).join(", "), price: sale.total, method: sale.paymentMethod }, ...c.purchases.filter((p) => p.id !== id)] } : c));
    }
    push("Venda #" + old.number + " editada");
    return true;
  }, [push, sales, store]);

  const cancelSale = useCallback((id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return false;
    setProducts((prev) => prev.map((p) => {
      const items = sale.items.filter((i) => i.productId === p.id);
      if (!items.length) return p;
      return { ...p, variations: p.variations.map((v) => {
        const qty = items.filter((i) => i.color === v.color && i.size === v.size).reduce((sum, i) => sum + i.quantity, 0);
        return qty ? { ...v, qty: v.qty + qty } : v;
      }) };
    }));
    setSales((prev) => prev.filter((s) => s.id !== id));
    push("Venda #" + sale.number + " cancelada e estoque estornado");
    return true;
  }, [push, sales]);

  const registerSale = useCallback((c: Extract<ParsedCommand, { type: "venda" }>) => {
    createSale({
      customerId: null, customerName: "Consumidor não identificado", seller: "Alex",
      items: [{ id: crypto.randomUUID(), productId: c.productId, productName: c.produto, color: c.cor, size: c.tamanho, quantity: c.quantidade, unitPrice: c.valor / c.quantidade, discount: 0, total: c.valor }],
      subtotal: c.valor, discount: 0, total: c.valor, paymentMethod: c.forma_pagamento as SalePaymentMethod,
      amountPaid: c.valor, change: 0, dueDate: null, notes: "",
    });
  }, [createSale]);

  const registerAv = useCallback((c: Extract<ParsedCommand, { type: "abate_av" }>) => {
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== c.customerId || !cu.av) return cu;
      const balance = Math.max(0, cu.av.balance - c.valor);
      return { ...cu, av: { ...cu.av, balance }, payments: [{ id: crypto.randomUUID(), date: new Date().toISOString(), amount: c.valor, method: c.forma_pagamento, balanceAfter: balance }, ...cu.payments] };
    }));
    push("Vendedor Alex registrou abate de " + brl(c.valor) + " no AV de " + c.cliente + " (" + c.forma_pagamento + ")");
  }, [push]);

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c)), []);
  const addCustomer = useCallback((c: Omit<Customer, "id" | "payments" | "purchases">) => {
    setCustomers((prev) => [{ ...c, id: crypto.randomUUID(), payments: [], purchases: [] }, ...prev]);
    push("Nova ficha cadastrada: " + c.name);
  }, [push]);
  const restock = useCallback((productId: string, color: string, size: string, qty: number) => {
    setProducts((prev) => prev.map((p) => p.id !== productId ? p : { ...p, variations: p.variations.map((v) => v.color === color && v.size === size ? { ...v, qty: v.qty + qty } : v) }));
    push("Entrada de estoque: " + color + " " + size + " +" + qty);
  }, [push]);
  const updateProduct = useCallback((id: string, patch: Partial<Product>) => setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p)), []);
  const addProduct = useCallback((p: Omit<Product, "id">) => setProducts((prev) => [{ ...p, id: crypto.randomUUID() }, ...prev]), []);
  const deleteProduct = useCallback((id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)), []);
  const addLedgerPurchase = useCallback((customerId: string, items: string, price: number) => {
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== customerId) return cu;
      const av = cu.av ? { ...cu.av, total: cu.av.total + price, balance: cu.av.balance + price } : { total: price, balance: price, dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0,10) };
      return { ...cu, av, purchases: [{ id: crypto.randomUUID(), date: new Date().toISOString(), items, price, method: "Ficha (AV)" }, ...cu.purchases] };
    }));
    push("Compra na ficha: " + items + " — " + brl(price));
  }, [push]);
  const addLedgerPayment = useCallback((customerId: string, amount: number, method: string) => {
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== customerId || !cu.av) return cu;
      const balance = Math.max(0, cu.av.balance - amount);
      return { ...cu, av: { ...cu.av, balance }, payments: [{ id: crypto.randomUUID(), date: new Date().toISOString(), amount, method, balanceAfter: balance }, ...cu.payments] };
    }));
    push("Abatimento de " + brl(amount) + " registrado (" + method + ")");
  }, [push]);

  const value = useMemo(() => ({ products, customers, reservations, sales, store, setStore, online, setOnline, registerSale, createSale, updateSale, cancelSale, registerAv, updateCustomer, addCustomer, restock, updateProduct, addProduct, deleteProduct, addLedgerPurchase, addLedgerPayment, feed }), [products, customers, reservations, sales, store, online, registerSale, createSale, updateSale, cancelSale, registerAv, updateCustomer, addCustomer, restock, updateProduct, addProduct, deleteProduct, addLedgerPurchase, addLedgerPayment, feed]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa do StoreProvider");
  return ctx;
}

export const customerStatus = (c: Customer) => c.av && c.av.balance > 0 && isOverdue(c.av.dueDate) ? "atraso" : "em_dia";
