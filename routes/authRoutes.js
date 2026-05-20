const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sendOTPEmail } = require("../services/emailService");
const { generateOTP, hashOTP } = require("../utils/otpUtils");
const { forgotPasswordLimiter } = require("../middleware/rateLimiter");


const admin = require("../config/firebaseAdmin");

// ================= FIREBASE SYNC =================
router.post("/sync", async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token" });

    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // Check if user exists in DB
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name: name || email.split("@")[0],
        email,
        firebaseUid: uid,
        isAdmin: false
      });
      await user.save();
    } else if (!user.firebaseUid) {
      // Link existing user to Firebase
      user.firebaseUid = uid;
      await user.save();
    }

    // Generate JWT for the synced user
    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error("Sync error:", err);
    res.status(401).json({ msg: "Invalid token or sync failed" });
  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    isAdmin: false
  });

  await user.save();

  res.json({ msg: "User registered successfully" });
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }
  });
});


// ================= FORGOT PASSWORD =================
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: "If account exists, OTP sent" });
    }

    const otp = generateOTP();
    const hashed = hashOTP(otp);

    user.resetOTP = hashed;
    user.resetOTPExpiry = Date.now() + 5 * 60 * 1000;
    user.resetAttempts = 0;

    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ msg: "OTP sent to your email" });
  }
);


// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.resetOTPExpiry < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  if (user.resetAttempts >= 5) {
    return res.status(400).json({ msg: "Too many attempts. Try later." });
  }

  const hashed = hashOTP(otp);

  if (hashed !== user.resetOTP) {
    user.resetAttempts += 1;
    await user.save();
    return res.status(400).json({ msg: "Invalid OTP" });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  user.resetAttempts = 0;

  await user.save();

  res.json({ msg: "Password reset successful" });
});


module.exports = router;
