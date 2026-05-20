const router = require("express").Router();
const Settings = require("../models/Settings");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Get a setting by key (public)
router.get("/:key", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      // Return defaults for known keys
      const defaults = {
        whatsapp_number: process.env.WHATSAPP_BUSINESS_NUMBER || "+919154717942"
      };
      return res.json({ key: req.params.key, value: defaults[req.params.key] || null });
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update a setting (admin only)
router.put("/:key", auth, admin, async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { key: req.params.key, value },
      { new: true, upsert: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all settings (admin only)
router.get("/", auth, admin, async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
