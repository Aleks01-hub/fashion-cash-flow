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
      <div class="purchase">
        <div class="purchase-date">${dateOnly(p.date)}</div>
        <div class="purchase-products">${esc(p.items)}</div>
        <div class="purchase-value">${brl(p.price)}</div>
      </div>`).join("")
    : '<p class="empty">Nenhuma compra registrada.</p>';

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Ficha - ${esc(customer.name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:Arial,Helvetica,sans-serif; color:#171717; font-size:13px; line-height:1.5; }
  .header { border-bottom:1px solid #ccc; padding-bottom:18px; margin-bottom:28px; }
  .brand { font-size:20px; font-weight:700; }
  .title { font-size:16px; margin-top:5px; }
  .date { color:#777; font-size:11px; margin-top:8px; }
  .customer { margin-bottom:30px; }
  .customer-name { font-size:20px; font-weight:700; margin-bottom:5px; }
  .customer-info { color:#666; }
  h2 { font-size:14px; margin:0 0 18px; padding-bottom:8px; border-bottom:1px solid #ddd; }
  .purchase { padding:0 0 22px; margin-bottom:22px; border-bottom:1px solid #e5e5e5; }
  .purchase-date { color:#777; font-size:11px; margin-bottom:7px; }
  .purchase-products { font-size:14px; line-height:1.7; padding-right:90px; }
  .purchase-value { font-size:15px; font-weight:700; margin-top:9px; }
  .summary { margin-top:30px; padding:18px; background:#f6f6f6; border-radius:8px; }
  .summary-row { display:flex; justify-content:space-between; padding:6px 0; }
  .summary-row.total { margin-top:8px; padding-top:14px; border-top:1px solid #ccc; font-size:16px; font-weight:700; }
  .status { margin-top:10px; color:#666; }
  .notes { margin-top:30px; color:#555; white-space:pre-wrap; }
  .empty { color:#777; }
  .footer { margin-top:40px; padding-top:12px; border-top:1px solid #ddd; color:#999; font-size:10px; text-align:center; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
  <header class="header">
    <div class="brand">${esc(businessName)}</div>
    <div class="title">Ficha de compras — ${esc(customer.name)}</div>
    <div class="date">Emitido em ${new Date().toLocaleString("pt-BR")}</div>
  </header>

  <div class="customer">
    <div class="customer-name">${esc(customer.name)}</div>
    <div class="customer-info">${esc(customer.whatsapp || "WhatsApp não informado")}</div>
  </div>

  <section>
    <h2>Compras</h2>
    ${purchases}
  </section>

  <div class="summary">
    <div class="summary-row">
      <span>Total em compras</span>
      <strong>${brl(customer.purchases.reduce((total, p) => total + p.price, 0))}</strong>
    </div>
    <div class="summary-row">
      <span>Saldo da ficha</span>
      <strong>${brl(customer.av?.balance ?? 0)}</strong>
    </div>
    ${customer.av ? `<div class="summary-row"><span>Vencimento</span><strong>${dateOnly(customer.av.dueDate)}</strong></div>` : ""}
  </div>

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
