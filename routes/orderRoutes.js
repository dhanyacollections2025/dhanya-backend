const router = require("express").Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Settings = require("../models/Settings");
const auth = require("../middleware/authMiddleware");
const transporter = require("../config/mailer");
const generateInvoice = require("../utils/generateInvoice");
const buildEmailTemplate = require("../utils/emailTemplate");

// Helper to get WhatsApp number from DB or env
async function getWhatsAppNumber() {
  try {
    const setting = await Settings.findOne({ key: "whatsapp_number" });
    return setting?.value || process.env.WHATSAPP_BUSINESS_NUMBER || "+919154717942";
  } catch {
    return process.env.WHATSAPP_BUSINESS_NUMBER || "+919154717942";
  }
}

/* =====================================================
   PLACE ORDER
===================================================== */
router.post("/place", auth, async (req, res) => {
  try {
    const { address, paymentMethod = "COD" } = req.body;
    if (!address) return res.status(400).json("Delivery address is required");

    const cart = await Cart.findOne({ userId: req.user.id })
      .populate("items.productId");

    if (!cart || cart.items.length === 0)
      return res.status(400).json("Cart is empty");

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + deliveryFee + tax;

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 5);

    const invoiceNumber =
      `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = new Order({
      userId: req.user.id,
      items: cart.items.map(i => ({
        productId: i.productId._id,
        quantity: i.quantity,
        price: i.productId.price,
        size: i.size,
        color: i.color
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress: address,
      status: "Placed",
      statusHistory: [{
        status: "Placed",
        message: "Order successfully placed",
        updatedBy: "System"
      }],
      paymentDetails: {
        method: paymentMethod,
        status: paymentMethod === "COD" ? "Pending" : "Completed"
      },
      expectedDeliveryDate: expectedDelivery,
      invoiceNumber
    });

    await order.save();

    const user = await User.findById(req.user.id);
    const userName = user?.name || "Customer";
    const userEmail = user?.email;

    if (userEmail) {
      const emailHtml = buildEmailTemplate({
        title: "Order Confirmed 🎉",
        userName,
        content: `
          <p>Your order has been placed successfully.</p>
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Invoice:</strong> ${invoiceNumber}</p>
            <p><strong>Total:</strong> ₹${total}</p>
            <p><strong>Expected Delivery:</strong> ${expectedDelivery.toLocaleDateString("en-IN")}</p>
          </div>
        `,
        buttonText: "View Order",
        buttonLink: `${process.env.FRONTEND_URL}/orders/${order._id}`
      });

      await transporter.sendMail({
        to: userEmail,
        subject: `Order Confirmed - ${invoiceNumber}`,
        html: emailHtml
      });
    }

    // Generate WhatsApp Message
    let waMessage = `*New Order Placed!* 🛍️\n\n`;
    waMessage += `*Order ID:* ${order._id}\n`;
    waMessage += `*Invoice:* ${invoiceNumber}\n`;
    waMessage += `*Customer:* ${userName}\n`;
    if (userEmail) waMessage += `*Email:* ${userEmail}\n`;
    waMessage += `*Address:* ${address}\n\n`;

    waMessage += `*Items:*\n`;
    cart.items.forEach((item, index) => {
      const p = item.productId;
      waMessage += `${index + 1}. ${p.name || 'Product'} (x${item.quantity})\n`;
      if (item.size) waMessage += `   Size: ${item.size}\n`;
      if (item.color) waMessage += `   Color: ${item.color}\n`;
      waMessage += `   Price: ₹${p.price * item.quantity}\n`;
    });

    waMessage += `\n*Subtotal:* ₹${subtotal}\n`;
    waMessage += `*Delivery Fee:* ₹${deliveryFee}\n`;
    waMessage += `*Tax:* ₹${tax}\n`;
    waMessage += `*Total Amount:* ₹${total}\n\n`;
    waMessage += `*Payment Method:* ${paymentMethod}`;

    const whatsappNumber = await getWhatsAppNumber();
    const formattedWaNum = whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedWaNum}&text=${encodeURIComponent(waMessage)}`;

    cart.items = [];
    await cart.save();

    res.json({ message: "Order placed successfully", order, whatsappUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json("Order failed");
  }
});

/* =====================================================
   PLACE GUEST ORDER
===================================================== */
router.post("/place-guest", async (req, res) => {
  try {
    const { address, paymentMethod = "COD", items, guestEmail, guestName } = req.body;
    if (!address) return res.status(400).json("Delivery address is required");
    if (!items || items.length === 0) return res.status(400).json("Cart is empty");
    
    // items should be populated with product details from frontend or we should fetch price
    // Since frontend sends just productId and quantity (and size/color), we should fetch prices.
    const Product = require("../models/Product");
    
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const p = await Product.findById(item.productId);
      if (p) {
        subtotal += p.price * item.quantity;
        orderItems.push({
          productId: p._id,
          name: p.name, // Just for whatsapp building
          quantity: item.quantity,
          price: p.price,
          size: item.size,
          color: item.color
        });
      }
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + deliveryFee + tax;

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 5);

    const invoiceNumber =
      `INV-G-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = new Order({
      guestEmail,
      guestName: guestName || address.fullName,
      items: orderItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress: address,
      status: "Placed",
      statusHistory: [{
        status: "Placed",
        message: "Order successfully placed",
        updatedBy: "System"
      }],
      paymentDetails: {
        method: paymentMethod,
        status: paymentMethod === "COD" ? "Pending" : "Completed"
      },
      expectedDeliveryDate: expectedDelivery,
      invoiceNumber
    });

    await order.save();

    const userName = order.guestName;
    const userEmail = order.guestEmail;

    if (userEmail) {
      const emailHtml = buildEmailTemplate({
        title: "Order Confirmed 🎉",
        userName,
        content: `
          <p>Your guest order has been placed successfully.</p>
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Invoice:</strong> ${invoiceNumber}</p>
            <p><strong>Total:</strong> ₹${total}</p>
            <p><strong>Expected Delivery:</strong> ${expectedDelivery.toLocaleDateString("en-IN")}</p>
          </div>
        `,
        buttonText: "Shop More",
        buttonLink: `${process.env.FRONTEND_URL}`
      });

      await transporter.sendMail({
        to: userEmail,
        subject: `Order Confirmed - ${invoiceNumber}`,
        html: emailHtml
      }).catch(e => console.error("Email error", e));
    }

    // Generate WhatsApp Message
    let waMessage = `*New Guest Order Placed!* 🛍️\n\n`;
    waMessage += `*Order ID:* ${order._id}\n`;
    waMessage += `*Invoice:* ${invoiceNumber}\n`;
    waMessage += `*Customer:* ${userName} (Guest)\n`;
    if (userEmail) waMessage += `*Email:* ${userEmail}\n`;
    waMessage += `*Address:* ${address.line1}, ${address.city}\n\n`;

    waMessage += `*Items:*\n`;
    orderItems.forEach((item, index) => {
      waMessage += `${index + 1}. ${item.name || 'Product'} (x${item.quantity})\n`;
      if (item.size) waMessage += `   Size: ${item.size}\n`;
      if (item.color) waMessage += `   Color: ${item.color}\n`;
      waMessage += `   Price: ₹${item.price * item.quantity}\n`;
    });

    waMessage += `\n*Subtotal:* ₹${subtotal}\n`;
    waMessage += `*Delivery Fee:* ₹${deliveryFee}\n`;
    waMessage += `*Tax:* ₹${tax}\n`;
    waMessage += `*Total Amount:* ₹${total}\n\n`;
    waMessage += `*Payment Method:* ${paymentMethod}`;

    const whatsappNumber = await getWhatsAppNumber();
    const formattedWaNum = whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedWaNum}&text=${encodeURIComponent(waMessage)}`;

    res.json({ message: "Guest Order placed successfully", order, whatsappUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json("Order failed");
  }
});



/* =====================================================
   USER: MY ORDERS
===================================================== */
router.get("/my", auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id })
    .populate("items.productId")
    .sort({ createdAt: -1 });

  res.json(orders);
});


