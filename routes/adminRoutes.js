const router = require("express").Router();
const Product = require("../models/Product");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");

router.get("/orders", auth, admin, async (req, res) => {
  const orders = await Order.find()
    .populate("products.productId")
    .sort({ createdAt: -1 });

  res.json(orders);
});

router.post("/add-product", auth, admin, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

router.delete("/delete-product/:id", auth, admin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json("Product deleted");
});

router.get("/wishlist-stats", auth, admin, async (req, res) => {
  const wishlists = await Wishlist.find();

  const stats = {};
  wishlists.forEach(w => {
    w.products.forEach(pid => {
      stats[pid] = (stats[pid] || 0) + 1;
    });
  });

  res.json(stats);
});


router.get("/analytics", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Admin only");

  const totalOrders = await Order.countDocuments();
  const delivered = await Order.countDocuments({ status: "Delivered" });
  const cancelled = await Order.countDocuments({ status: "Cancelled" });

  const revenue = await Order.aggregate([
    { $match: { status: "Delivered" } },
    { $group: { _id: null, total: { $sum: "$total" } } }
  ]);

  res.json({
    totalOrders,
    delivered,
    cancelled,
    revenue: revenue[0]?.total || 0
  });
});

router.get("/orders/count", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Forbidden");

  const count = await Order.countDocuments({ status: "Placed" });
  res.json({ count });
});

router.put("/:id/cancel/admin", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Forbidden");

  const { reason } = req.body;

  const order = await Order.findById(req.params.id).populate("userId", "email name");
  if (!order) return res.status(404).json("Order not found");

  order.status = "Cancelled";
  order.cancellationDetails = {
    reason: reason || "Cancelled by admin",
    cancelledBy: "Admin",
    cancelledAt: new Date()
  };

  order.statusHistory.push({
    status: "Cancelled",
    message: reason || "Order cancelled by admin",
    updatedBy: req.user.name || "Admin"
  });

  await order.save();

  res.json({ message: "Order cancelled", order });
});


module.exports = router;
