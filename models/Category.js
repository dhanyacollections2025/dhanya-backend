const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      required: true,
      default: 1, // 1: Main Category, 2: Subcategory, 3: Item Type
    },
    image: { type: String }, // Optional image for category
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
