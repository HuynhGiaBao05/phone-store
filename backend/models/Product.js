const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            required: true,
        },

        originalPrice: {
            type: Number,
            required: true,
            min: 0
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },

        // 🔥 NEW: khóa sản phẩm (admin / system)
        isLocked: {
            type: Boolean,
            default: false
        },

        description: { type: String, default: "" },
        promotion: { type: String, default: "" },

        promoEndDate: {
            type: Date,
            default: null
        },

        image: { type: String, default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// 🔥 virtual: hết hàng
productSchema.virtual("isOutOfStock").get(function () {
    return this.stock <= 0;
});

// 🔥 virtual: còn hàng text
productSchema.virtual("stockText").get(function () {
    if (this.stock <= 0) return "Hết hàng";
    return `Còn ${this.stock} sản phẩm`;
});

// auto promo
productSchema.pre("save", function (next) {
    if (this.discount === 0) {
        this.promoEndDate = null;
    }
    next();
});

module.exports = mongoose.model("Product", productSchema);