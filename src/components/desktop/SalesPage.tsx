import { useMemo, useState } from "react";
import { Edit, Eye, Plus, Search, X, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { SaleItem, SalePaymentMethod } from "@/lib/mock-data";
import { brl, dateTime } from "@/lib/format";

const methods: SalePaymentMethod[] = ["Pix", "Dinheiro", "Cartão Débito", "Cartão Crédito", "Ficha (AV)"];

export function SalesPage() {
  const { sales, products, customers, store, createSale, updateSale, cancelSale } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [exchangeSaleId, setExchangeSaleId] = useState<string | null>(null);

  const filtered = useMemo(() => sales.filter((s) => {
    const q = search.toLowerCase();
    return !q || String(s.number).includes(q) || s.customerName.toLowerCase().includes(q) || s.paymentMethod.toLowerCase().includes(q);
  }), [sales, search]);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold">Histórico de vendas</h2><p className="text-sm text-muted-foreground">Consulte, abra e registre novas vendas.</p></div>
      <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova venda</Button>
    </div>
    <div className="card-elevated rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por número, cliente ou pagamento..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Venda</th><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Itens</th><th className="p-3">Pagamento</th><th className="p-3">Total</th><th className="p-3"></th></tr></thead>
        <tbody>{filtered.map((s) => <tr key={s.id} className="border-b last:border-0">
          <td className="p-3 font-semibold">#{s.number}</td><td className="p-3">{dateTime(s.date)}</td><td className="p-3">{s.customerName}</td>
          <td className="p-3">{s.items.reduce((n, i) => n + i.quantity, 0)} peça(s)</td><td className="p-3">{s.paymentMethod}</td><td className="p-3 font-bold">{brl(s.total)}</td>
          <td className="p-3 flex gap-1"><Button size="icon" variant="ghost" onClick={() => setSelected(s.id)}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setSelected(s.id + ":edit")}><Edit className="h-4 w-4" /></Button></td>
        </tr>)}</tbody></table>
        {!filtered.length && <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma venda encontrada.</p>}
      </div>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Nova venda</DialogTitle></DialogHeader><NewSaleForm onDone={() => setOpen(false)} /></DialogContent></Dialog>
    <Dialog open={!!exchangeSaleId} onOpenChange={(v) => !v && setExchangeSaleId(null)}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Troca / devolução vinculada à venda</DialogTitle></DialogHeader>{exchangeSaleId && <ExchangeForm sale={sales.find((s) => s.id === exchangeSaleId)!} onDone={() => setExchangeSaleId(null)} />}</DialogContent></Dialog>\n    <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.endsWith(":edit") ? "Editar venda" : "Detalhes da venda"}</DialogTitle></DialogHeader>{selected && selected.endsWith(":edit") ? <EditSaleForm sale={sales.find((s) => s.id === selected.replace(":edit",""))!} onDone={()=>setSelected(null)} /> : selected && <SaleDetails sale={sales.find((s) => s.id === selected)!} onCancel={() => { cancelSale(selected); setSelected(null); }} onExchange={() => setExchangeSaleId(selected!)} />}</DialogContent></Dialog>
  </section>;
}

