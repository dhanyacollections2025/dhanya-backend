const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Product = require("./models/Product");
const Category = require("./models/Category");

// Images to copy
const images = [
  { src: 'C:/Users/other/.gemini/antigravity/brain/78a7f1de-1ee7-4fe6-aeb6-6ff1944c7d85/mens_tshirt_1779187254551.png', dest: 'mens_tshirt.png' },
  { src: 'C:/Users/other/.gemini/antigravity/brain/78a7f1de-1ee7-4fe6-aeb6-6ff1944c7d85/womens_kurti_1779187268590.png', dest: 'womens_kurti.png' },
  { src: 'C:/Users/other/.gemini/antigravity/brain/78a7f1de-1ee7-4fe6-aeb6-6ff1944c7d85/unisex_hoodie_1779187284844.png', dest: 'unisex_hoodie.png' },
  { src: 'C:/Users/other/.gemini/antigravity/brain/78a7f1de-1ee7-4fe6-aeb6-6ff1944c7d85/mens_jeans_1779187304123.png', dest: 'mens_jeans.png' }
];

const destDir = path.join(__dirname, "../dhanya-frontend/public/assets");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

images.forEach(img => {
  if (fs.existsSync(img.src)) {
    fs.copyFileSync(img.src, path.join(destDir, img.dest));
    console.log(`Copied ${img.dest}`);
  }
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  // Clear existing
  await Category.deleteMany({});
  await Product.deleteMany({});

  console.log("Cleared existing data");

  // Create Categories
  const men = new Category({ name: "Men", level: 1 });
  const women = new Category({ name: "Women", level: 1 });
  const unisex = new Category({ name: "Unisex", level: 1 });

  await men.save();
  await women.save();
  await unisex.save();

  const menShirts = new Category({ name: "Shirts & T-Shirts", level: 2, parentCategory: men._id });
  const menJeans = new Category({ name: "Jeans", level: 2, parentCategory: men._id });
  const womenKurtis = new Category({ name: "Kurtis", level: 2, parentCategory: women._id });
  const unisexHoodies = new Category({ name: "Hoodies", level: 2, parentCategory: unisex._id });

  await menShirts.save();
  await menJeans.save();
  await womenKurtis.save();
  await unisexHoodies.save();

  console.log("Created Categories");

  // Create Products
  const products = [
    {
      name: "Premium Navy Blue T-Shirt",
      description: "A high-quality, comfortable navy blue t-shirt for everyday wear.",
      price: 899,
      category: "Men",
      subCategory: "Shirts & T-Shirts",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Blue"],
      images: ["/assets/mens_tshirt.png"],
      stock: 50,
    },
    {
      name: "Elegant Red & Gold Kurti",
      description: "Beautifully embroidered kurti for festive occasions.",
      price: 1599,
      category: "Women",
      subCategory: "Kurtis",
      sizes: ["M", "L", "XL"],
      colors: ["Red", "Gold"],
      images: ["/assets/womens_kurti.png"],
      stock: 30,
    },
    {
      name: "Cozy Grey Pullover Hoodie",
      description: "Warm and stylish grey hoodie, perfect for chilly days.",
      price: 1299,
      category: "Unisex",
      subCategory: "Hoodies",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Grey"],
      images: ["/assets/unisex_hoodie.png"],
      stock: 100,
    },
    {
      name: "Classic Dark Denim Jeans",
      description: "Premium dark blue jeans with a comfortable fit.",
      price: 1999,
      category: "Men",
      subCategory: "Jeans",
      sizes: ["M", "L", "XL"],
      colors: ["Blue", "Dark Blue"],
      images: ["/assets/mens_jeans.png"],
      stock: 40,
    }
  ];

  await Product.insertMany(products);

  console.log("Created Products");

  mongoose.connection.close();
};

seedData();
