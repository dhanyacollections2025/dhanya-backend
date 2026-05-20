const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");

module.exports = async function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    // Try to verify as Firebase token first if admin is initialized
    if (process.env.FIREBASE_PROJECT_ID) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Map firebase token to req.user structure
        req.user = {
          id: decodedToken.uid, // User UID from Firebase
          isAdmin: decodedToken.admin || false, // Assuming custom claims for admin
          email: decodedToken.email
        };
        // Lookup our internal DB user
        const User = require("../models/User");
        const dbUser = await User.findOne({ email: decodedToken.email });
        if (dbUser) {
          req.user.id = dbUser._id.toString();
          req.user.isAdmin = dbUser.isAdmin;
        }
        return next();
      } catch (fbErr) {
        // Fallback to local JWT if it's not a valid Firebase token
        console.log("Firebase token verification failed, trying JWT:", fbErr.message);
      }
    }

    // Fallback: Verify as local JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, isAdmin }
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