function NewSaleForm({ onDone }: { onDone: () => void }) {
  const { products, customers, store, createSale } = useStore();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [productId, setProductId] = useState("");
  const [variationKey, setVariationKey] = useState("");
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<SalePaymentMethod>("Pix");
  const [amountPaid, setAmountPaid] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const product = products.find((p) => p.id === productId);
  const variation = product?.variations.find((v) => v.color + "|" + v.size === variationKey);
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, amountPaid - total);

  const addItem = () => {
    if (!product || !variation || qty < 1) return;
    if (variation.qty < qty) return;
    const item: SaleItem = { id: crypto.randomUUID(), productId: product.id, productName: product.name, color: variation.color, size: variation.size, quantity: qty, unitPrice: product.price, discount: 0, total: product.price * qty };
    setItems((prev) => [...prev, item]); setProductId(""); setVariationKey(""); setQty(1);
  };

  const submit = () => {
    if (!items.length || total <= 0) return;
    const customer = customers.find((c) => c.id === customerId);
    const paid = method === "Ficha (AV)" ? Math.min(amountPaid, total) : Math.max(amountPaid, total);
    const ok = createSale({ customerId: customer?.id ?? null, customerName: customer?.name ?? "Consumidor não identificado", seller: "Alex", store, items, subtotal, discount, total, paymentMethod: method, amountPaid: paid, change, dueDate: method === "Ficha (AV)" ? (dueDate || null) : null, notes });
    if (ok) onDone();
  };

  return <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div><Label>Cliente</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Consumidor não identificado</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><Label>Forma de pagamento</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value as SalePaymentMethod)}>{methods.map((m) => <option key={m}>{m}</option>)}</select></div></div>
      <div className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">Adicionar produto</h3><div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_90px_auto] sm:items-end"><div><Label>Produto</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={productId} onChange={(e) => { setProductId(e.target.value); setVariationKey(""); }}>{<option value="">Selecione...</option>}{products.filter(p => !p.details?.inactive).map(p => <option key={p.id} value={p.id}>{p.name} — {brl(p.price)}</option>)}</select></div><div><Label>Cor / tamanho</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={variationKey} onChange={(e) => setVariationKey(e.target.value)} disabled={!product}><option value="">Selecione...</option>{product?.variations.filter(v => v.qty > 0).map(v => <option key={v.color + "|" + v.size} value={v.color + "|" + v.size}>{v.color} / {v.size} ({v.qty})</option>)}</select></div><div><Label>Qtd.</Label><Input className="mt-1" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} /></div><Button onClick={addItem}>Adicionar</Button></div></div>
      <div className="space-y-2">{items.map((i) => <div key={i.id} className="flex items-center justify-between rounded-xl bg-muted p-3"><div><p className="font-medium">{i.productName}</p><p className="text-xs text-muted-foreground">{i.color} / {i.size} · {i.quantity}x</p></div><div className="flex items-center gap-3"><b>{brl(i.total)}</b><Button variant="ghost" size="icon" onClick={() => setItems(items.filter(x => x.id !== i.id))}><X className="h-4 w-4" /></Button></div></div>)}</div>
      <div><Label>Observações</Label><textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações da venda..." /></div>
    </div>
    <div className="h-fit space-y-4 rounded-2xl border p-4"><h3 className="font-bold">Resumo</h3><div className="flex justify-between text-sm"><span>Subtotal</span><b>{brl(subtotal)}</b></div><div><Label>Desconto</Label><Input type="number" min="0" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} /></div><div className="flex justify-between border-t pt-3 text-lg"><span>Total</span><b>{brl(total)}</b></div>{method === "Ficha (AV)" && <><div><Label>Valor pago agora</Label><Input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value) || 0))} /></div><div><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div></>}{method !== "Ficha (AV)" && <div><Label>Valor recebido</Label><Input type="number" min={total} value={amountPaid || total} onChange={(e) => setAmountPaid(Math.max(total, Number(e.target.value) || total))} /></div>}{method !== "Ficha (AV)" && <div className="flex justify-between text-sm"><span>Troco</span><b>{brl(change)}</b></div>}<Button className="w-full" size="lg" onClick={submit}>Finalizar venda</Button></div>
  </div>;
}

function SaleDetails({ sale, onCancel, onExchange }: { sale: any; onCancel: () => void; onExchange: () => void }) {
  return <div className="space-y-4 text-sm"><div className="grid grid-cols-2 gap-3"><div><span className="text-muted-foreground">Venda</span><p className="font-bold">#{sale.number}</p></div><div><span className="text-muted-foreground">Data</span><p>{dateTime(sale.date)}</p></div><div><span className="text-muted-foreground">Cliente</span><p>{sale.customerName}</p></div><div><span className="text-muted-foreground">Pagamento</span><p>{sale.paymentMethod}</p></div></div><div className="rounded-xl bg-muted p-3">{sale.items.map((i: SaleItem) => <div key={i.id} className="flex justify-between border-b py-2 last:border-0"><span>{i.productName} — {i.color}/{i.size} x{i.quantity}</span><b>{brl(i.total)}</b></div>)}</div><div className="flex justify-between text-lg"><span>Total</span><b>{brl(sale.total)}</b></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onExchange}><Repeat2 className="mr-2 h-4 w-4" />Registrar troca / devolução</Button><Button variant="destructive" onClick={onCancel}>Cancelar venda e estornar estoque</Button></div></div>;
}


