import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminReport.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminReport() {

  // ===== STATE =====
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  // ===== LẤY DOANH THU THEO năm =====
  const fetchRevenueByMonth = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/orders/revenue-by-month?year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      revenue: 0
    }));

    res.data.forEach(item => {
      const monthIndex = Number(item._id) - 1;

      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex].revenue = item.totalRevenue;
      }
    });

    setMonthlyRevenue(months);
  };

  // ===== LẤY SỐ ĐƠN THEO năm =====
  const fetchOrdersByMonth = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/orders/orders-by-month?year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      orders: 0
    }));

    res.data.forEach(item => {
      const monthIndex = Number(item._id) - 1;

      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex].orders = item.totalOrders;
      }
    });

    setMonthlyOrders(months);
  };

  // ===== LẤY THỐNG KÊ TỔNG =====
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/orders/admin-stats",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setStats(res.data);
    } catch (err) {
      console.log("Lỗi lấy stats:", err);
    }
  };

  // ===== CALL API KHI LOAD =====
  useEffect(() => {
    fetchStats();
    fetchRevenueByMonth();
    fetchOrdersByMonth();
  }, [year]);

  return (
    <div className="admin-report">
      <h2 className="report-title">Báo cáo tổng quan</h2>

<div style={{ marginBottom: "20px" }}>
  <div className="year-filter">
  <label>📅 Năm:</label>
  <select
    value={year}
    onChange={(e) => setYear(e.target.value)}
    className="year-select"
  >
    <option value="2024">2024</option>
    <option value="2025">2025</option>
    <option value="2026">2026</option>
  </select>
</div>
</div>

      {/* ===== CARD ===== */}
      <div className="report-cards">
        <div className="report-card">
          <h4>Tổng doanh thu</h4>
          <p>{stats.totalRevenue.toLocaleString()} ₫</p>
        </div>

        <div className="report-card">
          <h4>Tổng đơn hàng</h4>
          <p>{stats.totalOrders}</p>
        </div>

        <div className="report-card">
          <h4>Tổng sản phẩm</h4>
          <p>{stats.totalProducts}</p>
        </div>

        <div className="report-card">
          <h4>Khách hàng</h4>
          <p>{stats.totalUsers}</p>
        </div>
      </div>

      {/* ===== CHART DOANH THU ===== */}
      <div className="chart-card">
        <h3>📊 Doanh thu theo tháng (VNĐ)</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyRevenue}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== CHART SỐ ĐƠN ===== */}
      <div className="chart-card">
        <h3>📦 Số lượng đơn hàng theo tháng</h3>


        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyOrders}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AdminReport;