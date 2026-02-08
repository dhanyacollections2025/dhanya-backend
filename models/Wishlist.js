const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  userId: String,
  products: [String]
});

module.exports = mongoose.model("Wishlist", WishlistSchema);
