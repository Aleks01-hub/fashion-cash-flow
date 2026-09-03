import { useMemo, useState } from "react";
import { ArrowLeft, Ban, Pencil, Plus, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { customerStatus, useStore } from "@/lib/store";
import type { Customer, Size } from "@/lib/mock-data";
import { brl, dateOnly, dateTime } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "Todas as Fichas" },
  { id: "em_dia", label: "Em Dia" },
  { id: "atraso", label: "Em Atraso" },
] as const;

const METHODS = ["Pix", "Dinheiro", "Cartão Débito", "Cartão Crédito"];

export function CustomersScreen() {
  const { customers, addCustomer } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.toLowerCase().replace(/\D/g, "");
    return customers.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (q && (c.cpf.replace(/\D/g, "").includes(q) || c.whatsapp.includes(q)));
      const st = customerStatus(c);
      return matchesQuery && (filter === "all" || st === filter);
    });
  }, [customers, query, filter]);

  const selected = customers.find((c) => c.id === openId) ?? null;
  if (selected) return <CustomerDetail customer={selected} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <h1 className="text-xl font-bold">Fichas de Clientes & AVs</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF ou WhatsApp"
          className="h-12 rounded-2xl pl-9"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full">
            <Plus className="h-4 w-4" /> Cadastrar Novo Cliente
          </Button>
        </DialogTrigger>
        <NewCustomerDialog
          onSave={(c) => {
            addCustomer(c);
            setNewOpen(false);
          }}
        />
      </Dialog>

      <div className="space-y-3">
        {list.map((c) => {
          const st = customerStatus(c);
          return (
            <button
              key={c.id}
              onClick={() => setOpenId(c.id)}
              className="card-elevated grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.cpf} · {c.whatsapp}
                </p>
                <p className="mt-1 text-sm">
                  Saldo devedor:{" "}
                  <span className="font-semibold">{brl(c.av?.balance ?? 0)}</span>
                </p>
              </div>
              <StatusBadge tone={st === "atraso" ? "danger" : "success"}>
                {st === "atraso" ? "Em Atraso" : "Em Dia"}
              </StatusBadge>
            </button>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ficha encontrada.</p>}
      </div>
    </div>
  );
}

function NewCustomerDialog({
  onSave,
}: {
  onSave: (c: Omit<Customer, "id" | "payments" | "purchases">) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    address: "",
    preferredSize: "M" as Size,
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {(
          [
            ["name", "Nome"],
            ["whatsapp", "WhatsApp"],
            ["cpf", "CPF"],
            ["address", "Endereço"],
            ["preferredSize", "Tamanho preferido"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button disabled={!form.name} onClick={() => onSave({ ...form, av: null })}>
          Salvar ficha
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function CustomerDetail({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  const { registerAv, updateCustomer } = useStore();
  const st = customerStatus(customer);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]!);
  const [edit, setEdit] = useState(customer);

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar às fichas
      </button>

      <div className="card-elevated rounded-2xl p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{customer.name}</h1>
            <p className="text-xs text-muted-foreground">Tamanho preferido: {customer.preferredSize}</p>
          </div>
          <StatusBadge tone={st === "atraso" ? "danger" : "success"}>
            {st === "atraso" ? "Ficha Em Atraso" : "Ficha Em Dia"}
          </StatusBadge>
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd className="truncate">{customer.whatsapp}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">CPF</dt>
            <dd>{customer.cpf}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Endereço</dt>
            <dd className="text-right">{customer.address}</dd>
          </div>
        </dl>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-3 w-full">
              <Pencil className="h-4 w-4" /> Editar Dados
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar dados cadastrais</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(
                [
                  ["name", "Nome"],
                  ["whatsapp", "WhatsApp"],
                  ["cpf", "CPF"],
                  ["address", "Endereço"],
                  ["preferredSize", "Tamanho preferido"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    value={String(edit[key])}
                    onChange={(e) => setEdit({ ...edit, [key]: e.target.value } as Customer)}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  updateCustomer(customer.id, {
                    name: edit.name,
                    whatsapp: edit.whatsapp,
                    cpf: edit.cpf,
                    address: edit.address,
                    preferredSize: edit.preferredSize,
                  });
                  setEditOpen(false);
                }}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {st === "atraso" && (
        <div className="flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          Ficha vencida em {dateOnly(customer.av!.dueDate)} — novas vendas a prazo estão bloqueadas.
        </div>
      )}

      <div className="card-elevated rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="font-bold">Módulo de AV</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Total original</p>
            <p className="text-sm font-bold">{brl(customer.av?.total ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Saldo devedor</p>
            <p className={`text-sm font-bold ${st === "atraso" ? "text-danger" : "text-foreground"}`}>
              {brl(customer.av?.balance ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Vencimento</p>
            <p className="text-sm font-bold">{customer.av ? dateOnly(customer.av.dueDate) : "—"}</p>
          </div>
        </div>
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="mt-3 w-full" disabled={!customer.av || customer.av.balance <= 0}>
              Registrar Abatimento/Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar abatimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Valor pago (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50,00"
                />
              </div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  const value = Number(amount.replace(".", "").replace(",", "."));
                  if (!value) return;
                  registerAv({
                    type: "abate_av",
                    cliente: customer.name,
                    customerId: customer.id,
                    valor: value,
                    forma_pagamento: method,
                  });
                  setAmount("");
                  setPayOpen(false);
                }}
              >
                Confirmar pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="card-elevated rounded-2xl p-4">
        <h2 className="mb-2 font-bold">Histórico de Pagamentos do AV</h2>
        <div className="space-y-2">
          {customer.payments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum abatimento registrado.</p>
          )}
          {customer.payments.map((p) => (
            <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl bg-muted p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{brl(p.amount)} · {p.method}</p>
                <p className="text-xs text-muted-foreground">{dateTime(p.date)}</p>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                Saldo após
                <br />
                <span className="font-semibold text-foreground">{brl(p.balanceAfter)}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-elevated rounded-2xl p-4">
        <h2 className="mb-2 font-bold">Histórico Integral de Compras</h2>
        <div className="space-y-2">
          {customer.purchases.map((p) => (
            <div key={p.id} className="rounded-xl bg-muted p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-medium">{p.items}</p>
                <p className="shrink-0 font-semibold">{brl(p.price)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {dateTime(p.date)} · {p.method}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
