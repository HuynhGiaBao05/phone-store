import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
    console.log("ADMIN LOGIN PAGE");   // 👈 THÊM DÒNG NÀY


  if (loading) return;
  setLoading(true);

  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/login",
      { email, password }
    );

    const role = res.data.role?.toUpperCase();

    console.log("ROLE FROM SERVER:", role);

    if (role === "ADMIN") {

  localStorage.setItem("adminToken", res.data.token);
  localStorage.setItem("adminRole", res.data.role);

  navigate("/admin-dashboard");

}
else if (role === "STAFF") {

  localStorage.setItem("adminToken", res.data.token);
  localStorage.setItem("adminRole", res.data.role);

  navigate("/staff-products");

}
    else {

      alert("Tài khoản USER không được phép đăng nhập trang quản trị");

    }

  } catch (error) {

    if (error.response && error.response.data.message) {
      alert(error.response.data.message);
    } else {
      alert("Có lỗi xảy ra");
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          

          <button type="submit">Login</button>
          <p style={{ marginTop: "15px" }}>
  <a href="/forgot-password">Quên mật khẩu?</a>
</p>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;