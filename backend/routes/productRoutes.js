const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order"); // ✅ THÊM

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
// ⭐ TOP PRODUCTS HOME (FIX 100% - LUÔN CÓ DATA)
// =====================================================
router.get("/top-products-home", async (req, res) => {
    try {

        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: "CANCELLED" } } }, // ✅ an toàn
            { $unwind: "$items" },

            {
                $group: {
                    _id: "$items.product",
                    totalSold: { $sum: "$items.quantity" }
                }
            },

            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // =====================================================
        // 🔥 FALLBACK: nếu chưa có đơn hàng
        // =====================================================
        if (!topProducts || topProducts.length === 0) {
            const fallbackProducts = await Product.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("category")
                .populate("brand");

            const resultFallback = await Promise.all(
                fallbackProducts.map(p => calculateProductPrice(p))
            );

            return res.json(resultFallback);
        }

        const products = await Product.find({
            _id: { $in: topProducts.map(p => p._id) }
        })
            .populate("category")
            .populate("brand");

        const result = await Promise.all(
            products.map(async (p) => {

                const found = topProducts.find(t =>
                    t._id.toString() === p._id.toString()
                );

                const data = await calculateProductPrice(p);

                return {
                    ...data,
                    sold: found ? found.totalSold : 0
                };
            })
        );

        res.json(result);

    } catch (error) {
        res.status(500).json({
            message: "Lỗi top products",
            error: error.message
        });
    }
});


// =====================================================
// SEARCH PRODUCTS
// =====================================================
router.get("/search", async (req, res) => {
    try {

        const keyword = req.query.q?.trim();

        if (!keyword) return res.json([]);

        let categoryMatch = await Category.findOne({
            name: { $regex: keyword, $options: "i" }
        });

        const filter = {
            $or: [
                { name: { $regex: keyword, $options: "i" } },

                ...(categoryMatch
                    ? [{ category: categoryMatch._id }]
                    : []),

                { promotion: { $regex: keyword, $options: "i" } },

                ...(isNaN(keyword)
                    ? []
                    : [{ originalPrice: Number(keyword) }])
            ]
        };

        const products = await Product.find(filter)
            .populate("category")
            .populate("brand")
            .sort({ createdAt: -1 });

        const result = await Promise.all(
            products.map((p) => calculateProductPrice(p))
        );

        res.json(result);

    } catch (error) {
        res.status(500).json({
            message: "Search error",
            error: error.message
        });
    }
});


// =====================================================
// CREATE PRODUCT
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
                    message: "Thiếu thông tin bắt buộc"
                });
            }

            const product = new Product({
                name: req.body.name.trim(),
                category: req.body.category,
                brand: req.body.brand,
                originalPrice: Number(req.body.originalPrice),
                discount: Number(req.body.discount) || 0,
                stock: Number(req.body.stock) || 0,
                description: req.body.description || "",
                promotion: req.body.promotion || "",
                promoEndDate: req.body.promoEndDate
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
            res.status(500).json({
                message: "Lỗi server",
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
// GET PRODUCT BY ID
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
// GET BY CATEGORY SLUG
// =====================================================
router.get("/category/:slug", async (req, res) => {
    try {

        const category = await Category.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).json({ message: "Category không tồn tại" });
        }

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

            // =========================
            // UPDATE FIELDS (FIX HERE)
            // =========================
            if (req.body.name !== undefined) {
                product.name = req.body.name;
            }

            if (req.body.category !== undefined) {
                product.category = req.body.category;
            }

            if (req.body.brand !== undefined) {
                product.brand = req.body.brand;
            }

            if (req.body.originalPrice !== undefined) {
                product.originalPrice = Number(req.body.originalPrice);
            }

            if (req.body.discount !== undefined) {
                product.discount = Number(req.body.discount);
            }

            // 🔥 FIX QUAN TRỌNG: STOCK
            if (req.body.stock !== undefined) {
                product.stock = Number(req.body.stock);
            }

            if (req.body.description !== undefined) {
                product.description = req.body.description;
            }

            if (req.body.promotion !== undefined) {
                product.promotion = req.body.promotion;
            }

            if (req.body.promoEndDate !== undefined) {
                product.promoEndDate = req.body.promoEndDate
                    ? new Date(req.body.promoEndDate)
                    : null;
            }

            // =========================
            // IMAGE UPDATE
            // =========================
            if (req.file) {
                if (product.image) {
                    const oldPath = path.join(__dirname, "../uploads", product.image);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                product.image = req.file.filename;
            }

            await product.save();

            res.json({
                message: "Product updated",
                product // 🔥 trả về data mới
            });

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
            if (!product) return res.status(404).json({ message: "Product not found" });

            if (product.image) {
                const imgPath = path.join(__dirname, "../uploads", product.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }

            await Product.findByIdAndDelete(req.params.id);

            res.json({ message: "Product deleted successfully" });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router;