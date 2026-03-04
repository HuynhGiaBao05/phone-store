const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const category = new Category({ name, slug });
    await category.save();

    res.json({ message: "Category created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;