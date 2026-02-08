const PDFDocument = require("pdfkit");

module.exports = function generateInvoice(order, res) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Order ID: ${order._id}`);
  doc.text(`Date: ${order.createdAt.toDateString()}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();

  doc.text("Delivery Address:");
  Object.values(order.deliveryAddress).forEach(v => {
    if (v) doc.text(v);
  });
  doc.moveDown();

  doc.text("Products:");
  order.items.forEach(item => {
    doc.text(
      `${item.productId.name} × ${item.quantity} — ₹${item.productId.price}`
    );
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${order.total}`, { align: "right" });

  doc.end();
};
