import type { Customer } from "@/lib/mock-data";
import { brl, dateOnly, dateTime } from "@/lib/format";

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  } as Record<string, string>)[char] ?? char);

export function printCustomerPdf(customer: Customer) {
  const businessName = localStorage.getItem("modah:business-name") || "Caixa Central";
  const status = customer.av?.balance
    ? new Date(customer.av.dueDate + "T23:59:59").getTime() < Date.now()
      ? "Em atraso"
      : "Em dia"
    : "Quitada";

  const purchases = customer.purchases.length
    ? customer.purchases.map((p) => `
      <tr><td>${dateTime(p.date)}</td><td>${esc(p.items)}</td><td>${esc(p.method)}</td><td class="money">${brl(p.price)}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">Nenhuma compra registrada.</td></tr>';

  const payments = customer.payments.length
    ? customer.payments.map((p) => `
      <tr><td>${dateTime(p.date)}</td><td>${esc(p.method)}</td><td class="money">${brl(p.amount)}</td><td class="money">${brl(p.balanceAfter)}</td></tr>`).join("")
    : '<tr><td colspan="4" class="empty">Nenhum pagamento/abatimento registrado.</td></tr>';

  const notes = customer.notes ? `
    <section><h2>Observações</h2><p class="notes">${esc(customer.notes)}</p></section>` : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Ficha - ${esc(customer.name)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #171717; font-size: 11px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #171717; padding-bottom:12px; margin-bottom:18px; }
  .brand { font-size:18px; font-weight:800; }
  .title { font-size:14px; font-weight:700; margin-top:3px; }
  .date { text-align:right; color:#666; }
  .grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:16px; }
  .field { border:1px solid #ddd; border-radius:6px; padding:8px; }
  .label { color:#666; font-size:9px; text-transform:uppercase; margin-bottom:3px; }
  .value { font-weight:600; }
  .status { display:inline-block; padding:4px 8px; border-radius:999px; font-weight:700; background:#f1f1f1; }
  section { margin-top:16px; }
  h2 { font-size:12px; margin:0 0 8px; border-bottom:1px solid #ddd; padding-bottom:5px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f3f3f3; text-align:left; font-size:9px; text-transform:uppercase; }
  th, td { border-bottom:1px solid #e2e2e2; padding:6px 5px; vertical-align:top; }
  .money { text-align:right; white-space:nowrap; }
  .empty { color:#777; text-align:center; padding:12px; }
  .summary { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:12px; }
  .summary .field { background:#f7f7f7; }
  .balance { font-size:15px; font-weight:800; }
  .notes { white-space:pre-wrap; border:1px solid #ddd; border-radius:6px; padding:9px; }
  .footer { margin-top:24px; padding-top:8px; border-top:1px solid #ddd; color:#777; font-size:9px; text-align:center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <header class="header">
    <div><div class="brand">${esc(businessName)}</div><div class="title">Ficha do Cliente</div></div>
    <div class="date">Emitido em<br><strong>${new Date().toLocaleString("pt-BR")}</strong></div>
  </header>

  <div class="grid">
    <div class="field"><div class="label">Cliente</div><div class="value">${esc(customer.name)}</div></div>
    <div class="field"><div class="label">Situação</div><div class="value"><span class="status">${status}</span></div></div>
    <div class="field"><div class="label">WhatsApp</div><div class="value">${esc(customer.whatsapp || "Não informado")}</div></div>
    <div class="field"><div class="label">CPF</div><div class="value">${esc(customer.cpf || "Não informado")}</div></div>
    <div class="field"><div class="label">Nascimento</div><div class="value">${customer.birthDate ? dateOnly(customer.birthDate) : "Não informado"}</div></div>
    <div class="field"><div class="label">Tamanho preferido</div><div class="value">${esc(customer.preferredSize || "Não informado")}</div></div>
    <div class="field" style="grid-column:1/-1"><div class="label">Endereço</div><div class="value">${esc(customer.address || "Não informado")}</div></div>
  </div>

  <section>
    <h2>Resumo financeiro</h2>
    <div class="summary">
      <div class="field"><div class="label">Total original AV</div><div class="balance">${brl(customer.av?.total ?? 0)}</div></div>
      <div class="field"><div class="label">Saldo devedor</div><div class="balance">${brl(customer.av?.balance ?? 0)}</div></div>
      <div class="field"><div class="label">Vencimento</div><div class="value">${customer.av ? dateOnly(customer.av.dueDate) : "—"}</div></div>
    </div>
  </section>

  <section>
    <h2>Histórico de compras</h2>
    <table><thead><tr><th>Data</th><th>Itens</th><th>Pagamento</th><th>Valor</th></tr></thead><tbody>${purchases}</tbody></table>
  </section>

  <section>
    <h2>Pagamentos / abatimentos</h2>
    <table><thead><tr><th>Data</th><th>Forma</th><th>Valor</th><th>Saldo após</th></tr></thead><tbody>${payments}</tbody></table>
  </section>

  ${notes}
  <div class="footer">Documento gerado pelo sistema ${esc(businessName)}.</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    window.alert("Não foi possível abrir a impressão. Verifique se o navegador bloqueou a janela.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
