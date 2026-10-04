import { useMemo, useState } from "react";
import { ArrowLeft, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { customerStatus, useStore } from "@/lib/store";
import { brl, dateTime } from "@/lib/format";
import type { Customer } from "@/lib/mock-data";

type Entry = { id: string; date: string; kind: "compra" | "abate"; amount: number; label: string };

export function CustomerLedger({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  const { addLedgerPayment, updateCustomer } = useStore();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Pix");

  const rows = useMemo(() => {
    const entries: Entry[] = [
      ...customer.purchases.map((p) => ({ id: p.id, date: p.date, kind: "compra" as const, amount: p.price, label: p.items })),
      ...customer.payments.map((p) => ({ id: p.id, date: p.date, kind: "abate" as const, amount: p.amount, label: p.method })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    return entries.map((e, i) => {
      bal = e.kind === "compra" ? bal + e.amount : Math.max(0, bal - e.amount);
      return { ...e, first: i === 0, result: bal };
    });
  }, [customer]);

  const balance = customer.av?.balance ?? 0;
  const quitada = balance <= 0;
  const late = customerStatus(customer) === "atraso";
  const value = Number(amount.replace(",", ".")) || 0;

  return (
    <section className="card-elevated rounded-2xl p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Button>
      <h2 className="mb-4 text-lg font-bold uppercase tracking-wide">Ficha do Cliente</h2>

      <div className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Nome:</span> <b>{customer.name}</b></p>
          <p><span className="text-muted-foreground">Tel:</span> {customer.whatsapp}</p><p><span className="text-muted-foreground">Nascimento:</span> {customer.birthDate ? new Date(customer.birthDate + "T12:00:00").toLocaleDateString("pt-BR") : "Não informado"}</p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Situação:</span>
            {quitada ? (
              <StatusBadge tone="success">Quitada</StatusBadge>
            ) : late ? (
              <StatusBadge tone="danger">Em atraso</StatusBadge>
            ) : (
              <StatusBadge tone="success">Em dia</StatusBadge>
            )}
          </p>
          <Textarea
            placeholder="Obs:"
            className="min-h-[60px]"
            value={customer.notes ?? ""}
            onChange={(e) => updateCustomer(customer.id, { notes: e.target.value })}
          />
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto py-4 font-mono text-sm">
        {quitada && rows.length > 0 ? (
          <p className="rounded-xl bg-success/12 p-3 text-success">Conta quitada — ficha zerada.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">Nenhum lançamento.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="mb-2">
              <div className="flex items-baseline gap-3">
                <span className="w-6 text-muted-foreground">{r.first ? "T=" : r.kind === "compra" ? "+" : "−"}</span>
                <span className={`w-28 text-right font-semibold ${r.kind === "abate" ? "text-success" : ""}`}>{brl(r.amount)}</span>
                <span className="text-xs text-muted-foreground">({dateTime(r.date)})</span>
                <span className="truncate text-xs text-muted-foreground">{r.label}</span>
              </div>
              {!r.first && (
                <div className="flex items-baseline gap-3 border-t border-foreground/40 pt-1" style={{ width: "10.5rem" }}>
                  <span className="w-6 text-muted-foreground">{r.kind === "compra" ? "T=" : "R="}</span>
                  <span className="w-28 text-right font-bold">{brl(r.result)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-bold uppercase">Total devedor</span>
        <span className="text-xl font-bold">{brl(balance)}</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
          {["Pix", "Dinheiro", "Cartão Débito", "Cartão Crédito"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <Button variant="outline" disabled={!value || quitada} onClick={() => { addLedgerPayment(customer.id, value, method); setAmount(""); }}>
          <Minus className="h-4 w-4" /> Abater
        </Button>
      </div>
    </section>
  );
}
