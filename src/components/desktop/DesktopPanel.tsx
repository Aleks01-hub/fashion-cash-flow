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

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fichas", label: "Fichas em Atraso", icon: Users },
  { id: "catalogo", label: "Catálogo", icon: Boxes },
  { id: "fechamento", label: "Fechamento de Caixa", icon: BarChart3 },
] as const;

export function DesktopPanel() {
  const { customers, products, feed, updateProduct, store } = useStore();
  const [section, setSection] = useState<(typeof NAV)[number]["id"]>("dashboard");

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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar p-4 md:block">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Radio className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Caixa Central</p>
            <p className="truncate text-xs text-muted-foreground">{store}</p>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
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

      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-8">
        <div className="flex gap-2 overflow-x-auto md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                section === n.id ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

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

        {(section === "dashboard" || section === "fichas") && (
          <section className="card-elevated overflow-x-auto rounded-2xl p-4">
            <h2 className="mb-3 font-bold">Fichas em Atraso</h2>
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
                    <TableCell className="font-medium">{c.name}</TableCell>
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
