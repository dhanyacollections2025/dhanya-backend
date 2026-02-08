const router = require("express").Router();
const Cart = require("../models/Cart");
const auth = require("../middleware/authMiddleware");

router.post("/add", auth, async (req, res) => {
  const { productId } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    cart = new Cart({ userId: req.user.id, items: [{ productId, quantity: 1 }] });
  } else {
    const item = cart.items.find(i => i.productId == productId);
    item ? item.quantity++ : cart.items.push({ productId, quantity: 1 });
  }

  await cart.save();
  res.json(cart);
});

router.post("/remove", auth, async (req, res) => {
  const { productId } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json("Cart not found");

  cart.items = cart.items.filter(
    item => item.productId.toString() !== productId
  );

  await cart.save();
  res.json(cart);
});

router.post("/update", auth, async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json("Cart not found");

  const item = cart.items.find(
    i => i.productId.toString() === productId
  );

  if (item) item.quantity = quantity;

  await cart.save();
  res.json(cart);
});


router.get("/", auth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id })
    .populate("items.productId");

  if (!cart) {
    return res.json({ items: [] });
  }

  // 🔥 remove broken items (product deleted)
  cart.items = cart.items.filter(item => item.productId !== null);

  await cart.save();

  res.json(cart);
});



module.exports = router;
