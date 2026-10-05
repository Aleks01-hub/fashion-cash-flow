import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { customers as seedCustomers, products as seedProducts, reservations as seedReservations, sales as seedSales, stores, type Customer, type Product, type Reservation, type Sale, type SalePaymentMethod } from "./mock-data";
import { brl, isOverdue } from "./format";

export type ParsedCommand =
  | { type: "venda"; produto: string; cor: string; tamanho: string; quantidade: number; forma_pagamento: string; valor: number; productId: string }
  | { type: "abate_av"; cliente: string; customerId: string; valor: number; forma_pagamento: string };

export type StockMovement = {
  id: string; date: string; type: "venda" | "entrada" | "troca" | "ajuste" | "compra" | "devolução";
  productId: string; productName: string; color: string; size: string; quantity: number; note: string;
};

export type ExchangeRecord = {
  id: string; date: string; saleId: string; saleNumber: number; customerId: string | null; customerName: string;
  returned: { saleItemId: string; productId: string; productName: string; color: string; size: string; quantity: number; unitPrice: number };
  replacement: { productId: string; productName: string; color: string; size: string; quantity: number; unitPrice: number } | null;
  difference: number; notes: string;
};

type NewSale = Omit<Sale, "id" | "number" | "date" | "store" | "paymentStatus"> & { store?: string };

type Ctx = {
  products: Product[]; customers: Customer[]; reservations: Reservation[]; sales: Sale[];
  exchanges: ExchangeRecord[]; stockMovements: StockMovement[];
  store: string; setStore: (s: string) => void; online: boolean; setOnline: (v: boolean) => void;
  registerSale: (c: Extract<ParsedCommand, { type: "venda" }>) => void;
  createSale: (sale: NewSale) => boolean; updateSale: (id: string, sale: NewSale) => boolean; cancelSale: (id: string) => boolean;
  registerExchange: (input: { saleId: string; returnedItemId: string; returnedQty: number; replacement: { productId: string; color: string; size: string; quantity: number } | null; difference: number; notes: string }) => boolean;
  registerAv: (c: Extract<ParsedCommand, { type: "abate_av" }>) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (c: Omit<Customer, "id" | "payments" | "purchases">) => void;
  restock: (productId: string, color: string, size: string, qty: number, note?: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void; addProduct: (p: Omit<Product, "id">) => void; deleteProduct: (id: string) => void;
  addLedgerPurchase: (customerId: string, items: string, price: number) => void; addLedgerPayment: (customerId: string, amount: number, method: string) => void;
  setAvPlan: (customerId: string, installments: number) => void;
  feed: { id: string; text: string; at: string }[];
};

const StoreContext = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

const saleItemsText = (sale: Pick<Sale, "items">) =>
  sale.items.map((i) => i.productName + " " + i.color + " " + i.size + " x" + i.quantity).join(", ");


function sendConfiguredWhatsApp(event: "compra" | "pagamento" | "parcelamento", data: Record<string,string>) {
  if (typeof window === "undefined") return;
  try {
    const cfg = JSON.parse(window.localStorage.getItem("modah:whatsapp-messages") || "null");
    if (!cfg?.enabled || !cfg.apiUrl || !data.phone) return;
    const templates: Record<string,string> = { compra: cfg.compra, pagamento: cfg.pagamento, parcelamento: cfg.parcelamento };
    const template = templates[event];
    if (!template) return;
    const message = String(template).replace(/\{(\w+)\}/g, (_: string, key: string) => data[key] ?? "");
    void fetch(cfg.apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: data.phone, message, event }) }).catch(() => {});
  } catch {}
}

