const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const { protect } = require("../middleware/authMiddleware");


// =====================================================
// 🔥 GET CART
// =====================================================
router.get("/", protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "name price image originalPrice discount stock"
      });

    // Nếu chưa có cart thì tạo mới
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// =====================================================
// 🔥 ADD TO CART
// =====================================================
router.post("/add", protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    // 🔥 Populate lại trước khi trả về
    const updatedCart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "name price image originalPrice discount stock"
      });

    res.json(updatedCart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// =====================================================
// 🔥 UPDATE QUANTITY
// =====================================================
router.put("/update", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "name price image originalPrice discount stock"
      });

    res.json(updatedCart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// =====================================================
// 🔥 REMOVE ITEM
// =====================================================
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "name price image originalPrice discount stock"
      });

    res.json(updatedCart);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;