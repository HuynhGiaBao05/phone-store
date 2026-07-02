import axios from "axios";

// đảm bảo mọi token lưu ở các key khác nhau đều được dùng cho Authorization header
const token =
  localStorage.getItem("token") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("admin_token");

if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}