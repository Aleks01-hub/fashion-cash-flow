import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Boxes, LayoutDashboard, MessageCircle, Radio, Users, Menu, ShoppingBag, X, Package, Wallet as WalletIcon, Cake, Settings, UserCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { customerStatus, useStore } from "@/lib/store";
import { brl, dateOnly, dateTime } from "@/lib/format";
import { CustomerLedger } from "./CustomerLedger";
import { ProductsSection } from "./ProductsSection";
import { NewCustomerDialog } from "./NewCustomerDialog";
import { SalesPage } from "./SalesPage";
import { OperationsSection } from "./OperationsSection";
import { ProfileSettingsSection } from "./ProfileSettingsSection";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fichas", label: "Clientes", icon: Users },
  { id: "vendas", label: "Vendas", icon: ShoppingBag },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "fechamento", label: "Gestão", icon: BarChart3 },
  { id: "configuracoes", label: "Configurações", icon: Settings },
] as const;

export function DesktopPanel() {
  const { customers, products, sales, feed, updateProduct, store } = useStore();
  const [section, setSection] = useState<(typeof NAV)[number]["id"]>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"todos" | "atraso">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [profileName, setProfileName] = useState(() => typeof window === "undefined" ? "Alex" : (() => { try { return JSON.parse(window.localStorage.getItem("modah:profile") || "null")?.name || "Alex"; } catch { return "Alex"; } })());
  const selected = customers.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const handler = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (id) openCustomer(id);
    };
    window.addEventListener("modah:open-customer", handler);
    return () => window.removeEventListener("modah:open-customer", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => toast("Monitor em tempo real", { description: "Sistema pronto para registrar vendas e movimentações." }), 2500);
    const onProfile = () => { try { setProfileName(JSON.parse(window.localStorage.getItem("modah:profile") || "null")?.name || "Alex"); } catch {} };
    window.addEventListener("modah:profile-updated", onProfile);
    return () => { clearTimeout(t); window.removeEventListener("modah:profile-updated", onProfile); };
  }, []);

  const overdue = customers.filter((c) => customerStatus(c) === "atraso");
  const totals = useMemo(() => {
    const vendas = sales.reduce((s, sale) => s + sale.total, 0);
    const arrecadado = sales.reduce((s, sale) => s + sale.amountPaid, 0);
    const pecas = sales.reduce((s, sale) => s + sale.items.reduce((n, i) => n + i.quantity, 0), 0);
    const pendente = overdue.reduce((s, c) => s + (c.av?.balance ?? 0), 0);
    return { arrecadado, vendas, pecas, pendente };
  }, [sales, overdue]);

  const go = (id: (typeof NAV)[number]["id"]) => { setSection(id); setSelectedId(null); setMenuOpen(false); };
  const openCustomer = (id: string) => { setSection("fichas"); setSelectedId(id); };
  const list = (tab === "atraso" ? overdue : customers).filter(c => !customerSearch || [c.name,c.whatsapp,c.cpf,c.address].join(" ").toLowerCase().includes(customerSearch.toLowerCase()));

  return <div className="relative min-h-screen">
    {menuOpen && <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setMenuOpen(false)} />}
    <aside className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-sidebar p-4 transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-4 flex items-center gap-2"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Radio className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Caixa Central</p><p className="truncate text-xs text-muted-foreground">{store}</p></div><button onClick={() => setMenuOpen(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button></div>
      <button onClick={() => go("configuracoes")} className="mb-4 flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-accent"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><UserCircle className="h-5 w-5"/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{profileName}</p><p className="text-xs text-muted-foreground">Perfil e configurações</p></div></button><nav className="space-y-1">{NAV.map((n) => <button key={n.id} onClick={() => go(n.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${section === n.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}><n.icon className="h-4 w-4 shrink-0" /><span>{n.label}</span></button>)}</nav>
    </aside>

    <main className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => setMenuOpen(true)}><Menu className="h-5 w-5" /></Button><h1 className="text-lg font-bold">{NAV.find((n) => n.id === section)?.label}</h1></div>

      {section === "vendas" && <SalesPage />}
      {section === "produtos" && <ProductsSection />}

      {section === "fichas" && selected && <CustomerLedger customer={selected} onBack={() => setSelectedId(null)} />}
      {section === "fichas" && !selected && <section className="card-elevated overflow-x-auto rounded-2xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2">{(["todos","atraso"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t === "todos" ? `Todos os clientes (${customers.length})` : `Em atraso (${overdue.length})`}</button>)}</div><div className="flex gap-2"><Input className="h-9 w-56" placeholder="Buscar cliente..." value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} /><Button size="sm" onClick={() => setNewCustomerOpen(true)}>Novo cliente</Button></div></div>
        <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead>Nascimento</TableHead><TableHead>Última compra</TableHead><TableHead>Situação</TableHead><TableHead>Saldo</TableHead></TableRow></TableHeader><TableBody>{list.map((c) => { const last = c.purchases.reduce((max,p)=>p.date>max?p.date:max,""); const spent=c.purchases.reduce((n,p)=>n+p.price,0); return <TableRow key={c.id} className="cursor-pointer" onClick={() => openCustomer(c.id)}><TableCell><div className="font-medium text-primary">{c.name}</div><div className="text-xs text-muted-foreground">{brl(spent)} em compras registradas</div></TableCell><TableCell>{c.whatsapp}</TableCell><TableCell>{c.birthDate ? new Date(c.birthDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell><TableCell>{last ? new Date(last).toLocaleDateString("pt-BR") : "—"}</TableCell><TableCell>{customerStatus(c) === "atraso" ? <StatusBadge tone="danger">Em atraso</StatusBadge> : <StatusBadge tone="success">Em dia</StatusBadge>}</TableCell><TableCell className="font-semibold">{brl(c.av?.balance ?? 0)}</TableCell></TableRow>})}</TableBody></Table>
      </section>}

      {section === "dashboard" && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total de Vendas" value={brl(totals.vendas)} icon={BarChart3} tone="primary" /><Metric label="Recebido" value={brl(totals.arrecadado)} icon={WalletIcon} tone="success" /><Metric label="Peças Vendidas" value={String(totals.pecas)} icon={Boxes} tone="warning" /><Metric label="Pendente em Fichas" value={brl(totals.pendente)} icon={AlertTriangle} tone="danger" /></div>
        <div className="grid gap-4 xl:grid-cols-2"><SalesRanking sales={sales} /><CustomerRanking sales={sales} customers={customers} /></div>
        <div className="grid gap-4 xl:grid-cols-2"><PaymentChart sales={sales} /><SalesTrendChart sales={sales} /></div>
        <MiniCalendar customers={customers} />
        <section className="card-elevated rounded-2xl p-4"><h2 className="mb-3 flex items-center gap-2 font-bold"><Radio className="h-4 w-4 text-primary" /> Monitor em tempo real</h2><div className="space-y-2">{feed.length === 0 ? <p className="text-sm text-muted-foreground">Aguardando eventos…</p> : feed.map((f) => <div key={f.id} className="rounded-xl bg-muted p-3 text-sm">{f.text}<span className="ml-2 text-xs text-muted-foreground">{dateTime(f.at)}</span></div>)}</div></section>
        <section className="card-elevated overflow-x-auto rounded-2xl p-4"><h2 className="mb-3 font-bold">Clientes em Atraso</h2><Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Vencimento</TableHead><TableHead>Saldo</TableHead><TableHead>Cobrança</TableHead></TableRow></TableHeader><TableBody>{overdue.map((c) => <TableRow key={c.id}><TableCell className="cursor-pointer font-medium text-primary" onClick={() => openCustomer(c.id)}>{c.name}</TableCell><TableCell><StatusBadge tone="danger">{dateOnly(c.av!.dueDate)}</StatusBadge></TableCell><TableCell className="font-semibold">{brl(c.av!.balance)}</TableCell><TableCell><Button asChild size="sm" variant="outline"><a href={`https://wa.me/${c.whatsapp}?text=${encodeURIComponent(`Olá ${c.name}, sua ficha está com saldo de ${brl(c.av!.balance)}.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button></TableCell></TableRow>)}</TableBody></Table></section>
      </>}

      {section === "dashboard" && <ProductTable products={products} updateProduct={updateProduct} />}
      {section === "fichas" && !selected && <NewCustomerDialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen} />}

      {section === "fechamento" && <OperationsSection />}
      {section === "configuracoes" && <ProfileSettingsSection />}
    </main>
  </div>;
}

function ProductTable({ products, updateProduct }: { products: ReturnType<typeof useStore>["products"]; updateProduct: ReturnType<typeof useStore>["updateProduct"] }) {
  return <section className="card-elevated overflow-x-auto rounded-2xl p-4"><h2 className="mb-3 font-bold">Resumo do Estoque</h2><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Mínimo</TableHead><TableHead>Estoque</TableHead></TableRow></TableHeader><TableBody>{products.map((p) => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell><Input className="h-9 w-28" value={p.price} onChange={(e) => updateProduct(p.id, { price: Number(e.target.value) || 0 })} /></TableCell><TableCell><Input className="h-9 w-20" value={p.minStock} onChange={(e) => updateProduct(p.id, { minStock: Number(e.target.value) || 0 })} /></TableCell><TableCell>{p.variations.reduce((s, v) => s + v.qty, 0)} un</TableCell></TableRow>)}</TableBody></Table></section>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof BarChart3; tone: "primary" | "success" | "warning" | "danger" }) {
  const bg = { primary: "bg-primary/10 text-primary", success: "bg-success/12 text-success", warning: "bg-warning/15 text-warning", danger: "bg-danger/12 text-danger" }[tone];
  return <div className="card-elevated grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"><div><p className="truncate text-xs text-muted-foreground">{label}</p><p className="truncate text-xl font-bold">{value}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}><Icon className="h-5 w-5" /></div></div>;
}


