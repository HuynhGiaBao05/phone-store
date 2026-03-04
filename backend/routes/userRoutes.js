const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// CREATE USER
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/create",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || "USER",
      isVerified: true,
      isActive: true
    });

    await user.save();

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// LOGINB
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
 
    const user = await User.findOne({ email });

if (!user) {
  return res.status(400).json({ message: "Invalid email or password" });
}

if (!user.isActive) {
  return res.status(403).json({
    message: "Tài khoản đã bị khóa"
  });
}

    // Chỉ USER mới cần verify OTP
if (user.role === "USER" && !user.isVerified) {
  return res.status(403).json({
    message: "Please verify your account first"
  });
}
    // 🔒 CHECK IF ACCOUNT LOCKED
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account locked. Try again later."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // ❌ WRONG PASSWORD
    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 60 * 1000;
        user.loginAttempts = 0;
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // ✅ LOGIN SUCCESS
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// FORGOT PASSWORD
// ===============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// SEND RESET PASSWORD OTP
// ===============================
router.post("/send-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendEmail(
      email,
      "Reset Password OTP",
      `Your password reset OTP is: ${otp}`
    );

    res.json({ message: "Reset OTP sent to email" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// RESET PASSWORD WITH OTP
// ===============================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PROFILE
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

// ===============================
// REGISTER - GỬI OTP
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
      isVerified: false
    });

    await user.save();

    // ✅ BẬT LẠI GỬI EMAIL
    await sendEmail(
      email,
      "OTP Verification",
      `Your OTP code is: ${otp}`
    );

    res.json({
      message: "OTP sent to your email"
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// VERIFY OTP - KÍCH HOẠT TÀI KHOẢN
// ===============================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.json({ message: "Account verified successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// RESEND OTP
// ===============================
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Tạo OTP mới
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = newOtp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendEmail(
      email,
      "Resend OTP Verification",
      `Your new OTP code is: ${newOtp}`
    );

    res.json({ message: "New OTP sent to your email" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// ADMIN - LẤY DANH SÁCH USER
// ===============================
router.get(
  "/all",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - KHÓA / MỞ KHÓA USER
// ===============================
router.put(
  "/toggle-active/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({ message: "User status updated" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - CẬP NHẬT ROLE
// ===============================
router.put(
  "/update-role/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { role } = req.body;

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = role;
      await user.save();

      res.json({ message: "Role updated successfully" });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ===============================
// ADMIN - XÓA USER
// Chỉ ADMIN mới được xóa tài khoản
// ===============================
router.delete(
  "/delete/:id",
  protect,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      // Tìm user theo ID
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Thực hiện xóa
      await user.deleteOne();

      res.json({
        message: "User deleted successfully"
      });

    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

module.exports = router;