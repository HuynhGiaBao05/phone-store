const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Category = require("../models/Category");

const upload = require("../middleware/uploadMiddleware");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const fs = require("fs");
const path = require("path");

// =====================================================
// FUNCTION TÍNH GIÁ (GIỮ NGUYÊN)
// =====================================================
async function calculateProductPrice(product) {

    let finalPrice = product.originalPrice;
    let activeDiscount = product.discount;
    let isExpiringSoon = false;

    if (product.discount > 0 && product.promoEndDate) {

        const now = new Date();
        const endDate = new Date(product.promoEndDate);
        const diff = endDate - now;

        if (diff <= 0) {
            product.discount = 0;
            product.promoEndDate = null;
            await product.save();

            activeDiscount = 0;
            finalPrice = product.originalPrice;
        } else {

            finalPrice =
                product.originalPrice -
                (product.originalPrice * product.discount) / 100;

            const hoursLeft = diff / (1000 * 60 * 60);

            if (hoursLeft <= 24) {
                isExpiringSoon = true;
            }
        }
    }

    return {
        ...product._doc,
        price: finalPrice,
        discount: activeDiscount,
        isExpiringSoon,
        image: product.image
            ? `http://localhost:5000/uploads/${product.image}`
            : null,
    };
}

// =====================================================
// ✅ CREATE PRODUCT
// =====================================================
router.post(
    "/create",
    protect,
    authorizeRoles("ADMIN", "STAFF"),
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.body.name || !req.body.category || !req.body.brand) {
                return res.status(400).json({
                    message: "Thiếu thông tin bắt buộc (name, category, brand)"
                });
            }

            const originalPrice = Number(req.body.originalPrice);
            const discount = Math.max(0, Math.min(100, Number(req.body.discount) || 0));
            const stock = Number(req.body.stock) || 0;

            if (!originalPrice || originalPrice <= 0) {
                return res.status(400).json({
                    message: "Giá gốc phải lớn hơn 0"
                });
            }

            const product = new Product({
                name: req.body.name.trim(),
                category: req.body.category,
                brand: req.body.brand,
                originalPrice,
                discount,
                stock,
                description: req.body.description || "",
                promotion: req.body.promotion || "",
                promoEndDate: discount > 0 && req.body.promoEndDate
                    ? new Date(req.body.promoEndDate)
                    : null,
                image: req.file ? req.file.filename : null,
            });

            await product.save();

            res.json({
                message: "Product created",
                product
            });

        } catch (error) {
            console.error("CREATE ERROR:", error);
            res.status(500).json({
                message: "Lỗi server khi tạo sản phẩm",
                error: error.message
            });
        }
    }
);

// =====================================================
// GET ALL PRODUCTS
// =====================================================
router.get("/", async (req, res) => {
    try {
        const category = req.query.category;
        let filter = {};

        if (category && category !== "all") {
            filter.category = category;
        }

        const products = await Product.find(filter)
            .populate("category")
            .populate("brand")
            .sort({ createdAt: -1 });

        const updatedProducts = await Promise.all(
            products.map((p) => calculateProductPrice(p))
        );

        res.json({
            products: updatedProducts,
            totalProducts: updatedProducts.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ✅ GET PRODUCT BY ID
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category")
            .populate("brand");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const productWithPrice = await calculateProductPrice(product);
        res.json(productWithPrice);

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// =====================================================
// GET PRODUCTS BY CATEGORY SLUG (MỚI THÊM)
// =====================================================
router.get("/category/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        const category = await Category.findOne({ slug });

        if (!category) return res.status(404).json({ message: "Category không tồn tại" });

        const products = await Product.find({ category: category._id })
            .populate("category")
            .populate("brand")
            .sort({ createdAt: -1 });

        const updatedProducts = await Promise.all(
            products.map((p) => calculateProductPrice(p))
        );

        res.json(updatedProducts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// =====================================================
// UPDATE PRODUCT
// =====================================================
router.put(
    "/:id",
    protect,
    authorizeRoles("ADMIN", "STAFF"),
    upload.single("image"),
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (req.body.originalPrice !== undefined) {
                const originalPrice = Number(req.body.originalPrice);
                const discount = Math.max(0, Math.min(100, Number(req.body.discount) || 0));

                if (!originalPrice || originalPrice <= 0) {
                    return res.status(400).json({ message: "Giá gốc phải lớn hơn 0" });
                }

                product.originalPrice = originalPrice;
                product.discount = discount;

                product.promoEndDate = discount > 0 && req.body.promoEndDate
                    ? new Date(req.body.promoEndDate)
                    : null;
            }

            if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
            if (req.body.name) product.name = req.body.name.trim();
            if (req.body.description !== undefined) product.description = req.body.description;
            if (req.body.promotion !== undefined) product.promotion = req.body.promotion;
            if (req.body.category) product.category = req.body.category;
            if (req.body.brand) product.brand = req.body.brand;

            if (req.file) {
                if (product.image) {
                    const oldImagePath = path.join(__dirname, "../uploads", product.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                product.image = req.file.filename;
            }

            await product.save();
            res.json({ message: "Product updated" });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// =====================================================
// DELETE PRODUCT
// =====================================================
router.delete(
    "/:id",
    protect,
    authorizeRoles("ADMIN", "STAFF"),
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (product.image) {
                const imagePath = path.join(__dirname, "../uploads", product.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: "Product deleted successfully" });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);


module.exports = router;