type SalesList = ReturnType<typeof useStore>["sales"];
type CustomerList = ReturnType<typeof useStore>["customers"];

import type { ReactNode } from "react";

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="card-elevated rounded-2xl p-4">
    <h2 className="mb-4 font-bold">{title}</h2>
    <div className="h-72 w-full">{children}</div>
  </section>;
}

function SalesRanking({ sales }: { sales: SalesList }) {
  const map = new Map<string, number>();
  sales.forEach((s) => s.items.forEach((i) => map.set(i.productName, (map.get(i.productName) ?? 0) + i.quantity)));
  const data = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }));

  return <ChartCard title="Produtos mais vendidos">
    {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas ainda.</p> : <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => [`${value} un`, "Vendidas"]} />
        <Bar dataKey="quantity" name="Vendidas" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>}
  </ChartCard>;
}

function CustomerRanking({ sales, customers }: { sales: SalesList; customers: CustomerList }) {
  const map = new Map<string, number>();
  sales.forEach((s) => {
    const name = s.customerName || customers.find((c) => c.id === s.customerId)?.name || "Consumidor";
    map.set(name, (map.get(name) ?? 0) + s.total);
  });
  const data = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total }));

  return <ChartCard title="Clientes que mais compram">
    {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas ainda.</p> : <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
        <YAxis tickFormatter={(v) => brl(Number(v))} width={70} />
        <Tooltip formatter={(value) => [brl(Number(value)), "Compras"]} />
        <Bar dataKey="total" name="Compras" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>}
  </ChartCard>;
}