/* =====================================================
   GET SINGLE ORDER
===================================================== */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId")
      .populate("userId", "name email");

    if (!order) return res.status(404).json("Order not found");

    if (
      (!order.userId ||
        order.userId._id.toString() !== req.user.id) &&
      !req.user.isAdmin
    ) {
      return res.status(403).json("Unauthorized");
    }

    res.json(order);
  } catch {
    res.status(500).json("Server error");
  }
});


/* =====================================================
   DOWNLOAD INVOICE
===================================================== */
router.get("/invoice/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.productId");

  if (!order) return res.status(404).json("Order not found");

  if (
    order.userId.toString() !== req.user.id &&
    !req.user.isAdmin
  ) {
    return res.status(403).json("Unauthorized");
  }

  generateInvoice(order, res);
});


/* =====================================================
   USER: CANCEL ORDER
===================================================== */
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("userId", "name email");

    if (!order) return res.status(404).json("Order not found");

    if (!order.userId ||
        order.userId._id.toString() !== req.user.id)
      return res.status(403).json("Unauthorized");

    if (!["Placed","Confirmed","Packed"].includes(order.status))
      return res.status(400).json("Order cannot be cancelled");

    order.status = "Cancelled";

    await order.save();

    const userName = order.userId?.name || "Customer";
    const userEmail = order.userId?.email;

    if (userEmail) {
      const emailHtml = buildEmailTemplate({
        title: "Order Cancelled",
        userName,
        content: `
          <p>Your order has been cancelled.</p>
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
          </div>
        `
      });

      await transporter.sendMail({
        to: userEmail,
        subject: `Order Cancelled - ${order.invoiceNumber}`,
        html: emailHtml
      });
    }

    res.json({ message: "Order cancelled successfully", order });

  } catch (err) {
    console.error(err);
    res.status(500).json("Cancel failed");
  }
});


