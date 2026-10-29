import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { RefreshCw, PlusCircle, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storeService, type ApiAvAccount, type ApiCustomer } from "@/lib/api-client";

const brl = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
const date = (value?: string | null) => value ? new Date(value + (value.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "—";
const statusText: Record<ApiAvAccount["status"], string> = { ACTIVE: "Em aberto", PAID: "Quitada", OVERDUE: "Em atraso" };

export function AvAccountsPanel() {
  const [accounts, setAccounts] = useState<ApiAvAccount[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "OTHER">("PIX");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountData, customerData] = await Promise.all([storeService.av.list(), storeService.customers.list()]);
      setAccounts(accountData);
      setCustomers(customerData);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível acessar a API.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => ({
    open: accounts.filter((a) => a.status !== "PAID").reduce((sum, a) => sum + Number(a.currentBalance), 0),
    overdue: accounts.filter((a) => a.status === "OVERDUE").length,
    paid: accounts.filter((a) => a.status === "PAID").length,
  }), [accounts]);

  const filtered = accounts.filter((a) => !search || [a.customerName, a.description, statusText[a.status]].join(" ").toLowerCase().includes(search.toLowerCase()));

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (!customerId || !description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Selecione o cliente, informe a descrição e um valor válido.");
      return;
    }
    setSaving(true);
    try {
      await storeService.av.create({ customerId, description: description.trim(), amount: numericAmount, dueDate: dueDate || null });
      setDescription(""); setAmount(""); setDueDate("");
      toast.success("Conta AV criada no MySQL.");
      await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao criar conta."); }
    finally { setSaving(false); }
  }

  async function registerPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(paymentAmount.replace(",", "."));
    if (!selectedAccount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Selecione uma conta e informe um pagamento válido.");
      return;
    }
    setSaving(true);
    try {
      await storeService.av.registerPayment(selectedAccount, { amount: numericAmount, method: paymentMethod });
      setPaymentAmount("");
      toast.success("Pagamento registrado e saldo atualizado.");
      await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao registrar pagamento."); }
    finally { setSaving(false); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold">Contas a receber — API/MySQL</h2><p className="text-sm text-muted-foreground">Esta tela consulta e altera os registros do backend, separadamente dos dados de demonstração locais.</p></div>
      <Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar</Button>
    </div>

    {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Não foi possível carregar os dados da API</p><p className="mt-1">{error}</p><p className="mt-2 text-muted-foreground">Confira se o MySQL e o backend estão ativos e se VITE_API_BASE_URL aponta para a API.</p></div>}

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card-elevated rounded-xl p-4"><p className="text-xs text-muted-foreground">Saldo em aberto</p><p className="mt-1 text-xl font-bold">{brl(totals.open)}</p></div>
      <div className="card-elevated rounded-xl p-4"><p className="text-xs text-muted-foreground">Contas em atraso</p><p className="mt-1 text-xl font-bold">{totals.overdue}</p></div>
      <div className="card-elevated rounded-xl p-4"><p className="text-xs text-muted-foreground">Contas quitadas</p><p className="mt-1 text-xl font-bold">{totals.paid}</p></div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <form onSubmit={createAccount} className="card-elevated space-y-3 rounded-2xl p-4">
        <h3 className="flex items-center gap-2 font-bold"><PlusCircle className="h-4 w-4" /> Nova conta AV</h3>
        <label className="block space-y-1 text-sm"><span>Cliente do banco</span><select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Selecione um cliente</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.whatsapp}</option>)}</select></label>
        <label className="block space-y-1 text-sm"><span>Descrição da compra / dívida</span><Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: 2 camisetas e 1 bermuda" maxLength={240} /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-sm"><span>Valor (R$)</span><Input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></label><label className="block space-y-1 text-sm"><span>Vencimento</span><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label></div>
        <Button type="submit" disabled={saving || loading || customers.length === 0} className="w-full">Criar conta no banco</Button>
      </form>

      <form onSubmit={registerPayment} className="card-elevated space-y-3 rounded-2xl p-4">
        <h3 className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4" /> Registrar abatimento</h3>
        <label className="block space-y-1 text-sm"><span>Conta em aberto</span><select required value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Selecione uma conta</option>{accounts.filter((a) => a.status !== "PAID").map((a) => <option key={a.id} value={a.id}>{a.customerName} — {a.description} ({brl(a.currentBalance)})</option>)}</select></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1 text-sm"><span>Valor recebido (R$)</span><Input required inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0,00" /></label><label className="block space-y-1 text-sm"><span>Forma de pagamento</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="DEBIT">Cartão de débito</option><option value="CREDIT">Cartão de crédito</option><option value="TRANSFER">Transferência</option><option value="OTHER">Outro</option></select></label></div>
        <Button type="submit" disabled={saving || loading || accounts.every((a) => a.status === "PAID")} className="w-full">Registrar pagamento</Button>
      </form>
    </div>

    <div className="card-elevated overflow-x-auto rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">Histórico de contas</h3><Input className="h-9 w-64" placeholder="Buscar cliente ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {loading ? <p className="p-4 text-sm text-muted-foreground">Carregando contas do MySQL…</p> : filtered.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma conta encontrada na API.</p> : <Table><TableHeader><TableRow><TableHead>Cliente / descrição</TableHead><TableHead>Criação</TableHead><TableHead>Vencimento</TableHead><TableHead>Situação</TableHead><TableHead>Saldo</TableHead><TableHead>Pagamentos</TableHead></TableRow></TableHeader><TableBody>{filtered.map((a) => <TableRow key={a.id}><TableCell><p className="font-medium">{a.customerName}</p><p className="text-xs text-muted-foreground">{a.description}</p></TableCell><TableCell>{date(a.createdAt)}</TableCell><TableCell>{date(a.dueDate)}</TableCell><TableCell><span className="inline-flex items-center gap-1 text-sm">{a.status === "PAID" ? <CheckCircle2 className="h-4 w-4 text-success" /> : a.status === "OVERDUE" ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}{statusText[a.status]}</span></TableCell><TableCell className="font-semibold">{brl(a.currentBalance)}</TableCell><TableCell>{a.payments.length}</TableCell></TableRow>)}</TableBody></Table>}
    </div>
  </section>;
}
