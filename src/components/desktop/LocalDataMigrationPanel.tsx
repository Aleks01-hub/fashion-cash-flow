import { useState } from "react";
import { Button } from "@/components/ui/button";
import { storeService } from "@/lib/api-client";

export function LocalDataMigrationPanel() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const backup = () => {
    const keys = ["modah:customers", "modah:products", "modah:sales"];
    const data = Object.fromEntries(keys.map((key) => [key, JSON.parse(localStorage.getItem(key) || "[]")]));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "backup-modah-local.json"; a.click(); URL.revokeObjectURL(url);
  };
  async function checkApi() {
    setBusy(true);
    try {
      const [customers, products, sales] = await Promise.all([storeService.customers.list(), storeService.products.list(), storeService.sales.list()]);
      setStatus("API conectada. Clientes: " + customers.length + ", produtos: " + products.length + ", vendas: " + sales.length + ". A importação deve ser planejada após validar o backup.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "API indisponível."); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-3xl space-y-4">
    <h2 className="text-lg font-bold">Migração de dados locais para MySQL</h2>
    <p className="text-sm text-muted-foreground">Faça primeiro um backup dos clientes, produtos e vendas salvos neste navegador. Os dados de demonstração do código não são incluídos.</p>
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={backup}>Baixar backup JSON</Button><Button onClick={() => void checkApi()} disabled={busy}>{busy ? "Verificando…" : "Verificar API e dados existentes"}</Button></div>
    {status && <p className="rounded-xl border p-4 text-sm">{status}</p>}
    <p className="rounded-xl border border-warning/40 p-4 text-sm">A importação completa precisa ser transacional para evitar duplicações ou divergência no estoque se a conexão cair. Esta tela ainda não envia os dados; primeiro confira o backup e o estado do banco.</p>
  </section>;
}
