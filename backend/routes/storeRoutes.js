const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");


// ==========================================
// 🔥 ADMIN - TẠO CHI NHÁNH
// ==========================================
router.post(
  "/",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const store = await Store.create(req.body);
      res.json(store);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ==========================================
// 🔥 ADMIN - LẤY TẤT CẢ
// ==========================================
router.get(
  "/admin",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json(stores);
  }
);


// ==========================================
// 🔥 PUBLIC - LẤY STORE ACTIVE
// ==========================================
router.get("/", async (req, res) => {
  const stores = await Store.find({ isActive: true });
  res.json(stores);
});


// ==========================================
// 🔥 ADMIN - UPDATE
// ==========================================
router.put(
  "/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    const store = await Store.findById(req.params.id);

    if (!store)
      return res.status(404).json({ message: "Store not found" });

    Object.assign(store, req.body);

    await store.save();

    res.json(store);
  }
);


// ==========================================
// 🔥 ADMIN - SOFT DELETE
// ==========================================
router.delete(
  "/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {

    const store = await Store.findById(req.params.id);

    if (!store)
      return res.status(404).json({ message: "Store not found" });

    store.isActive = false; // không xoá cứng
    await store.save();

    res.json({ message: "Store disabled" });
  }
);

module.exports = router;