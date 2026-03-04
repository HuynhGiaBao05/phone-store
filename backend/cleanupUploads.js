const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Product = require("./models/Product");

// ===== KẾT NỐI DATABASE =====
mongoose.connect("mongodb://127.0.0.1:27017/phone_store")
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

async function cleanupUploads() {
  try {
    // Lấy tất cả image đang tồn tại trong DB
    const products = await Product.find({}, "image");

    const imagesInDB = products
      .map(p => p.image)
      .filter(img => img); // loại bỏ null

    console.log("Images in DB:", imagesInDB);

    // Đường dẫn thư mục uploads
    const uploadsPath = path.join(__dirname, "uploads");

    const files = fs.readdirSync(uploadsPath);

    for (const file of files) {
      if (!imagesInDB.includes(file)) {
        const filePath = path.join(uploadsPath, file);

        fs.unlinkSync(filePath);
        console.log("Deleted:", file);
      }
    }

    console.log("Cleanup completed!");
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
}

cleanupUploads();