const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

// ============================================================
//  CASHFREE PAYMENT GATEWAY — PLACEHOLDER
//  Replace with actual Cashfree SDK integration when keys are ready.
//  npm install cashfree-pg
//
//  Required env vars:
//    CASHFREE_APP_ID=your_app_id
//    CASHFREE_SECRET_KEY=your_secret_key
//    CASHFREE_ENV=TEST  (or PROD)
// ============================================================

// Create a payment order (placeholder)
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;

    // TODO: Replace with actual Cashfree API call
    // const { Cashfree } = require("cashfree-pg");
    // Cashfree.XClientId = process.env.CASHFREE_APP_ID;
    // Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
    // Cashfree.XEnvironment = process.env.CASHFREE_ENV === "PROD" 
    //   ? Cashfree.Environment.PRODUCTION 
    //   : Cashfree.Environment.SANDBOX;
    //
    // const request = {
    //   order_amount: amount,
    //   order_currency: "INR",
    //   order_id: orderId,
    //   customer_details: {
    //     customer_id: req.user.id,
    //     customer_name: customerName,
    //     customer_email: customerEmail,
    //     customer_phone: customerPhone,
    //   },
    // };
    //
    // const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    // return res.json(response.data);

    // Placeholder response
    res.json({
      message: "Cashfree integration pending — API keys not configured yet",
      order_id: orderId,
      amount,
      payment_session_id: null,
      status: "NOT_CONFIGURED"
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Payment creation failed" });
  }
});

// Verify payment (placeholder)
router.post("/verify", auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    // TODO: Replace with actual Cashfree verification
    // const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    // const payment = response.data?.[0];
    // if (payment?.payment_status === "SUCCESS") { ... }

    res.json({
      message: "Cashfree verification pending — API keys not configured yet",
      order_id: orderId,
      status: "NOT_CONFIGURED"
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;
