const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const auth = require("../middleware/authMiddleware");

// Get all categories (nested structure)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().populate("parentCategory");
    res.json(categories);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// Admin: Add Category
router.post("/", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Admin only");
  try {
    const { name, parentCategory, level, image } = req.body;
    const category = new Category({ name, parentCategory: parentCategory || null, level, image });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// Admin: Update Category
router.put("/:id", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Admin only");
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// Admin: Delete Category
router.delete("/:id", auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json("Admin only");
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json("Category deleted");
  } catch (err) {
    res.status(500).json("Server error");
  }
});

module.exports = router;
