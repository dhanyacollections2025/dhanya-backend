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
  firebaseUid: { type: String, unique: true, sparse: true },
  isAdmin: { type: Boolean, default: false },

  addresses: [AddressSchema]
});

module.exports = mongoose.model("User", UserSchema);
