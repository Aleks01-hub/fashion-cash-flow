import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  LayoutDashboard,
  MessageCircle,
  Radio,
  Users,
  Wallet,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { customerStatus, useStore } from "@/lib/store";
import { brl, dateOnly, dateTime } from "@/lib/format";
import { CustomerLedger } from "./CustomerLedger";
import { SalesSection } from "./SalesSection";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fichas", label: "Clientes", icon: Users },
  { id: "vendas", label: "Vendas", icon: ShoppingBag },
  { id: "catalogo", label: "Catálogo", icon: Boxes },
  { id: "fechamento", label: "Fechamento de Caixa", icon: BarChart3 },
] as const;

export function DesktopPanel() {
  const { customers, products, feed, updateProduct, store } = useStore();
  const [section, setSection] = useState<(typeof NAV)[number]["id"]>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"todos" | "atraso">("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = customers.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const t = setTimeout(() => {
      toast("Monitor em tempo real", {
        description:
          "Vendedor Alex registrou um abate de R$ 50 no AV da cliente Maria (Pix) — Saldo Devedor Atualizado",
      });
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  const overdue = customers.filter((c) => customerStatus(c) === "atraso");
  const totals = useMemo(() => {
    const arrecadado = customers.flatMap((c) => c.payments).reduce((s, p) => s + p.amount, 0);
    const vendas = customers.flatMap((c) => c.purchases).reduce((s, p) => s + p.price, 0);
    const pecas = customers.flatMap((c) => c.purchases).length;
    const pendente = overdue.reduce((s, c) => s + (c.av?.balance ?? 0), 0);
    return { arrecadado, vendas, pecas, pendente };
  }, [customers, overdue]);

  const go = (id: (typeof NAV)[number]["id"]) => {
    setSection(id);
    setSelectedId(null);
    setMenuOpen(false);
  };
  const openCustomer = (id: string) => {
    setSection("fichas");
    setSelectedId(id);
  };
  const list = tab === "atraso" ? overdue : customers;

  return (
    <div className="relative min-h-screen">
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setMenuOpen(false)} />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-sidebar p-4 transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Radio className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Caixa Central</p>
            <p className="truncate text-xs text-muted-foreground">{store}</p>
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="Fechar menu" className="rounded-lg p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                section === n.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{n.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 space-y-6 p-4 md:p-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{NAV.find((n) => n.id === section)?.label}</h1>
        </div>

        {section === "vendas" && <SalesSection />}

        {section === "fichas" && selected && (
          <CustomerLedger customer={selected} onBack={() => setSelectedId(null)} />
        )}

        {section === "fichas" && !selected && (
          <section className="card-elevated overflow-x-auto rounded-2xl p-4">
            <div className="mb-3 flex gap-2">
              {(["todos", "atraso"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {t === "todos" ? `Todos os clientes (${customers.length})` : `Em atraso (${overdue.length})`}
                </button>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openCustomer(c.id)}>
                    <TableCell className="font-medium text-primary underline-offset-2 hover:underline">{c.name}</TableCell>
                    <TableCell>{c.whatsapp}</TableCell>
                    <TableCell>
                      {customerStatus(c) === "atraso" ? (
                        <StatusBadge tone="danger">Em atraso</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">Em dia</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{brl(c.av?.balance ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {section === "dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total de Vendas" value={brl(totals.vendas)} icon={BarChart3} tone="primary" />
              <Metric label="Arrecadado em AVs" value={brl(totals.arrecadado)} icon={Wallet} tone="success" />
              <Metric label="Peças Vendidas" value={String(totals.pecas)} icon={Boxes} tone="warning" />
              <Metric
                label="Pendente em Fichas Atrasadas"
                value={brl(totals.pendente)}
                icon={AlertTriangle}
                tone="danger"
              />
            </div>

            <section className="card-elevated rounded-2xl p-4">
              <h2 className="mb-3 flex items-center gap-2 font-bold">
                <Radio className="h-4 w-4 text-primary" /> Monitor em tempo real
              </h2>
              <div className="space-y-2">
                {feed.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aguardando eventos dos vendedores…
                  </p>
                )}
                {feed.map((f) => (
                  <div key={f.id} className="rounded-xl bg-muted p-3 text-sm">
                    {f.text}
                    <span className="ml-2 text-xs text-muted-foreground">{dateTime(f.at)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {section === "dashboard" && (
          <section className="card-elevated overflow-x-auto rounded-2xl p-4">
            <h2 className="mb-3 font-bold">Clientes em Atraso</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Cobrança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="cursor-pointer font-medium text-primary hover:underline" onClick={() => openCustomer(c.id)}>{c.name}</TableCell>
                    <TableCell>
                      <StatusBadge tone="danger">{dateOnly(c.av!.dueDate)}</StatusBadge>
                    </TableCell>
                    <TableCell className="font-semibold">{brl(c.av!.balance)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={`https://wa.me/${c.whatsapp}?text=${encodeURIComponent(
                            `Olá ${c.name}, sua ficha está com saldo de ${brl(c.av!.balance)}.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {(section === "dashboard" || section === "catalogo") && (
          <section className="card-elevated overflow-x-auto rounded-2xl p-4">
            <h2 className="mb-3 font-bold">Catálogo Completo</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque mínimo</TableHead>
                  <TableHead>Em estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      <Input
                        className="h-9 w-28"
                        value={p.price}
                        onChange={(e) => updateProduct(p.id, { price: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-9 w-20"
                        value={p.minStock}
                        onChange={(e) => updateProduct(p.id, { minStock: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>{p.variations.reduce((s, v) => s + v.qty, 0)} un</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {section === "fechamento" && (
          <section className="card-elevated rounded-2xl p-4">
            <h2 className="mb-3 font-bold">Relatório de Fechamento do Dia</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between rounded-xl bg-muted p-3">
                <span>Vendas do dia</span> <span className="font-semibold">{brl(totals.vendas)}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-muted p-3">
                <span>Recebido em AVs</span> <span className="font-semibold">{brl(totals.arrecadado)}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-muted p-3">
                <span>Fichas em atraso</span> <span className="font-semibold">{overdue.length}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-muted p-3">
                <span>Saldo pendente</span> <span className="font-semibold">{brl(totals.pendente)}</span>
              </li>
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const bg = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/12 text-danger",
  }[tone];
  return (
    <div className="card-elevated grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4">
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold">{value}</p>
      </div>
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bg}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
