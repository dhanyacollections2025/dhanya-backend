const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      size: String,
      color: String,
      price: Number // Store price at order time
    }
  ],

  total: {
    type: Number,
    required: true
  },

  subtotal: Number,
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },

  deliveryAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    landmark: String
  },

  status: {
    type: String,
    enum: [
      "Placed",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded"
    ],
    default: "Placed"
  },

  statusHistory: [
    {
      status: String,
      date: { type: Date, default: Date.now },
      location: String,
      message: String,
      updatedBy: String // admin name or system
    }
  ],

  deliveryPartner: {
    name: String,
    trackingId: String,
    trackingUrl: String,
    contactNumber: String,
    estimatedDelivery: Date
  },

  // Detailed tracking timeline
  tracking: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      location: String,
      description: String,
      scanType: String // e.g., "Picked up", "In transit", "Out for delivery"
    }
  ],

  paymentDetails: {
    method: { type: String, default: "COD" }, // COD, UPI, Card, etc.
    status: { type: String, default: "Pending" },
    transactionId: String,
    paidAt: Date
  },

  refundStatus: {
    type: String,
    enum: ["Not Initiated", "Initiated", "Processing", "Completed"],
    default: "Not Initiated"
  },

  refundDetails: {
    amount: Number,
    method: String, // "Original Payment Method", "Bank Transfer"
    transactionId: String,
    processedAt: Date,
    estimatedDate: Date
  },

  returnRequest: {
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ["None", "Requested", "Approved", "Rejected", "Picked Up", "Completed"],
      default: "None"
    },
    requestedAt: Date,
    images: [String], // proof images
    pickupScheduled: Date
  },

  cancellationDetails: {
    reason: String,
    cancelledBy: { type: String, enum: ["User", "Admin", "System"] },
    cancelledAt: Date,
    refundInitiated: { type: Boolean, default: false }
  },

  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,

  invoiceNumber: String,
  invoiceUrl: String,

  notes: String, // Admin notes

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

OrderSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Order", OrderSchema);