function applySaleToCustomer(customer: Customer, sale: Pick<Sale, "customerId" | "paymentMethod" | "total" | "amountPaid" | "dueDate" | "items">, saleId: string, sign: 1 | -1, date: string) {
  const purchaseId = saleId;
  if (sign === -1) {
    const purchaseRemoved = customer.purchases.some((p) => p.id === purchaseId);
    const outstanding = sale.paymentMethod === "Ficha (AV)" ? Math.max(0, sale.total - sale.amountPaid) : 0;
    const av = customer.av && sale.paymentMethod === "Ficha (AV)"
      ? { ...customer.av, total: Math.max(0, customer.av.total - sale.total), balance: Math.max(0, customer.av.balance - outstanding) }
      : customer.av;
    return {
      ...customer,
      av,
      purchases: purchaseRemoved ? customer.purchases.filter((p) => p.id !== purchaseId) : customer.purchases,
      payments: customer.payments.filter((p) => p.saleId !== saleId),
    };
  }

  const purchase = { id: purchaseId, date, items: saleItemsText(sale), price: sale.total, method: sale.paymentMethod };
  if (sale.paymentMethod !== "Ficha (AV)") return { ...customer, purchases: [purchase, ...customer.purchases.filter((p) => p.id !== purchaseId)] };

  const outstanding = Math.max(0, sale.total - sale.amountPaid);
  const avBase = customer.av ?? { total: 0, balance: 0, dueDate: sale.dueDate ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) };
  const newBalance = avBase.balance + outstanding;
  return {
    ...customer,
    av: { ...avBase, total: avBase.total + sale.total, balance: newBalance, dueDate: sale.dueDate ?? avBase.dueDate },
    purchases: [{ ...purchase, method: "Ficha (AV)" }, ...customer.purchases.filter((p) => p.id !== purchaseId)],
    payments: sale.amountPaid > 0
      ? [{ id: crypto.randomUUID(), saleId, date, amount: sale.amountPaid, method: sale.paymentMethod, balanceAfter: newBalance }, ...customer.payments.filter((p) => p.saleId !== saleId)]
      : customer.payments.filter((p) => p.saleId !== saleId),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => load("modah:products", seedProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => load<Customer[]>("modah:customers", seedCustomers).map((c) => ({ ...c, birthDate: c.birthDate || c.notes?.match(/Nascimento:\s*(\d{4}-\d{2}-\d{2})/)?.[1] || "" })));
  const [reservations] = useState<Reservation[]>(seedReservations);
  const [sales, setSales] = useState<Sale[]>(() => load("modah:sales", seedSales));
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>(() => load("modah:exchanges", []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => load("modah:stock-movements", []));
  const [store, setStore] = useState<string>(stores[0]!);
  const [online, setOnline] = useState(true);
  const [feed, setFeed] = useState<{ id: string; text: string; at: string }[]>([]);

  useEffect(() => { window.localStorage.setItem("modah:products", JSON.stringify(products)); }, [products]);
  useEffect(() => { window.localStorage.setItem("modah:customers", JSON.stringify(customers)); }, [customers]);
  useEffect(() => { window.localStorage.setItem("modah:sales", JSON.stringify(sales)); }, [sales]);
  useEffect(() => { window.localStorage.setItem("modah:exchanges", JSON.stringify(exchanges)); }, [exchanges]);
  useEffect(() => { window.localStorage.setItem("modah:stock-movements", JSON.stringify(stockMovements.slice(0, 500))); }, [stockMovements]);

  const pushMovement = useCallback((movement: Omit<StockMovement, "id" | "date">) => {
    setStockMovements((prev) => [{ ...movement, id: crypto.randomUUID(), date: new Date().toISOString() }, ...prev].slice(0, 500));
  }, []);

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
      const used = stock.get(key) ?? 0;
      if (!variation || variation.qty - used < item.quantity) { toast.error("Estoque insuficiente para concluir a venda."); return false; }
      stock.set(key, used + item.quantity);
    }
    setProducts((prev) => prev.map((p) => ({
      ...p,
      variations: p.variations.map((v) => {
        const sold = stock.get(p.id + "|" + v.color + "|" + v.size) ?? 0;
        return sold ? { ...v, qty: v.qty - sold } : v;
      }),
    })));

    const number = sales.reduce((max, s) => Math.max(max, s.number), 1000) + 1;
    const date = new Date().toISOString();
    const record: Sale = { ...sale, id: crypto.randomUUID(), number, date, store: sale.store || store, paymentStatus: sale.paymentMethod === "Ficha (AV)" && sale.amountPaid < sale.total ? "pendente" : "pago" };
    setSales((prev) => [record, ...prev]);

    for (const item of sale.items) pushMovement({ type: "venda", productId: item.productId, productName: item.productName, color: item.color, size: item.size, quantity: -item.quantity, note: "Venda #" + number });
    if (sale.customerId) setCustomers((prev) => prev.map((c) => c.id === sale.customerId ? applySaleToCustomer(c, record, record.id, 1, date) : c));
    push("Venda #" + number + " registrada — " + brl(sale.total) + " (" + sale.paymentMethod + ")");
    return true;
  }, [push, products, sales, store, pushMovement]);

  const updateSale = useCallback((id: string, sale: NewSale) => {
    const old = sales.find((s) => s.id === id);
    if (!old) return false;
    const needs = new Map<string, number>();
    sale.items.forEach((i) => needs.set(i.productId + "|" + i.color + "|" + i.size, (needs.get(i.productId + "|" + i.color + "|" + i.size) ?? 0) + i.quantity));
    for (const [key, qty] of needs) {
      const [productId, color, size] = key.split("|");
      const product = products.find((p) => p.id === productId);
      const variation = product?.variations.find((v) => v.color === color && v.size === size);
      const oldQty = old.items.filter((i) => i.productId === productId && i.color === color && i.size === size).reduce((n, i) => n + i.quantity, 0);
      if (!variation || variation.qty + oldQty < qty) { toast.error("A nova venda não cabe no estoque disponível."); return false; }
    }

    setProducts((prev) => prev.map((p) => ({
      ...p,
      variations: p.variations.map((v) => {
        const key = p.id + "|" + v.color + "|" + v.size;
        const oldQty = old.items.filter((i) => i.productId + "|" + i.color + "|" + i.size === key).reduce((n, i) => n + i.quantity, 0);
        const newQty = sale.items.filter((i) => i.productId + "|" + i.color + "|" + i.size === key).reduce((n, i) => n + i.quantity, 0);
        return oldQty || newQty ? { ...v, qty: v.qty + oldQty - newQty } : v;
      }),
    })));

    const record: Sale = { ...sale, id, number: old.number, date: old.date, store: sale.store || store, paymentStatus: sale.paymentMethod === "Ficha (AV)" && sale.amountPaid < sale.total ? "pendente" : "pago" };
    setSales((prev) => prev.map((s) => s.id === id ? record : s));
    old.items.forEach((i) => pushMovement({ type: "ajuste", productId: i.productId, productName: i.productName, color: i.color, size: i.size, quantity: i.quantity, note: "Estorno para edição da venda #" + old.number }));
    sale.items.forEach((i) => pushMovement({ type: "venda", productId: i.productId, productName: i.productName, color: i.color, size: i.size, quantity: -i.quantity, note: "Nova composição da venda #" + old.number }));
    setCustomers((prev) => {
      let next = prev;
      if (old.customerId) next = next.map((c) => c.id === old.customerId ? applySaleToCustomer(c, old, old.id, -1, old.date) : c);
      if (sale.customerId) next = next.map((c) => c.id === sale.customerId ? applySaleToCustomer(c, record, id, 1, old.date) : c);
      return next;
    });
    push("Venda #" + old.number + " editada");
    return true;
  }, [push, products, sales, store, pushMovement]);

  const cancelSale = useCallback((id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return false;
    setProducts((prev) => prev.map((p) => {
      const items = sale.items.filter((i) => i.productId === p.id);
      return items.length ? { ...p, variations: p.variations.map((v) => {
        const qty = items.filter((i) => i.color === v.color && i.size === v.size).reduce((sum, i) => sum + i.quantity, 0);
        return qty ? { ...v, qty: v.qty + qty } : v;
      }) } : p;
    }));
    sale.items.forEach((i) => pushMovement({ type: "devolução", productId: i.productId, productName: i.productName, color: i.color, size: i.size, quantity: i.quantity, note: "Cancelamento da venda #" + sale.number }));
    setSales((prev) => prev.filter((s) => s.id !== id));
    if (sale.customerId) setCustomers((prev) => prev.map((c) => c.id === sale.customerId ? applySaleToCustomer(c, sale, sale.id, -1, sale.date) : c));
    setExchanges((prev) => prev.filter((e) => e.saleId !== id));
    push("Venda #" + sale.number + " cancelada e estoque/financeiro estornados");
    return true;
  }, [push, sales, pushMovement]);

  const registerExchange = useCallback((input: { saleId: string; returnedItemId: string; returnedQty: number; replacement: { productId: string; color: string; size: string; quantity: number } | null; difference: number; notes: string }) => {
    const sale = sales.find((s) => s.id === input.saleId);
    if (!sale) return false;
    const returned = sale.items.find((i) => i.id === input.returnedItemId);
    if (!returned || input.returnedQty < 1) { toast.error("Selecione um item e uma quantidade válida."); return false; }
    const alreadyReturned = exchanges.filter((e) => e.saleId === sale.id && e.returned.saleItemId === returned.id).reduce((n, e) => n + e.returned.quantity, 0);
    if (input.returnedQty > returned.quantity - alreadyReturned) { toast.error("A quantidade devolvida ultrapassa o saldo disponível da venda."); return false; }

    let replacementProduct: Product | undefined;
    let replacementVariation: Product["variations"][number] | undefined;
    if (input.replacement) {
      replacementProduct = products.find((p) => p.id === input.replacement!.productId);
      replacementVariation = replacementProduct?.variations.find((v) => v.color === input.replacement!.color && v.size === input.replacement!.size);
      if (!replacementVariation || replacementVariation.qty < input.replacement.quantity) { toast.error("Estoque insuficiente para o produto da troca."); return false; }
    }

    const record: ExchangeRecord = {
      id: crypto.randomUUID(), date: new Date().toISOString(), saleId: sale.id, saleNumber: sale.number, customerId: sale.customerId, customerName: sale.customerName,
      returned: { saleItemId: returned.id, productId: returned.productId, productName: returned.productName, color: returned.color, size: returned.size, quantity: input.returnedQty, unitPrice: returned.unitPrice },
      replacement: replacementProduct && replacementVariation && input.replacement ? { productId: replacementProduct.id, productName: replacementProduct.name, color: replacementVariation.color, size: replacementVariation.size, quantity: input.replacement.quantity, unitPrice: replacementProduct.price } : null,
      difference: Number(input.difference) || 0, notes: input.notes,
    };
    setProducts((prev) => prev.map((p) => {
      const returnedQty = p.id === returned.productId ? input.returnedQty : 0;
      const replacementQty = replacementProduct?.id === p.id ? input.replacement?.quantity ?? 0 : 0;
      return { ...p, variations: p.variations.map((v) => {
        if (p.id === returned.productId && v.color === returned.color && v.size === returned.size) return { ...v, qty: v.qty + returnedQty };
        if (replacementProduct && p.id === replacementProduct.id && v.color === replacementVariation?.color && v.size === replacementVariation?.size) return { ...v, qty: v.qty - replacementQty };
        return v;
      }) };
    }));
    pushMovement({ type: "troca", productId: returned.productId, productName: returned.productName, color: returned.color, size: returned.size, quantity: input.returnedQty, note: "Troca da venda #" + sale.number });
    if (replacementProduct && replacementVariation && input.replacement) pushMovement({ type: "troca", productId: replacementProduct.id, productName: replacementProduct.name, color: replacementVariation.color, size: replacementVariation.size, quantity: -input.replacement.quantity, note: "Troca da venda #" + sale.number });

    setExchanges((prev) => [record, ...prev]);
    if (sale.customerId && sale.paymentMethod === "Ficha (AV)" && record.difference !== 0) {
      setCustomers((prev) => prev.map((c) => {
        if (c.id !== sale.customerId || !c.av) return c;
        const balance = Math.max(0, c.av.balance + record.difference);
        return { ...c, av: { ...c.av, balance } };
      }));
    }
    push("Troca da venda #" + sale.number + " registrada");
    return true;
  }, [push, sales, products, exchanges, pushMovement]);

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
  const restock = useCallback((productId: string, color: string, size: string, qty: number, note = "Entrada manual") => {
    if (qty <= 0) return;
    setProducts((prev) => prev.map((p) => p.id !== productId ? p : { ...p, variations: p.variations.map((v) => v.color === color && v.size === size ? { ...v, qty: v.qty + qty } : v) }));
    const p = products.find((x) => x.id === productId);
    const v = p?.variations.find((x) => x.color === color && x.size === size);
    if (p && v) pushMovement({ type: "entrada", productId, productName: p.name, color, size, quantity: qty, note });
    push("Entrada de estoque: " + color + " " + size + " +" + qty);
  }, [push, products, pushMovement]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p)), []);
  const addProduct = useCallback((p: Omit<Product, "id">) => setProducts((prev) => [{ ...p, id: crypto.randomUUID() }, ...prev]), []);
  const deleteProduct = useCallback((id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)), []);
  const addLedgerPurchase = useCallback((customerId: string, items: string, price: number) => {
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== customerId) return cu;
      const av = cu.av ? { ...cu.av, total: cu.av.total + price, balance: cu.av.balance + price } : { total: price, balance: price, dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0,10) };
      const next = { ...cu, av, purchases: [{ id: crypto.randomUUID(), date: new Date().toISOString(), items, price, method: "Ficha (AV)" }, ...cu.purchases] };
      sendConfiguredWhatsApp("compra", { phone: cu.whatsapp, cliente: cu.name, valor: brl(price), saldo: brl(av.balance) });
      return next;
    }));
    push("Compra na ficha: " + items + " — " + brl(price));
  }, [push]);

  const setAvPlan = useCallback((customerId: string, installments: number) => {
    if (installments < 1) return;
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== customerId || !cu.av) return cu;
      const nextPlan = { installments, mode: installments === 1 ? "aberto" as const : "parcelado" as const, startedAt: new Date().toISOString() };
      sendConfiguredWhatsApp("parcelamento", { phone: cu.whatsapp, cliente: cu.name, saldo: brl(cu.av.balance), parcelas: String(installments), parcela: installments > 1 ? brl(cu.av.balance / installments) : "pagamento livre" });
      return { ...cu, av: { ...cu.av, plan: nextPlan } };
    }));
    push("Parcelamento da ficha atualizado");
  }, [push]);

  const addLedgerPayment = useCallback((customerId: string, amount: number, method: string) => {
    if (amount <= 0) return;
    setCustomers((prev) => prev.map((cu) => {
      if (cu.id !== customerId || !cu.av) return cu;
      const balance = Math.max(0, cu.av.balance - amount);
      sendConfiguredWhatsApp("pagamento", { phone: cu.whatsapp, cliente: cu.name, valor: brl(amount), saldo: brl(balance) });
      return { ...cu, av: { ...cu.av, balance }, payments: [{ id: crypto.randomUUID(), date: new Date().toISOString(), amount, method, balanceAfter: balance }, ...cu.payments] };
    }));
    push("Abatimento de " + brl(amount) + " registrado (" + method + ")");
  }, [push]);

  const value = useMemo(() => ({ products, customers, reservations, sales, exchanges, stockMovements, store, setStore, online, setOnline, registerSale, createSale, updateSale, cancelSale, registerExchange, registerAv, updateCustomer, addCustomer, restock, updateProduct, addProduct, deleteProduct, addLedgerPurchase, addLedgerPayment, setAvPlan, feed }), [products, customers, reservations, sales, exchanges, stockMovements, store, online, registerSale, createSale, updateSale, cancelSale, registerExchange, registerAv, updateCustomer, addCustomer, restock, updateProduct, addProduct, deleteProduct, addLedgerPurchase, addLedgerPayment, setAvPlan, feed]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa do StoreProvider");
  return ctx;
}

export const customerStatus = (c: Customer) => c.av && c.av.balance > 0 && isOverdue(c.av.dueDate) ? "atraso" : "em_dia";
