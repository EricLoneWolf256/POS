import PDFDocument from 'pdfkit';

export function generateReceipt(sale, items, business) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A6', margin: 20 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(14).font('Helvetica-Bold').text(business.name || 'Venderra POS', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(business.address || '', { align: 'center' });
    doc.text(business.phone || '', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(8).text(`Receipt: ${sale.sale_number}`);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`);
    doc.text(`Cashier: ${sale.cashier_name || 'N/A'}`);
    if (sale.customer_name) doc.text(`Customer: ${sale.customer_name}`);
    doc.moveDown(0.5);

    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).stroke();
    doc.moveDown(0.3);

    items.forEach(item => {
      const line = `${item.product_name} x${item.quantity}`;
      const price = `UGX ${Number(item.total).toLocaleString()}`;
      doc.fontSize(8).text(line, 20, doc.y, { continued: true, width: doc.page.width - 40 });
      doc.text(price, { align: 'right', width: doc.page.width - 40 });
    });

    doc.moveDown(0.3);
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(8).text('Subtotal:', 20, doc.y, { continued: true });
    doc.text(`UGX ${Number(sale.subtotal).toLocaleString()}`, { align: 'right' });
    if (sale.tax_amount > 0) {
      doc.text('Tax:', 20, doc.y, { continued: true });
      doc.text(`UGX ${Number(sale.tax_amount).toLocaleString()}`, { align: 'right' });
    }
    if (sale.discount_amount > 0) {
      doc.text('Discount:', 20, doc.y, { continued: true });
      doc.text(`-UGX ${Number(sale.discount_amount).toLocaleString()}`, { align: 'right' });
    }
    doc.fontSize(10).font('Helvetica-Bold').text('Total:', 20, doc.y, { continued: true });
    doc.text(`UGX ${Number(sale.total_amount).toLocaleString()}`, { align: 'right' });
    doc.moveDown(0.2);
    doc.fontSize(8).font('Helvetica').text(`Paid: UGX ${Number(sale.amount_paid).toLocaleString()}`);
    if (sale.change_amount > 0) {
      doc.text(`Change: UGX ${Number(sale.change_amount).toLocaleString()}`);
    }

    doc.moveDown(1);
    doc.moveTo(20, doc.y).lineTo(doc.page.width - 20, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7).text('Thank you for shopping with us!', { align: 'center' });
    doc.text('Powered by Venderra POS', { align: 'center' });

    doc.end();
  });
}

export function generateInvoice(quotation, items, business, customer) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).font('Helvetica-Bold').fillColor('#0d9488').text(business.name || 'Venderra POS');
    doc.fontSize(9).fillColor('#64748b').text(business.address || '');
    doc.text(business.phone || '');
    doc.moveDown();

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text('INVOICE', { align: 'right' });
    doc.fontSize(9).fillColor('#64748b');
    doc.text(`Invoice #: ${quotation.quote_number}`, { align: 'right' });
    doc.text(`Date: ${new Date(quotation.created_at).toLocaleDateString()}`, { align: 'right' });
    if (quotation.valid_until) doc.text(`Due: ${new Date(quotation.valid_until).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    if (customer) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('Bill To:');
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      doc.text(customer.name);
      if (customer.email) doc.text(customer.email);
      if (customer.phone) doc.text(customer.phone);
      if (customer.address) doc.text(customer.address);
      doc.moveDown();
    }

    const tableTop = doc.y;
    const colWidths = [250, 60, 80, 100];
    const headers = ['Item', 'Qty', 'Unit Price', 'Total'];
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0d9488');
    headers.forEach((h, i) => {
      const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, tableTop, { width: colWidths[i], align: i > 0 ? 'right' : 'left' });
    });
    doc.moveTo(50, tableTop + 18).lineTo(550, tableTop + 18).stroke('#e2e8f0');

    doc.font('Helvetica').fillColor('#475569');
    let y = tableTop + 28;
    items.forEach(item => {
      doc.text(item.description || item.product_name || 'Item', 50, y, { width: colWidths[0] });
      doc.text(String(item.quantity), 300, y, { width: colWidths[1], align: 'right' });
      doc.text(`UGX ${Number(item.unit_price).toLocaleString()}`, 360, y, { width: colWidths[2], align: 'right' });
      doc.text(`UGX ${Number(item.total).toLocaleString()}`, 440, y, { width: colWidths[3], align: 'right' });
      y += 22;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke('#e2e8f0');
    y += 12;

    const summaryX = 350;
    doc.fontSize(9).text('Subtotal:', summaryX, y, { width: 80, align: 'left', continued: true });
    doc.text(`UGX ${Number(quotation.subtotal).toLocaleString()}`, { width: 120, align: 'right' });
    y += 18;
    if (quotation.tax_amount > 0) {
      doc.text('Tax:', summaryX, y, { width: 80, align: 'left', continued: true });
      doc.text(`UGX ${Number(quotation.tax_amount).toLocaleString()}`, { width: 120, align: 'right' });
      y += 18;
    }
    if (quotation.discount_amount > 0) {
      doc.text('Discount:', summaryX, y, { width: 80, align: 'left', continued: true });
      doc.text(`-UGX ${Number(quotation.discount_amount).toLocaleString()}`, { width: 120, align: 'right' });
      y += 18;
    }
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0d9488').text('Total:', summaryX, y, { width: 80, align: 'left', continued: true });
    doc.text(`UGX ${Number(quotation.total_amount).toLocaleString()}`, { width: 120, align: 'right' });

    doc.moveDown(3);
    doc.fontSize(8).fillColor('#94a3b8').text('Generated by Venderra POS — venderra.ug', 50, doc.y, { align: 'center' });

    doc.end();
  });
}
