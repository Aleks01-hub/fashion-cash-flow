import { useMemo, useState } from "react";
import {
  Banknote, CheckCircle2, CreditCard, Minus, Plus, QrCode, ReceiptText,
  Search, ShoppingCart, Trash2, UserPlus, WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { customerStatus, useStore } from "@/lib/store";
import { stores, type Customer, type Product, type SalePaymentMethod, type Size, type Variation } from "@/lib/mock-data";
import { brl, dateTime } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CartItem = {
  key: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

const PAYMENT_OPTIONS: Array<{ value: SalePaymentMethod; label: string; icon: typeof QrCode }> = [
  { value: "Pix", label: "Pix", icon: QrCode },
  { value: "Dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "Cartão Débito", label: "Débito", icon: CreditCard },
  { value: "Cartão Crédito", label: "Crédito", icon: CreditCard },
  { value: "Ficha (AV)", label: "Ficha", icon: WalletCards },
];

const today = () => new Date().toISOString().slice(0, 10);

function moneyValue(value: string) {
  const normalized = value.replace(/[^0-9,.-]/g, "").replace(".", "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function available(v: Variation) {
  return Math.max(0, v.qty);
}

function profileSeller() {
  if (typeof window === "undefined") return "Vendedor";
  try {
    const profile = JSON.parse(window.localStorage.getItem("modah:profile") || "null");
    return profile?.name || "Vendedor";
  } catch {
    return "Vendedor";
  }
}

export function QuickSaleScreen() {
  const { products, customers, sales, store, setStore, createSale, addCustomer } = useStore();
  const [productQuery, setProductQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<SalePaymentMethod>("Pix");
  const [discountText, setDiscountText] = useState("");
  const [paidText, setPaidText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", whatsapp: "" });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const activeProducts = useMemo(() => products.filter((p) => !p.details?.inactive), [products]);

  const productResults = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return activeProducts.slice(0, 8);
    return activeProducts.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      Boolean(p.details?.barcode?.toLowerCase().includes(q)) ||
      Boolean(p.details?.reference?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [activeProducts, productQuery]);

  const customerResults = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return customers.slice(0, 6);
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      Boolean(digits && c.whatsapp.replace(/\D/g, "").includes(digits)) ||
      Boolean(digits && c.cpf.replace(/\D/g, "").includes(digits))
    ).slice(0, 6);
  }, [customers, customerQuery]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = Math.min(subtotal, Math.max(0, moneyValue(discountText)));
  const total = Math.max(0, subtotal - discount);
  const paid =
    payment === "Pix" || payment === "Cartão Débito" || payment === "Cartão Crédito"
      ? total
      : Math.max(0, moneyValue(paidText));
  const change = payment === "Dinheiro" ? Math.max(0, paid - total) : 0;
  const invalidCash = payment === "Dinheiro" && paid < total;
  const invalidAvAmount = payment === "Ficha (AV)" && paid > total;
  const overdueCustomer = selectedCustomer ? customerStatus(selectedCustomer) === "atraso" : false;
  const canFinish =
    cart.length > 0 &&
    total > 0 &&
    !invalidCash &&
    !invalidAvAmount &&
    !(payment === "Ficha (AV)" && (!selectedCustomer || overdueCustomer));

  const todaySales = useMemo(() => {
    const d = today();
    return sales.filter((s) => s.date.slice(0, 10) === d);
  }, [sales]);

  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStockCount = products.reduce(
    (count, p) => count + p.variations.filter((v) => available(v) <= p.minStock).length,
    0,
  );

  const addVariation = (product: Product, variation: Variation) => {
    if (available(variation) <= 0) return;
    const key = product.id + "|" + variation.color + "|" + variation.size;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        if (existing.quantity >= available(variation)) return current;
        return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, {
        key, productId: product.id, productName: product.name, color: variation.color,
        size: variation.size, quantity: 1, unitPrice: product.price,
      }];
    });
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.key !== key) return [item];
      const product = products.find((p) => p.id === item.productId);
      const variation = product?.variations.find((v) => v.color === item.color && v.size === item.size);
      const max = variation ? available(variation) : item.quantity;
      const next = Math.max(0, Math.min(max, item.quantity + delta));
      return next > 0 ? [{ ...item, quantity: next }] : [];
    }));
  };

  const finishSale = () => {
    if (!canFinish) return;
    const customerName = selectedCustomer?.name ?? "Consumidor não identificado";
    const effectiveDueDate = payment === "Ficha (AV)"
      ? dueDate || selectedCustomer?.av?.dueDate || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
      : null;

    const ok = createSale({
      customerId: selectedCustomerId,
      customerName,
      seller: profileSeller(),
      items: cart.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        total: item.unitPrice * item.quantity,
      })),
      subtotal, discount, total, paymentMethod: payment, amountPaid: paid, change,
      dueDate: effectiveDueDate, notes: "Venda rápida pelo mobile",
    });

    if (ok) {
      setCart([]);
      setDiscountText("");
      setPaidText("");
      setDueDate("");
      setProductQuery("");
      setPayment("Pix");
      setSelectedCustomerId(null);
      setCustomerQuery("");
    }
  };

  const saveNewCustomer = () => {
    if (!newCustomer.name.trim() || !newCustomer.whatsapp.trim()) return;
    addCustomer({
      name: newCustomer.name.trim(),
      whatsapp: newCustomer.whatsapp.trim(),
      cpf: "",
      address: "",
      preferredSize: "M" as Size,
      birthDate: "",
      notes: "",
      av: null,
    });
    setCustomerQuery(newCustomer.name.trim());
    setNewCustomer({ name: "", whatsapp: "" });
    setNewCustomerOpen(false);
  };

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <header className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Venda rápida · {store}</p>
        <div className="flex items-center justify-between gap-3"><h1 className="text-xl font-bold">Vender</h1><Select value={store} onValueChange={setStore}><SelectTrigger className="h-9 w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{stores.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-elevated rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Hoje</p>
          <p className="mt-1 text-base font-bold">{brl(todayTotal)}</p>
          <p className="text-[11px] text-muted-foreground">{todaySales.length} vendas</p>
        </div>
        <div className="card-elevated rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Carrinho</p>
          <p className="mt-1 text-base font-bold">{cart.reduce((n, item) => n + item.quantity, 0)} un</p>
          <p className="text-[11px] text-muted-foreground">{brl(total)}</p>
        </div>
        <div className="card-elevated rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Estoque</p>
          <p className="mt-1 text-base font-bold">{lowStockCount}</p>
          <p className="text-[11px] text-muted-foreground">variações no mínimo</p>
        </div>
      </div>

      <section className="card-elevated rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">1. Adicionar produto</p>
            <p className="text-xs text-muted-foreground">Toque na cor/tamanho para lançar no carrinho.</p>
          </div>
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Nome, código ou referência" className="h-11 rounded-xl pl-9" />
        </div>
        <div className="mt-3 space-y-2">
          {productResults.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {brl(p.price)}{p.details?.barcode ? " · " + p.details.barcode : ""}</p>
                </div>
                <StatusBadge tone="primary">{p.variations.reduce((n, v) => n + available(v), 0)} un</StatusBadge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {p.variations.map((v) => {
                  const qty = available(v);
                  return (
                    <button key={v.color + "|" + v.size} disabled={qty <= 0} onClick={() => addVariation(p, v)} className="rounded-xl border border-border bg-background p-2 text-left active:scale-[0.98] disabled:opacity-40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{v.color} · {v.size}</span>
                        <span className="text-[11px] font-semibold">{qty}</span>
                      </div>
                      <span className="mt-1 flex items-center gap-1 text-[11px] text-primary"><Plus className="h-3 w-3" /> Adicionar</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {productResults.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>
      </section>

      <section className="card-elevated rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">2. Cliente</p>
            <p className="text-xs text-muted-foreground">Opcional, exceto para venda em ficha.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setNewCustomerOpen(true)}><UserPlus className="h-4 w-4" /> Novo</Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={selectedCustomer ? selectedCustomer.name : customerQuery}
            onChange={(e) => { setSelectedCustomerId(null); setCustomerQuery(e.target.value); }}
            placeholder="Nome, WhatsApp ou CPF"
            className="h-11 rounded-xl pl-9"
          />
          {selectedCustomer && (
            <button type="button" onClick={() => { setSelectedCustomerId(null); setCustomerQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground" aria-label="Limpar cliente">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!selectedCustomer && (
          <div className="mt-2 space-y-2">
            {customerResults.map((c) => (
              <button key={c.id} type="button" onClick={() => { setSelectedCustomerId(c.id); setCustomerQuery(""); setDueDate(c.av?.dueDate || ""); }} className="flex w-full items-center justify-between gap-2 rounded-xl border border-border p-3 text-left">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.whatsapp}</p>
                </div>
                <StatusBadge tone={customerStatus(c) === "atraso" ? "danger" : "success"}>{c.av ? brl(c.av.balance) : "Sem AV"}</StatusBadge>
              </button>
            ))}
          </div>
        )}

        {selectedCustomer && (
          <div className="mt-2 rounded-xl bg-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{selectedCustomer.name}</p>
              <StatusBadge tone={overdueCustomer ? "danger" : "success"}>
                {overdueCustomer ? "AV em atraso" : selectedCustomer.av ? "AV " + brl(selectedCustomer.av.balance) : "Cliente"}
              </StatusBadge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{selectedCustomer.whatsapp} · Tamanho {selectedCustomer.preferredSize}</p>
          </div>
        )}
      </section>

      <section className="card-elevated rounded-2xl p-4">
        <p className="mb-3 text-sm font-bold">3. Pagamento</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => { setPayment(value); setPaidText(""); if (value !== "Ficha (AV)") setDueDate(""); }} className={"flex items-center gap-2 rounded-xl border p-3 text-left " + (payment === value ? "border-primary bg-primary/10" : "border-border")}>
              <Icon className="h-4 w-4" /><span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {payment === "Ficha (AV)" && overdueCustomer && (
          <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            Esta ficha está vencida. Regularize o cliente no módulo de fichas antes de vender a prazo.
          </div>
        )}

        {payment === "Dinheiro" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label>Valor recebido</Label>
              <Input inputMode="decimal" value={paidText} onChange={(e) => setPaidText(e.target.value)} placeholder={brl(total).replace("R$", "").trim()} />
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-[11px] text-muted-foreground">Troco</p>
              <p className={"mt-1 text-lg font-bold " + (invalidCash ? "text-danger" : "text-foreground")}>{brl(change)}</p>
            </div>
          </div>
        )}

        {payment === "Ficha (AV)" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Entrada / pagamento hoje</Label>
              <Input inputMode="decimal" value={paidText} onChange={(e) => setPaidText(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate || selectedCustomer?.av?.dueDate || ""} min={today()} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Label>Desconto</Label>
            <Input inputMode="decimal" value={discountText} onChange={(e) => setDiscountText(e.target.value)} placeholder="0,00" />
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-black text-primary">{brl(total)}</p>
          </div>
        </div>
      </section>

      {cart.length > 0 && (
        <section className="card-elevated rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Carrinho</p>
            <span className="text-xs text-muted-foreground">{cart.length} item(ns)</span>
          </div>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.key} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.color} · {item.size} · {brl(item.unitPrice)}</p>
                  </div>
                  <button type="button" onClick={() => setCart((current) => current.filter((x) => x.key !== item.key))} className="p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => updateQuantity(item.key, -1)}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <Button size="icon" variant="outline" onClick={() => updateQuantity(item.key, 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <p className="font-bold">{brl(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="mt-1 flex items-center justify-between text-sm"><span className="text-muted-foreground">Desconto</span><span>- {brl(discount)}</span></div>
            <div className="mt-2 flex items-center justify-between text-base font-bold"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
          </div>
        </section>
      )}

      <Button size="lg" className="h-14 w-full rounded-2xl text-base font-bold" disabled={!canFinish} onClick={finishSale}>
        <CheckCircle2 className="h-5 w-5" /> Finalizar venda · {brl(total)}
      </Button>

      <section className="card-elevated rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2"><ReceiptText className="h-4 w-4 text-primary" /><h2 className="font-bold">Últimas vendas</h2></div>
        <div className="space-y-2">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="rounded-xl bg-muted p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Venda #{sale.number}</p>
                  <p className="truncate text-xs text-muted-foreground">{sale.customerName} · {sale.paymentMethod}</p>
                </div>
                <p className="font-bold">{brl(sale.total)}</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{dateTime(sale.date)}</p>
            </div>
          ))}
          {sales.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>}
        </div>
      </section>

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo cliente rápido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input inputMode="tel" value={newCustomer.whatsapp} onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!newCustomer.name.trim() || !newCustomer.whatsapp.trim()} onClick={saveNewCustomer}><UserPlus className="h-4 w-4" /> Salvar cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
