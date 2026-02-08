const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Dhanya Collections" <${process.env.ADMIN_EMAIL}>`,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      </div>
    `
  });
};

module.exports = { sendOTPEmail };