/* =====================================================
   ADMIN: ALL ORDERS
===================================================== */
router.get("/admin/all", auth, async (req, res) => {
  if (!req.user.isAdmin)
    return res.status(403).json("Admin only");

  const orders = await Order.find()
    .populate("items.productId userId")
    .sort({ createdAt: -1 });

  res.json({ orders });
});


router.put("/:id/status", auth, async (req, res) => {
  if (!req.user.isAdmin)
    return res.status(403).json("Forbidden");

  try {
    const { status, deliveryPartner } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("userId", "name email");

    if (!order)
      return res.status(404).json("Order not found");

    // SAFE USER HANDLING
    const userName = order.userId?.name || "Customer";
    const userEmail = order.userId?.email;

    order.status = status;

    if (deliveryPartner) {
      order.deliveryPartner = deliveryPartner;
    }

    await order.save();

    // SEND EMAIL ONLY IF USER EXISTS
    if (userEmail) {
      await transporter.sendMail({
        to: userEmail,
        subject: `Order ${status} - ${order.invoiceNumber}`,
        html: `
          <h2>Order ${status}</h2>
          <p>Hi ${userName},</p>
          <p>Your order status has been updated to <strong>${status}</strong>.</p>
          
          <div style="background:#f5f5f5;padding:15px;border-radius:6px;margin:15px 0;">
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${
              deliveryPartner?.trackingId
                ? `<p><strong>Tracking ID:</strong> ${deliveryPartner.trackingId}</p>`
                : ""
            }
          </div>

          <p>Thank you for shopping with us.</p>
        `
      });
    }

    res.json({ message: "Order updated successfully", order });

  } catch (err) {
    console.error("Admin status update error:", err);
    res.status(500).json("Failed to update order");
  }
});



module.exports = router;
