const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: "India" }
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },

  addresses: [AddressSchema],

  resetOTP: String,
  resetOTPExpiry: Date,
  resetAttempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("User", UserSchema);
