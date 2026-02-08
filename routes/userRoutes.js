const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");

/* ========================= */
/* ADDRESS MANAGEMENT */
/* ========================= */

// Get all addresses
router.get("/me/addresses", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.addresses || []);
});

// Add new address
router.post("/me/addresses", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses || [];
  user.addresses.push(req.body);
  await user.save();

  res.json(user.addresses);
});

/* ========================= */
/* CANCEL ORDER */
/* ========================= */

router.post("/order/:id/cancel", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json("Order not found");
  }

  if (
    order.status === "Shipped" ||
    order.status === "Delivered"
  ) {
    return res.status(400).json("Cannot cancel after shipment");
  }

  order.status = "Cancelled";
  order.statusHistory.push({ status: "Cancelled" });

  await order.save();

  res.json(order);
});

/* ========================= */
/* INVOICE DOWNLOAD */
/* ========================= */

router.get("/invoice/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.productId");

  if (!order) {
    return res.status(404).json("Order not found");
  }

  // Assuming you have generateInvoice function
  generateInvoice(order, res);
});

module.exports = router;
