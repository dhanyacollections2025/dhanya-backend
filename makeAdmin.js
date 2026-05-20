require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
  console.log("Please provide an email. Usage: node makeAdmin.js <email>");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB...");
    const user = await User.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    );

    if (user) {
      console.log(`Success! User ${email} is now an ADMIN.`);
    } else {
      console.log(`User ${email} not found in the database. Did you register first?`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error connecting to database:", err);
    process.exit(1);
  });