function EditSaleForm({ sale, onDone }: { sale: any; onDone: () => void }) {
  const { products, customers, store, updateSale } = useStore();
  const [customerId,setCustomerId]=useState(sale.customerId||""); const [method,setMethod]=useState<SalePaymentMethod>(sale.paymentMethod); const [discount,setDiscount]=useState(sale.discount); const [paid,setPaid]=useState(sale.amountPaid); const [dueDate,setDueDate]=useState(sale.dueDate||""); const [notes,setNotes]=useState(sale.notes||"");
  const submit=()=>{ const subtotal=sale.subtotal; const total=Math.max(0,subtotal-discount); const ok=updateSale(sale.id,{customerId:customerId||null,customerName:customers.find(c=>c.id===customerId)?.name||"Consumidor não identificado",seller:sale.seller,store,items:sale.items,subtotal,discount,total,paymentMethod:method,amountPaid:method==="Ficha (AV)"?Math.min(paid,total):Math.max(paid,total),change:Math.max(0,paid-total),dueDate:method==="Ficha (AV)"?(dueDate||null):null,notes}); if(ok) onDone(); };
  return <div className="space-y-4"><div><Label>Cliente</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Consumidor não identificado</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="rounded-xl bg-muted p-3">{sale.items.map((i: SaleItem)=><div key={i.id} className="flex justify-between py-2"><span>{i.productName} — {i.color}/{i.size} x{i.quantity}</span><b>{brl(i.total)}</b></div>)}</div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Desconto</Label><Input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value)||0)}/></div><div><Label>Pagamento</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={method} onChange={e=>setMethod(e.target.value as SalePaymentMethod)}>{methods.map(m=><option key={m}>{m}</option>)}</select></div><div><Label>Valor pago</Label><Input type="number" value={paid} onChange={e=>setPaid(Number(e.target.value)||0)}/></div><div><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div></div><div><Label>Observações</Label><textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3" value={notes} onChange={e=>setNotes(e.target.value)}/></div><Button className="w-full" onClick={submit}>Salvar alterações</Button></div>;
}


function ExchangeForm({ sale, onDone }: { sale: any; onDone: () => void }) {
  const { products, restock } = useStore();
  const [returnedId, setReturnedId] = useState("");
  const [returnedQty, setReturnedQty] = useState(1);
  const [replacementId, setReplacementId] = useState("");
  const [replacementQty, setReplacementQty] = useState(1);
  const [difference, setDifference] = useState(0);
  const [notes, setNotes] = useState("");
  const returned = sale.items.find((i: SaleItem) => i.id === returnedId);
  const replacement = sale.items.find((i: SaleItem) => i.id === replacementId);
  const submit = () => {
    if (!returned || returnedQty < 1 || returnedQty > returned.quantity) return;
    const key = `modah:exchange:${sale.id}`;
    const previous = (() => { try { return JSON.parse(window.localStorage.getItem(key) || "[]"); } catch { return []; } })();
    const record = { id: crypto.randomUUID(), date: new Date().toISOString(), saleId: sale.id, saleNumber: sale.number, returned: { productId: returned.productId, productName: returned.productName, color: returned.color, size: returned.size, quantity: returnedQty }, replacement: replacement ? { productId: replacement.productId, productName: replacement.productName, color: replacement.color, size: replacement.size, quantity: replacementQty } : null, difference: Number(difference) || 0, notes };
    window.localStorage.setItem(key, JSON.stringify([record, ...previous]));
    restock(returned.productId, returned.color, returned.size, returnedQty);
    onDone();
  };
  return <div className="space-y-4">
    <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Venda</p><p className="font-bold">#{sale.number} · {sale.customerName}</p><p className="text-xs text-muted-foreground">{dateTime(sale.date)}</p></div>
    <div><Label>Produto devolvido</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={returnedId} onChange={e=>setReturnedId(e.target.value)}><option value="">Selecione um item da venda...</option>{sale.items.map((i: SaleItem)=><option key={i.id} value={i.id}>{i.productName} — {i.color}/{i.size} · {i.quantity} un.</option>)}</select></div>
    {returned && <div><Label>Quantidade devolvida</Label><Input type="number" min="1" max={returned.quantity} value={returnedQty} onChange={e=>setReturnedQty(Math.max(1,Number(e.target.value)||1))}/></div>}
    <div><Label>Produto da troca (opcional)</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={replacementId} onChange={e=>setReplacementId(e.target.value)}><option value="">Sem produto de troca</option>{products.filter(p=>!p.details?.inactive).flatMap(p=>p.variations.filter(v=>v.qty>0).map(v=><option key={p.id+"|"+v.color+"|"+v.size} value={sale.items.find(i=>i.productId===p.id&&i.color===v.color&&i.size===v.size)?.id || ""}>{p.name} — {v.color}/{v.size} ({v.qty})</option>))}</select></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label>Quantidade da troca</Label><Input type="number" min="1" value={replacementQty} onChange={e=>setReplacementQty(Math.max(1,Number(e.target.value)||1))}/></div><div><Label>Diferença a pagar/devolver</Label><Input type="number" value={difference} onChange={e=>setDifference(Number(e.target.value)||0)}/></div></div>
    <div><Label>Observações</Label><textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-3" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
    <Button className="w-full" onClick={submit}>Registrar troca</Button>
  </div>;
}
