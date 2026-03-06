// ===============================
// ADMIN DASHBOARD PAGE
// ===============================
import "./AdminDashboard.css";
import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {

  // ===== STATE LƯU THỐNG KÊ =====
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  // ===== LẤY TOKEN TỪ LOCAL STORAGE =====
  const token = localStorage.getItem("token");

  useEffect(() => {

    const fetchStats = async () => {

      try {

        // ⚠️ Nếu chưa login thì không gọi API
        if (!token) {
          console.log("No token found");
          return;
        }

        const res = await axios.get(
          "http://localhost:5000/api/orders/admin-stats",
          {
            headers: {
              Authorization: `Bearer ${token}` // ✅ gửi token cho backend
            }
          }
        );

        setStats(res.data);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }

    };

    fetchStats();

  }, [token]); // ⚠️ thêm token vào dependency

  return (
    <div className="dashboard-container">

      {/* ===== PAGE TITLE ===== */}
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* ===== STATISTIC CARDS ===== */}
      <div className="dashboard-cards">

        {/* USERS */}
        <div className="dashboard-card blue">
          <h3>Tổng Users</h3>
          <p className="card-number">
            {Number(stats.totalUsers || 0)}
          </p>
        </div>

        {/* ORDERS */}
        <div className="dashboard-card green">
          <h3>Tổng Đơn hàng</h3>
          <p className="card-number">
            {Number(stats.totalOrders || 0)}
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="dashboard-card orange">
          <h3>Tổng Sản phẩm</h3>
          <p className="card-number">
            {Number(stats.totalProducts || 0)}
          </p>
        </div>

        {/* REVENUE */}
        <div className="dashboard-card purple">
          <h3>Doanh thu</h3>
          <p className="card-number">
            {Number(stats.totalRevenue || 0)} đ
          </p>
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;