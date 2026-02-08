const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },

    images: {
      type: [String],
      required: true
    },

    category: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: true
    },

    subCategory: {
      type: String,
      required: true
    },

    sizes: {
      type: [String],
      default: []
    },

    colors: {
      type: [String],
      default: []
    },

    description: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
