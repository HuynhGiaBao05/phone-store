// ===============================
// ADMIN DASHBOARD PAGE
// ===============================
import "./AdminDashboard.css";
import { useEffect, useState } from "react";
import axios from "axios";




function AdminDashboard() {

    const [stats, setStats] = useState({
  totalUsers: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalRevenue: 0
});
const token = localStorage.getItem("token");

useEffect(() => {
  const fetchStats = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/orders/admin-stats",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setStats(res.data);
  };

  fetchStats();
}, []);


  return (
    <div className="dashboard-container">

      {/* ===== PAGE TITLE ===== */}
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* ===== STATISTIC CARDS ===== */}
      <div className="dashboard-cards">

        <div className="dashboard-card blue">
          <h3>Tổng Users</h3>
<p className="card-number">
  {Number(stats.totalUsers || 0)}
</p>
        </div>

        <div className="dashboard-card green">
          <h3>Tổng Đơn hàng</h3>
<p className="card-number">
  {Number(stats.totalOrders || 0)}
</p>
        </div>

        <div className="dashboard-card orange">
          <h3>Tổng Sản phẩm</h3>
<p className="card-number">
  {Number(stats.totalProducts || 0)}
</p>
        </div>

        <div className="dashboard-card purple">
          <h3>Doanh thu</h3>
          <p className="card-number">{Number(stats.totalRevenue || 0)}đ</p>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;