function PaymentChart({ sales }: { sales: SalesList }) {
  const map = new Map<string, number>();
  sales.forEach((s) => map.set(s.paymentMethod, (map.get(s.paymentMethod) ?? 0) + s.total));
  const data = [...map.entries()].map(([name, value]) => ({ name, value }));

  return <ChartCard title="Vendas por forma de pagamento">
    {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas ainda.</p> : <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
          {data.map((entry) => <Cell key={entry.name} />)}
        </Pie>
        <Tooltip formatter={(value) => brl(Number(value))} />
      </PieChart>
    </ResponsiveContainer>}
  </ChartCard>;
}

function SalesTrendChart({ sales }: { sales: SalesList }) {
  const map = new Map<string, number>();
  sales.forEach((s) => {
    const day = s.date.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + s.total);
  });
  const data = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, total]) => ({
    date: date.split("-").reverse().slice(0, 2).join("/"),
    total,
  }));

  return <ChartCard title="Evolução das vendas">
    {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas ainda.</p> : <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => brl(Number(v))} width={75} />
        <Tooltip formatter={(value) => [brl(Number(value)), "Vendas"]} />
        <Line type="monotone" dataKey="total" name="Vendas" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>}
  </ChartCard>;
}

function MiniCalendar({ customers }: { customers: CustomerList }) {
  const due = customers.filter((c) => c.av && c.av.balance > 0).sort((a, b) => a.av!.dueDate.localeCompare(b.av!.dueDate));
  const open = (id: string) => { window.dispatchEvent(new CustomEvent("modah:open-customer", { detail: id })); };
  return <section className="card-elevated rounded-2xl p-4"><h2 className="mb-3 font-bold">Próximos vencimentos</h2>{due.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ficha em aberto.</p> : <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{due.map((c) => <button key={c.id} onClick={() => open(c.id)} className="flex items-center justify-between rounded-xl bg-muted p-3 text-left text-sm transition hover:bg-accent"><span className="truncate font-medium text-primary">{c.name}</span><StatusBadge tone={customerStatus(c) === "atraso" ? "danger" : "warning"}>{dateOnly(c.av!.dueDate)}</StatusBadge></button>)}</div>}<p className="mt-2 text-xs text-muted-foreground">Clique em um vencimento para abrir a ficha do cliente.</p></section>;
}
