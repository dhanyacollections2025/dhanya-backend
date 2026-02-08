const router = require("express").Router();
const Wishlist = require("../models/Wishlist");
const auth = require("../middleware/authMiddleware");

router.post("/toggle", auth, async (req, res) => {
  const { productId } = req.body;

  let wishlist = await Wishlist.findOne({ userId: req.user.id });

  if (!wishlist) {
    wishlist = new Wishlist({ userId: req.user.id, products: [] });
  }

  wishlist.products = wishlist.products.includes(productId)
    ? wishlist.products.filter(id => id !== productId)
    : [...wishlist.products, productId];

  await wishlist.save();
  res.json(wishlist);
});

router.get("/", auth, async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user.id });
  res.json(wishlist || { products: [] });
});

module.exports = router;
