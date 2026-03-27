const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

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

        // ✅ FIX Ở ĐÂY
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

        description: {
            type: String,
            default: ""
        },

        promotion: {
            type: String,
            default: ""
        },

        promoEndDate: {
            type: Date,
            default: null
        },

        image: {
            type: String,
            default: null
        },
    },
    { timestamps: true }
);

// AUTO CLEAR promoEndDate
productSchema.pre("save", function (next) {
    if (this.discount === 0) {
        this.promoEndDate = null;
    }
    next();
});

module.exports = mongoose.model("Product", productSchema);