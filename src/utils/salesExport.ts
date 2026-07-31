import { Order, UserProfile } from "../types";

/**
 * Generates and downloads a clean UTF-8 CSV file containing the farmer's sales history
 * formatted for Excel and accounting software.
 */
export const exportSalesToCSV = (
  orders: Order[],
  farmerName: string = "Agricultor AgroMoz",
  periodLabel: string = "Período Geral"
) => {
  if (!orders || orders.length === 0) {
    alert("Nenhum registo de vendas disponível para exportar em CSV.");
    return;
  }

  // Header row
  const headers = [
    "ID Pedido",
    "Data de Venda",
    "Produto Agrícola",
    "Quantidade",
    "Unidade",
    "Preço Unitário (MT)",
    "Faturação Bruta (MT)",
    "Taxa AgroMoz 5% (MT)",
    "Valor Líquido (MT)",
    "Método de Pagamento",
    "Estado da Garantia (Escrow)",
    "Estado da Entrega",
    "Cliente Comprador",
    "Contacto do Cliente",
    "Província do Cliente",
  ];

  const rows = orders.map((o) => {
    const rawDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-MZ") : "N/A";
    const productName = `"${(o.productName || "Produto").replace(/"/g, '""')}"`;
    const buyerName = `"${(o.buyerName || "Cliente").replace(/"/g, '""')}"`;
    const qty = o.quantity || 1;
    const gross = o.subtotal || o.totalAmount || 0;
    const unitPrice = Math.round(gross / qty);
    const fee = o.platformFee || Math.round(gross * 0.05);
    const net = o.farmerNetAmount || (gross - fee);

    return [
      o.id,
      rawDate,
      productName,
      qty,
      o.unit || "kg",
      unitPrice,
      gross,
      fee,
      net,
      o.paymentMethod || "M-Pesa",
      o.escrowStatus || "Pendente",
      o.deliveryStatus || "Pedido recebido",
      buyerName,
      o.buyerPhone || "N/A",
      o.buyerProvince || "Moçambique",
    ].join(";"); // semicolon separated for European/Mozambican Excel
  });

  // Calculate totals
  const totalGross = orders.reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0), 0);
  const totalFee = orders.reduce((acc, curr) => acc + (curr.platformFee || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.05)), 0);
  const totalNet = orders.reduce((acc, curr) => acc + (curr.farmerNetAmount || Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)), 0);

  const totalRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    totalGross,
    totalFee,
    totalNet,
    "",
    "",
    "",
    "",
    "",
    "",
  ].join(";");

  // UTF-8 BOM byte order mark for Excel Portuguese compatibility
  const csvContent =
    "\uFEFF" +
    `# RELATÓRIO DE VENDAS AGRÍCOLAS - AGROMOZ\n` +
    `# Agricultor: ${farmerName}\n` +
    `# Período: ${periodLabel}\n` +
    `# Data de Emissão: ${new Date().toLocaleDateString("pt-MZ")}\n\n` +
    headers.join(";") +
    "\n" +
    rows.join("\n") +
    "\n\n" +
    totalRow;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = `AgroMoz_Historico_Vendas_${farmerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates an official PDF printable report document for accounting and tax purposes
 */
export const exportSalesToPDF = (
  orders: Order[],
  currentUser?: UserProfile | null,
  periodLabel: string = "Período Geral",
  summaryStats?: {
    totalGross: number;
    totalNet: number;
    totalQty: number;
    count: number;
  }
) => {
  if (!orders || orders.length === 0) {
    alert("Nenhum registo de vendas disponível para gerar o relatório PDF.");
    return;
  }

  const farmerName = currentUser?.name || "Agricultor AgroMoz";
  const farmName = currentUser?.farmName || "Machamba Familiar";
  const province = currentUser?.province || "Moçambique";
  const district = currentUser?.district || "";
  const phone = currentUser?.phone || "";
  const issueDate = new Date().toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const grossTotal =
    summaryStats?.totalGross ??
    orders.reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount || 0), 0);
  
  const netTotal =
    summaryStats?.totalNet ??
    orders.reduce(
      (acc, curr) =>
        acc +
        (curr.farmerNetAmount ||
          Math.round((curr.subtotal || curr.totalAmount || 0) * 0.95)),
      0
    );

  const feeTotal = grossTotal - netTotal;
  const totalQty =
    summaryStats?.totalQty ??
    orders.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("A janela de impressão foi bloqueada pelo navegador. Por favor permita pop-ups.");
    return;
  }

  const rowsHtml = orders
    .map((o, idx) => {
      const orderDate = o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("pt-MZ")
        : "N/A";
      const gross = o.subtotal || o.totalAmount || 0;
      const fee = o.platformFee || Math.round(gross * 0.05);
      const net = o.farmerNetAmount || gross - fee;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? "background-color: #f8fafc;" : ""}">
          <td style="padding: 8px 10px; font-weight: bold; font-family: monospace;">#${o.id.slice(-6)}</td>
          <td style="padding: 8px 10px;">${orderDate}</td>
          <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">${o.productName}</td>
          <td style="padding: 8px 10px; text-align: center;">${o.quantity} ${o.unit}</td>
          <td style="padding: 8px 10px; text-align: right; font-family: monospace;">${gross.toLocaleString()} MT</td>
          <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #64748b;">-${fee.toLocaleString()} MT</td>
          <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: bold; color: #166534;">${net.toLocaleString()} MT</td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; ${
              o.escrowStatus === "Liberado"
                ? "background-color: #dcfce7; color: #14532d;"
                : "background-color: #fef3c7; color: #78350f;"
            }">
              ${o.escrowStatus === "Liberado" ? "LIBERADO" : "PENDENTE"}
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 11px;">${o.buyerName} (${o.buyerProvince || "MZ"})</td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-MZ">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Vendas & Contabilidade - ${farmerName}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #166534;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          background-color: #166534;
          color: #f59e0b;
          font-weight: 900;
          font-size: 20px;
          padding: 8px 14px;
          border-radius: 12px;
        }
        .title-box {
          text-align: right;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #cbd5e1;
          text-align: center;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 24px;
        }
        .table th {
          background-color: #166534;
          color: #ffffff;
          padding: 10px;
          text-align: left;
          font-weight: 700;
        }
        .footer {
          border-top: 2px solid #e2e8f0;
          padding-top: 16px;
          font-size: 10px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
        .btn-print {
          background-color: #166534;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <div className="no-print" style="text-align: right;">
        <button onclick="window.print()" class="btn-print">🖨️ Imprimir / Guardar em PDF</button>
      </div>

      <div class="header">
        <div class="brand">
          <div class="logo-box">AgroMoz</div>
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #166534;">Plataforma Agrícola Digital de Moçambique</h1>
            <span style="font-size: 11px; color: #64748b;">Relatório de Faturação & Declaração de Contabilidade Agrícola</span>
          </div>
        </div>
        <div class="title-box">
          <h2 style="margin: 0; font-size: 16px; color: #0f172a;">EXTRATO DE VENDAS</h2>
          <span style="font-size: 11px; color: #166534; font-weight: bold;">${periodLabel}</span>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <strong style="color: #166534; font-size: 13px;">DADOS DO AGRICULTOR / PRODUTOR:</strong><br>
          <strong>Nome:</strong> ${farmerName}<br>
          <strong>Machamba / Empresa:</strong> ${farmName}<br>
          <strong>Localização:</strong> ${district ? `${district}, ` : ""}${province}, Moçambique<br>
          <strong>Contacto:</strong> ${phone || "N/A"}
        </div>
        <div style="text-align: right;">
          <strong style="color: #166534; font-size: 13px;">DETALHES DO DOCUMENTO:</strong><br>
          <strong>Data de Emissão:</strong> ${issueDate}<br>
          <strong>Total de Registos:</strong> ${orders.length} vendas<br>
          <strong>Moeda:</strong> Meticais (MZN / MT)<br>
          <strong>Garantia Digital:</strong> Sistema Escrow AgroMoz
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
          <span style="font-size: 10px; color: #166534; font-weight: bold;">FATURAÇÃO BRUTA</span>
          <div style="font-size: 16px; font-weight: 900; color: #14532d; font-family: monospace; margin-top: 4px;">
            ${grossTotal.toLocaleString()} MT
          </div>
        </div>
        <div class="stat-card" style="background-color: #f8fafc; border-color: #cbd5e1;">
          <span style="font-size: 10px; color: #475569; font-weight: bold;">COMISSÃO PLAFORMA (5%)</span>
          <div style="font-size: 16px; font-weight: 900; color: #475569; font-family: monospace; margin-top: 4px;">
            -${feeTotal.toLocaleString()} MT
          </div>
        </div>
        <div class="stat-card" style="background-color: #fef3c7; border-color: #fde68a;">
          <span style="font-size: 10px; color: #92400e; font-weight: bold;">VALOR LÍQUIDO AGRICULTOR</span>
          <div style="font-size: 16px; font-weight: 900; color: #78350f; font-family: monospace; margin-top: 4px;">
            ${netTotal.toLocaleString()} MT
          </div>
        </div>
        <div class="stat-card" style="background-color: #eff6ff; border-color: #bfdbfe;">
          <span style="font-size: 10px; color: #1e40af; font-weight: bold;">VOLUME VENDIDO</span>
          <div style="font-size: 16px; font-weight: 900; color: #1e3a8a; font-family: monospace; margin-top: 4px;">
            ${totalQty.toLocaleString()} un/kg
          </div>
        </div>
      </div>

      <h3 style="font-size: 13px; color: #0f172a; margin-bottom: 8px; font-weight: 800;">HISTÓRICO DETALHADO DE TRANSAÇÕES</h3>

      <table class="table">
        <thead>
          <tr>
            <th>Nº Pedido</th>
            <th>Data</th>
            <th>Produto</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Bruto</th>
            <th style="text-align: right;">Taxa 5%</th>
            <th style="text-align: right;">Líquido</th>
            <th style="text-align: center;">Garantia</th>
            <th>Comprador</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <strong>AgroMoz Moçambique</strong> — Conectando a Machamba ao Mercado Nacional.<br>
          Este documento serve como comprovativo de vendas e extrato oficial para efeitos de contabilidade e gestão agrícola.
        </div>
        <div style="text-align: right;">
          Assinado Digitalmente por AgroMoz Escrow System<br>
          Página 1 de 1
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
