import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRef } from "react";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const lockIntervalRef = useRef(null);

  const [lockTime, setLockTime] = useState(0);
useEffect(() => {
  return () => {
    if (lockIntervalRef.current) {
      clearInterval(lockIntervalRef.current);
    }
  };
}, []);
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  if (status === "denied") {
    toast.error("Bạn đã từ chối đăng nhập");
    window.history.replaceState({}, document.title, "/admin-login");
  }
}, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || isLocked) return;
    setLoading(true);
// ✅ CHECK EMAIL
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  toast.error("Email không hợp lệ");
  setLoading(false);
  return;
}
if (!password) {
  toast.error("Vui lòng nhập mật khẩu");
  setLoading(false);
  return;
}

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        { email, password }
      );

      // 🔥 MFA: nếu cần xác nhận email
if (res.data.requireApproval) {
  toast.info("Vui lòng xác nhận đăng nhập qua email");
  navigate(`/mfa-wait?token=${res.data.loginToken}`);
  return;
}

// ✅ CHỈ LƯU TOKEN KHI CÓ TOKEN
if (res.data.data?.token) {
const role = res.data.data?.user?.role?.toUpperCase();

if (role === "ADMIN") {
  localStorage.setItem("adminToken", res.data.data.token);
}

if (role === "STAFF") {
  localStorage.setItem("staffToken", res.data.data.token);
}
}

const role = res.data.data?.user?.role?.toUpperCase();
      // 🔀 Điều hướng theo role
      if (role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (role === "STAFF") {
        navigate("/staff-products");
      } else {
         toast.error("Tài khoản USER không được phép đăng nhập admin");
      }

  } catch (error) {
  console.log("ERROR:", error.response?.data);

  if (error.response?.status === 429) {
    toast.info("Vui lòng xác nhận đăng nhập qua email");  
    setLoading(false);
    navigate(`/mfa-wait?token=${error.response?.data?.loginToken}`);
    return;
  }

  const type = error.response?.data?.type;
  const message = error.response?.data?.message;

  if (type === "LOGIN_FAIL") {
    toast.error("Sai email hoặc mật khẩu");
  } 
  else if (type === "ACCOUNT_LOCKED") {
    setIsLocked(true);

    let time = error.response?.data?.remainingTime || 60;
    setLockTime(time);

    const id = toast.error(
      `🔒 Tài khoản bị khóa (${time}s). Vui lòng thử lại sau`,
      { autoClose: false }
    );

    lockIntervalRef.current = setInterval(() => {
      setLockTime((prev) => {
        if (prev <= 1) {
          clearInterval(lockIntervalRef.current);
          lockIntervalRef.current = null;
          toast.dismiss();
          setIsLocked(false);
          setLockTime(0);
          return 0;
        }

        const newTime = prev - 1;

        toast.update(id, {
          render: `🔒 Tài khoản bị khóa (${newTime}s). Vui lòng thử lại sau`
        });

        return newTime;
      });
    }, 1000);
  } else {
    toast.error(message || "Đăng nhập thất bại");
  }

} finally {
  setLoading(false);
}
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer"
    }}
  >
    👁️
  </span>
</div>
<button type="submit" disabled={loading || isLocked}>
  {isLocked
    ? `Thử lại sau ${lockTime}s`
    : loading
    ? "Đang đăng nhập..."
    : "Đăng nhập"}
</button>

          <p style={{ marginTop: "15px" }}>
            <a href="/forgot-password">Quên mật khẩu?</a>
          </p>
        </form>
      </div>
      
    </div>
  );
}

export default AdminLogin;