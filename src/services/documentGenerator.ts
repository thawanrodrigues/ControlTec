/**
 * documentGenerator.ts
 * Geração de Recibos e Notas de Serviço em PDF via Web Print API
 */

export interface DocumentData {
  estimate: {
    id: string;
    code?: string;
    description: string;
    totalValue: number;
    status: string;
    items?: string;
    notes?: string;
    createdAt?: string;
    warranty?: string;
  };
  customer: {
    name: string;
    document?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  company: {
    name: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

const LOGO_HTML = `
  <div style="width: 36px; height: 36px; background: #0F2A5A; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-family: 'Arial Black', sans-serif; font-size: 14px; font-weight: 900; color: #FFB703; line-height: 1; flex-shrink: 0;">CT</div>
`;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDocNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function parseItems(itemsStr?: string): Array<{ name: string; qty: number; price: number }> {
  try {
    const parsed = JSON.parse(itemsStr || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [];
}

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #f4f6fb;
    min-height: 100vh;
    padding: 0;
  }
  .page {
    background: #fff;
    width: 760px;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    box-shadow: 0 0 40px rgba(0,0,0,0.12);
    position: relative;
  }
  .header {
    background: #0F2A5A;
    color: #fff;
    padding: 28px 40px 22px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .company-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
  .company-name span { color: #FFB703; }
  .company-info { font-size: 12px; opacity: 0.75; margin-top: 4px; line-height: 1.6; }
  .doc-badge {
    text-align: right;
  }
  .doc-type {
    font-size: 20px;
    font-weight: 800;
    color: #FFB703;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .doc-number { font-size: 13px; opacity: 0.7; margin-top: 4px; }
  .doc-date { font-size: 12px; opacity: 0.6; margin-top: 2px; }

  .body { padding: 32px 40px; }

  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: #0F2A5A;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    border-bottom: 2px solid #0F2A5A;
    padding-bottom: 6px;
    margin-bottom: 14px;
  }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; }
  .info-item label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; }
  .info-item p { font-size: 14px; color: #1C1C1E; font-weight: 500; margin-top: 2px; }

  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th {
    background: #f0f3f8;
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: #0F2A5A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .items-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
    color: #1C1C1E;
  }
  .items-table tr:last-child td { border-bottom: none; }
  .items-table .right { text-align: right; }
  .items-table .subtotal-row td { background: #fafafa; font-weight: 600; }

  .description-box {
    background: #f8f9fc;
    border-left: 4px solid #0F2A5A;
    padding: 14px 16px;
    border-radius: 0 6px 6px 0;
    font-size: 14px;
    color: #1C1C1E;
    line-height: 1.6;
  }

  .total-section {
    background: #0F2A5A;
    color: #fff;
    border-radius: 10px;
    padding: 20px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
  }
  .total-label { font-size: 13px; font-weight: 600; opacity: 0.8; }
  .total-value { font-size: 28px; font-weight: 900; color: #FFB703; }

  .signature-section {
    margin-top: 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .signature-box { text-align: center; }
  .signature-line {
    border-top: 1px solid #ccc;
    margin-bottom: 8px;
    padding-top: 8px;
  }
  .signature-label { font-size: 12px; color: #888; }
  .signature-name { font-size: 13px; font-weight: 600; color: #1C1C1E; margin-top: 2px; }

  .footer {
    background: #f0f3f8;
    padding: 16px 40px;
    text-align: center;
    margin-top: 32px;
    border-top: 2px solid #e8ecf4;
  }
  .footer p { font-size: 12px; color: #888; line-height: 1.7; }
  .footer strong { color: #0F2A5A; }

  .stamp {
    display: inline-block;
    border: 3px solid;
    border-radius: 8px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    transform: rotate(-8deg);
    margin-top: 12px;
  }
  .stamp.aprovado { color: #10B981; border-color: #10B981; }
  .stamp.pendente { color: #F59E0B; border-color: #F59E0B; }

  tr, .section, .total-section, .signature-section, .guarantee-box, .description-box {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; max-width: 100%; }
    .no-print { display: none !important; }
  }
`;

const THERMAL_STYLES = (width: string) => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    background: #fff; color: #000;
    padding: 5px; width: ${width}; margin: 0 auto;
    font-size: 12px;
  }
  .page { width: 100%; box-shadow: none; padding: 0; }
  .header { background: transparent; color: #000; padding: 0 0 10px 0; text-align: center; border-bottom: 1px dashed #000; display: block; }
  .header-left { display: block; }
  .company-name { font-size: 16px; font-weight: bold; }
  .company-name span { color: #000; }
  .company-info { font-size: 10px; margin-top: 4px; }
  .doc-badge { text-align: center; margin-top: 10px; }
  .doc-type { font-size: 14px; font-weight: bold; }
  .doc-number, .doc-date { font-size: 10px; }
  .body { padding: 10px 0; }
  .section { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
  .section-title { font-size: 11px; font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: none; }
  .info-grid { display: block; }
  .info-item { margin-bottom: 4px; }
  .info-item label { font-size: 10px; display: inline-block; width: 60px; font-weight: bold; }
  .info-item p { font-size: 10px; display: inline; margin-left: 5px; }
  .items-table { width: 100%; font-size: 10px; }
  .items-table th { background: transparent; color: #000; padding: 2px 0; border-bottom: 1px solid #000; }
  .items-table td { padding: 2px 0; border-bottom: 1px dashed #ccc; }
  .description-box { font-size: 10px; padding: 5px; border: none; background: transparent; }
  .total-section { background: transparent; color: #000; padding: 10px 0; text-align: right; display: block; border-bottom: 1px dashed #000; border-radius: 0; margin-top: 0; }
  .total-label { font-size: 12px; font-weight: bold; }
  .total-value { font-size: 16px; font-weight: bold; }
  .signature-section { display: block; margin-top: 20px; }
  .signature-box { margin-bottom: 20px; }
  .signature-line { border-top: 1px dashed #000; }
  .footer { background: transparent; padding: 10px 0; text-align: center; border-top: none; }
  .footer p { font-size: 9px; color: #000; }
  .stamp { border-color: #000 !important; color: #000 !important; font-size: 10px; padding: 2px 6px; }
  .header-left svg { display: none; }
  .watermark { display: none; }
  .guarantee-box { border: 1px dashed #000; background: transparent; padding: 5px; margin-bottom: 10px; border-radius: 0;}
  .guarantee-icon { display: none; }
  .guarantee-text h4 { color: #000; font-size: 10px; }
  .guarantee-text p { font-size: 9px; color: #000; }
  @media print { .no-print { display: none !important; } }
`;

const ACTION_BAR = (docType: string, whatsappText: string) => `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  
  <div class="no-print" style="
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #0F2A5A;
    padding: 14px 24px;
    display: flex; justify-content: center; gap: 16px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    z-index: 100;
  ">
    <button onclick="window.print()" style="
      background: #FFB703; color: #0F2A5A; border: none;
      padding: 12px 28px; border-radius: 8px; font-size: 15px;
      font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px;
    ">
      🖨️ Salvar / Imprimir PDF
    </button>
    <button onclick="shareViaWhatsApp()" style="
      background: #25D366; color: #fff; border: none;
      padding: 12px 28px; border-radius: 8px; font-size: 15px;
      font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px;
    ">
      📱 Enviar via WhatsApp
    </button>
    <button onclick="window.close()" style="
      background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.3);
      padding: 12px 20px; border-radius: 8px; font-size: 15px;
      font-weight: 700; cursor: pointer;
    ">
      ✕ Fechar
    </button>
  </div>
  <div style="height: 80px;" class="no-print"></div>

  <script>
    async function shareViaWhatsApp() {
      const btn = document.querySelector('button[onclick="shareViaWhatsApp()"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Gerando PDF...';
      btn.disabled = true;

      try {
        // Reset scroll position to avoid blank space at top of PDF
        window.scrollTo(0, 0);

        const element = document.querySelector('.page');
        // Measure actual content height to fit everything on ONE page
        const contentH = element.scrollHeight;
        const contentW = 760;
        // Convert px to pt for jsPDF (1px = 0.75pt at 96dpi)
        const ptW = Math.round(contentW * 0.75);
        const ptH = Math.round(contentH * 0.75);
        const opt = {
          margin:       0,
          filename:     '${docType}.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { 
            scale: 2, 
            useCORS: true,
            windowWidth: contentW + 2,
            width: contentW,
            height: contentH,
            scrollY: 0,
            scrollX: 0,
            x: 0,
            y: 0
          },
          jsPDF:        { unit: 'pt', format: [ptW, ptH], orientation: 'portrait' },
        };

        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        const file = new File([pdfBlob], '${docType}.pdf', { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          // Celular / PC compatível
          await navigator.share({
            title: '${docType}',
            text: \`${whatsappText}\`,
            files: [file]
          });
        } else {
          // Fallback para PC (WhatsApp Web não aceita arquivo via link)
          alert("O seu navegador de PC não suporta envio direto. O PDF será baixado automaticamente e o WhatsApp abrirá para você anexá-lo!");
          
          const url = window.URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = '${docType}.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          
          setTimeout(() => {
             window.open('https://wa.me/?text=' + encodeURIComponent(\`${whatsappText}\`), '_blank');
          }, 1000);
        }
      } catch (err) {
        console.error("Erro ao compartilhar:", err);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  </script>
`;

export function generateRecibo(data: DocumentData): void {
  const { estimate, customer, company } = data;
  const items = parseItems(estimate.items);
  const docNum = getDocNumber(estimate.id);
  const date = formatDate(estimate.createdAt);
  const total = formatCurrency(estimate.totalValue);

  const paperSize = localStorage.getItem('printSettings_paperSizeReceipt') || '80mm';
  const isThermal = paperSize === '80mm' || paperSize === '58mm';
  const thermalWidth = paperSize === '80mm' ? '300px' : '220px';
  const activeStyles = isThermal ? THERMAL_STYLES(thermalWidth) : BASE_STYLES;

  const whatsappMsg = `*RECIBO DE SERVIÇO - ${company.name}*\n\nCliente: ${customer.name}\nDoc: ${docNum}\nData: ${date}\nTotal: ${total}\n\nPara visualizar o recibo completo, solicite o arquivo PDF.`;

  const itemsRows = items.length > 0
    ? items.map(i => `
        <tr>
          <td>${i.name || 'Serviço/Item'}</td>
          <td class="right">${i.qty || 1}</td>
          <td class="right">${formatCurrency(i.price || 0)}</td>
          <td class="right">${formatCurrency((i.qty || 1) * (i.price || 0))}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4">${estimate.description}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recibo ${docNum} - ${company.name}</title>
  <style>${activeStyles}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${LOGO_HTML}
        <div>
          <div class="company-name">Control<span>Tec</span></div>
          <div class="company-info">
            ${company.name}<br/>
            ${company.cnpj ? `CNPJ: ${company.cnpj}` : ''}<br/>
            ${company.phone || ''} ${company.email ? `| ${company.email}` : ''}
          </div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-type">Recibo</div>
        <div class="doc-number">${docNum}</div>
        <div class="doc-date">Data: ${date}</div>
        ${estimate.warranty ? `<div class="doc-date">Garantia: ${estimate.warranty}</div>` : ''}
        <div style="margin-top:10px;">
          <span class="stamp ${estimate.status === 'Aprovado' ? 'aprovado' : 'pendente'}">${estimate.status}</span>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Nome</label>
            <p>${customer.name}</p>
          </div>
          ${customer.document ? `<div class="info-item"><label>CPF/CNPJ</label><p>${customer.document}</p></div>` : ''}
          ${customer.phone ? `<div class="info-item"><label>Telefone</label><p>${customer.phone}</p></div>` : ''}
          ${customer.email ? `<div class="info-item"><label>E-mail</label><p>${customer.email}</p></div>` : ''}
          ${customer.address ? `<div class="info-item" style="grid-column: span 2;"><label>Endereço</label><p>${customer.address}</p></div>` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Serviços / Itens</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="right">Qtd</th>
              <th class="right">Unit.</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      ${estimate.notes ? `
      <div class="section">
        <div class="section-title">Observações</div>
        <div class="description-box">${estimate.notes}</div>
      </div>` : ''}

      <div class="total-section">
        <div>
          <div class="total-label">VALOR TOTAL RECEBIDO</div>
          <div style="font-size:12px;opacity:0.6;margin-top:2px;">Referente aos serviços descritos acima</div>
        </div>
        <div class="total-value">${total}</div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div style="height:50px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura do Responsável</div>
          <div class="signature-name">${company.name}</div>
        </div>
        <div class="signature-box">
          <div style="height:50px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura do Cliente</div>
          <div class="signature-name">${customer.name}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong>${company.name}</strong> — Sistema ControlTec<br/>
        Este recibo confirma o pagamento dos serviços prestados descritos acima.<br/>
        Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
      </p>
    </div>
  </div>

  ${ACTION_BAR('Recibo', whatsappMsg)}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function generateNotaServico(data: DocumentData): void {
  const { estimate, customer, company } = data;
  const items = parseItems(estimate.items);
  const docNum = getDocNumber(estimate.id);
  const date = formatDate(estimate.createdAt);
  const total = formatCurrency(estimate.totalValue);
  const validUntil = (estimate as any).validUntil ? formatDate((estimate as any).validUntil) : '—';

  const paperSize = localStorage.getItem('printSettings_paperSizeOs') || 'A4';
  const isThermal = paperSize === '80mm' || paperSize === '58mm';
  const thermalWidth = paperSize === '80mm' ? '300px' : '220px';
  const activeStyles = isThermal ? THERMAL_STYLES(thermalWidth) : BASE_STYLES;

  const whatsappMsg = `*NOTA DE SERVIÇO - ${company.name}*\n\nCliente: ${customer.name}\nNúmero: ${docNum}\nData: ${date}\nTotal: ${total}\nStatus: ${estimate.status}\n\nPara visualizar a nota completa, solicite o arquivo PDF.`;

  const itemsRows = items.length > 0
    ? items.map(i => `
        <tr>
          <td>${i.name || 'Serviço'}</td>
          <td class="right">${i.qty || 1}</td>
          <td class="right">${formatCurrency(i.price || 0)}</td>
          <td class="right">${formatCurrency((i.qty || 1) * (i.price || 0))}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3">${estimate.description}</td><td class="right">${total}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nota de Serviço ${docNum} - ${company.name}</title>
  <style>
    ${activeStyles}
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 90px;
      font-weight: 900;
      color: rgba(15, 42, 90, 0.04);
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      letter-spacing: 8px;
      text-transform: uppercase;
    }
    .timeline { position: relative; padding-left: 24px; }
    .timeline::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 2px; background: #e8ecf4; }
    .timeline-item { position: relative; margin-bottom: 14px; }
    .timeline-dot { position: absolute; left: -24px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: #FFB703; border: 2px solid #0F2A5A; }
    .timeline-text { font-size: 13px; color: #555; }
    .timeline-title { font-weight: 700; color: #0F2A5A; }
    .guarantee-box {
      background: linear-gradient(135deg, #f0f7f0 0%, #e8f5e8 100%);
      border: 1.5px solid #10B981;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .guarantee-icon { font-size: 28px; }
    .guarantee-text h4 { color: #10B981; font-size: 13px; font-weight: 700; margin-bottom: 4px; }
    .guarantee-text p { font-size: 12px; color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="watermark">ControlTec</div>
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${LOGO_HTML}
        <div>
          <div class="company-name">Control<span>Tec</span></div>
          <div class="company-info">
            ${company.name}<br/>
            ${company.cnpj ? `CNPJ: ${company.cnpj}` : ''}<br/>
            ${company.phone || ''} ${company.email ? `| ${company.email}` : ''}
          </div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-type">Nota de Serviço</div>
        <div class="doc-number">${docNum}</div>
        <div class="doc-date">Emissão: ${date}</div>
        ${validUntil !== '—' ? `<div class="doc-date">Válido até: ${validUntil}</div>` : ''}
        ${estimate.warranty ? `<div class="doc-date">Garantia: ${estimate.warranty}</div>` : ''}
        <div style="margin-top:10px;">
          <span class="stamp ${estimate.status === 'Aprovado' ? 'aprovado' : 'pendente'}">${estimate.status}</span>
        </div>
      </div>
    </div>

    <div class="body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
        <div class="section" style="margin-bottom:0;">
          <div class="section-title">Prestador de Serviço</div>
          <div class="info-grid" style="grid-template-columns:1fr;">
            <div class="info-item"><label>Empresa</label><p>${company.name}</p></div>
            ${company.cnpj ? `<div class="info-item"><label>CNPJ</label><p>${company.cnpj}</p></div>` : ''}
            ${company.phone ? `<div class="info-item"><label>Telefone</label><p>${company.phone}</p></div>` : ''}
            ${company.address ? `<div class="info-item"><label>Endereço</label><p>${company.address}</p></div>` : ''}
          </div>
        </div>
        <div class="section" style="margin-bottom:0;">
          <div class="section-title">Contratante</div>
          <div class="info-grid" style="grid-template-columns:1fr;">
            <div class="info-item"><label>Nome</label><p>${customer.name}</p></div>
            ${customer.document ? `<div class="info-item"><label>CPF/CNPJ</label><p>${customer.document}</p></div>` : ''}
            ${customer.phone ? `<div class="info-item"><label>Telefone</label><p>${customer.phone}</p></div>` : ''}
            ${customer.address ? `<div class="info-item"><label>Endereço</label><p>${customer.address}</p></div>` : ''}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Descrição dos Serviços</div>
        <div class="description-box">${estimate.description}</div>
      </div>

      <div class="section">
        <div class="section-title">Itens e Valores</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Serviço / Peça</th>
              <th class="right">Qtd</th>
              <th class="right">Valor Unit.</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      ${estimate.notes ? `
      <div class="section">
        <div class="section-title">Observações Técnicas</div>
        <div class="description-box">${estimate.notes}</div>
      </div>` : ''}

      <div class="guarantee-box" style="margin-bottom:24px;">
        <div class="guarantee-icon">🛡️</div>
        <div class="guarantee-text">
          <h4>GARANTIA DOS SERVIÇOS</h4>
          <p>${estimate.warranty ? `Este serviço possui garantia de <strong>${estimate.warranty}</strong>.` : 'Os serviços prestados possuem garantia conforme acordado com o cliente.'} Em caso de dúvidas, entre em contato com nossa empresa.</p>
        </div>
      </div>

      <div class="total-section">
        <div>
          <div class="total-label">VALOR TOTAL DOS SERVIÇOS</div>
          <div style="font-size:12px;opacity:0.6;margin-top:2px;">Inclui mão de obra e peças descritas</div>
        </div>
        <div class="total-value">${total}</div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div style="height:50px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Prestador dos Serviços</div>
          <div class="signature-name">${company.name}</div>
        </div>
        <div class="signature-box">
          <div style="height:50px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Contratante (Ciente dos Serviços)</div>
          <div class="signature-name">${customer.name}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong>Nota de Serviço — ${company.name}</strong> | Sistema ControlTec<br/>
        Este documento certifica a prestação dos serviços descritos acima.<br/>
        Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
      </p>
    </div>
  </div>

  ${ACTION_BAR('Nota de Serviço', whatsappMsg)}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export interface SaleReceiptData {
  sale: {
    id: string;
    code: string;
    totalServices: number;
    totalProducts: number;
    discount: number;
    totalValue: number;
    paymentMethod: string;
    status: string; // 'Pago' | 'Pendente'
    paidAt?: string | null;
    createdAt?: string;
    items: string | Array<{
      id?: string;
      type: 'servico' | 'produto' | 'avulso';
      name: string;
      qty: number;
      price: number;
      subtotal?: number;
    }>;
    notes?: string;
    warranty?: string;
    customerName?: string;
  };
  customer?: {
    name: string;
    document?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  company: {
    name: string;
    tradeName?: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export function generateReciboVenda(data: SaleReceiptData): void {
  const { sale, customer, company } = data;
  const docNum = sale.code || `#${sale.id.slice(0, 8).toUpperCase()}`;
  const date = formatDate(sale.createdAt || sale.paidAt || undefined);
  const total = formatCurrency(sale.totalValue);
  const clientName = customer?.name || sale.customerName || 'Consumidor Final';

  let rawItems: any[] = [];
  if (typeof sale.items === 'string') {
    try {
      rawItems = JSON.parse(sale.items || '[]');
    } catch {
      rawItems = [];
    }
  } else if (Array.isArray(sale.items)) {
    rawItems = sale.items;
  }

  const servicos = rawItems.filter(i => i.type === 'servico');
  const produtos = rawItems.filter(i => i.type === 'produto' || i.type === 'avulso' || !i.type);

  const subtotalServicos = servicos.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);
  const subtotalProdutos = produtos.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);
  const desconto = sale.discount || 0;

  const paperSize = localStorage.getItem('printSettings_paperSizeReceipt') || 'A4';
  const isThermal = paperSize === '80mm' || paperSize === '58mm';
  const thermalWidth = paperSize === '80mm' ? '300px' : '220px';
  const activeStyles = isThermal ? THERMAL_STYLES(thermalWidth) : BASE_STYLES;

  const isPago = sale.status === 'Pago' || sale.status === 'Concluída' || sale.status === 'Recebido';

  const whatsappMsg = `*RECIBO ${docNum} - ${company.name}*\n\nCliente: ${clientName}\nData: ${date}\nTotal: ${total}\nForma de Pagamento: ${sale.paymentMethod}\nStatus: ${isPago ? 'PAGO' : 'PENDENTE'}\n\nDocumento sem valor fiscal.\nPara visualizar o comprovante detalhado em PDF, solicite o arquivo.`;

  const servicosRows = servicos.map(i => `
    <tr>
      <td>${i.name || 'Serviço'}</td>
      <td class="right">${i.qty || 1}</td>
      <td class="right">${formatCurrency(i.price || 0)}</td>
      <td class="right">${formatCurrency((i.qty || 1) * (i.price || 0))}</td>
    </tr>
  `).join('');

  const produtosRows = produtos.map(i => `
    <tr>
      <td>${i.name || 'Peça / Item'}</td>
      <td class="right">${i.qty || 1}</td>
      <td class="right">${formatCurrency(i.price || 0)}</td>
      <td class="right">${formatCurrency((i.qty || 1) * (i.price || 0))}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recibo ${docNum} - ${company.name}</title>
  <style>
    ${activeStyles}
    .fiscal-notice {
      background: #fdf6b2;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-top: 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #475569;
      padding: 4px 0;
    }
    .summary-row.total {
      border-top: 2px solid #0F2A5A;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 16px;
      font-weight: 900;
      color: #0F2A5A;
    }
    .payment-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
    }
    .payment-badge.pago {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .payment-badge.pendente {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${LOGO_HTML}
        <div>
          <div class="company-name">${company.tradeName || 'Control'}<span>Tec</span></div>
          <div class="company-info">
            ${company.name}<br/>
            ${company.cnpj ? `CNPJ: ${company.cnpj}` : ''}<br/>
            ${company.phone || ''} ${company.email ? `| ${company.email}` : ''}<br/>
            ${company.address || ''}
          </div>
        </div>
      </div>
      <div class="doc-badge">
        <div class="doc-type">RECIBO DE VENDA</div>
        <div class="doc-number">${docNum}</div>
        <div class="doc-date">Emissão: ${date}</div>
        <div style="margin-top:8px;">
          <span class="payment-badge ${isPago ? 'pago' : 'pendente'}">
            ${isPago ? '✓ PAGO' : '⏳ PENDENTE / FIADO'}
          </span>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="fiscal-notice">
        ⚠ Documento sem valor fiscal — Comprovante de prestação de serviços / venda de peças
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Cliente</label>
            <p>${clientName}</p>
          </div>
          ${customer?.document ? `<div class="info-item"><label>CPF/CNPJ</label><p>${customer.document}</p></div>` : ''}
          ${customer?.phone ? `<div class="info-item"><label>Telefone</label><p>${customer.phone}</p></div>` : ''}
          ${customer?.email ? `<div class="info-item"><label>E-mail</label><p>${customer.email}</p></div>` : ''}
          ${customer?.address ? `<div class="info-item" style="grid-column: span 2;"><label>Endereço</label><p>${customer.address}</p></div>` : ''}
        </div>
      </div>

      ${servicos.length > 0 ? `
      <div class="section">
        <div class="section-title">Serviços Prestados</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição do Serviço</th>
              <th class="right">Qtd</th>
              <th class="right">Valor Unit.</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${servicosRows}
            <tr class="subtotal-row">
              <td colspan="3" class="right">Subtotal Serviços:</td>
              <td class="right">${formatCurrency(subtotalServicos)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      ${produtos.length > 0 ? `
      <div class="section">
        <div class="section-title">Peças / Produtos</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição do Item</th>
              <th class="right">Qtd</th>
              <th class="right">Valor Unit.</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${produtosRows}
            <tr class="subtotal-row">
              <td colspan="3" class="right">Subtotal Peças/Produtos:</td>
              <td class="right">${formatCurrency(subtotalProdutos)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="summary-box">
        ${servicos.length > 0 && produtos.length > 0 ? `
        <div class="summary-row">
          <span>Subtotal de Serviços:</span>
          <strong>${formatCurrency(subtotalServicos)}</strong>
        </div>
        <div class="summary-row">
          <span>Subtotal de Peças e Produtos:</span>
          <strong>${formatCurrency(subtotalProdutos)}</strong>
        </div>
        ` : ''}
        ${desconto > 0 ? `
        <div class="summary-row" style="color:#dc2626;">
          <span>Desconto Concedido:</span>
          <strong>- ${formatCurrency(desconto)}</strong>
        </div>
        ` : ''}
        <div class="summary-row">
          <span>Forma de Pagamento:</span>
          <strong>${sale.paymentMethod}</strong>
        </div>
        <div class="summary-row total">
          <span>TOTAL GERAL:</span>
          <span style="font-size:22px;color:#0F2A5A;">${total}</span>
        </div>
      </div>

      ${sale.warranty ? `
      <div class="section" style="margin-top:16px;">
        <div class="section-title">Garantia</div>
        <div class="description-box">🛡️ ${sale.warranty}</div>
      </div>` : ''}

      ${sale.notes ? `
      <div class="section" style="margin-top:16px;">
        <div class="section-title">Observações</div>
        <div class="description-box">${sale.notes}</div>
      </div>` : ''}

      <div class="signature-section">
        <div class="signature-box">
          <div style="height:45px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura da Empresa</div>
          <div class="signature-name">${company.name}</div>
        </div>
        <div class="signature-box">
          <div style="height:45px;"></div>
          <div class="signature-line"></div>
          <div class="signature-label">Assinatura do Cliente</div>
          <div class="signature-name">${clientName}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        <strong>${company.name}</strong> — Sistema ControlTec<br/>
        Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.<br/>
        <em>Documento sem valor fiscal</em>
      </p>
    </div>
  </div>

  ${ACTION_BAR(`Recibo_${docNum}`, whatsappMsg)}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

