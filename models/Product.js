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
      required: true
    },

    subCategory: {
      type: String,
      required: true
    },

    subSubCategory: {
      type: String,
    },

    sizes: {
      type: [String],
      default: []
    },

    colors: {
      type: [String],
      default: []
    },

    stock: {
      type: Number,
      default: 0
    },

    description: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
