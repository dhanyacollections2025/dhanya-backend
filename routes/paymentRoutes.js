const Razorpay = require("razorpay");
const router = require("express").Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

router.post("/create", async (req, res) => {
  const order = await razorpay.orders.create({
    amount: req.body.amount * 100,
    currency: "INR"
  });
  res.json(order);
});

module.exports = router;
