import { useEffect, useState } from "react";
import api from "./api";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminCustomerDetail.css";


function AdminCustomerDetail() {
const [page, setPage] = useState(1);
const [staffs, setStaffs] = useState([]);
const pageSize = 10;
  const { id } = useParams();
  const [data, setData] = useState(null);
const [selectedOrder, setSelectedOrder] = useState(null);
useEffect(() => {
  if (selectedOrder) {
    console.log("ITEMS:", selectedOrder.items);
  }
}, [selectedOrder]);
useEffect(() => {
  const fetchStaffs = async () => {
    try {
const res = await api.get("/api/users/all");
      setStaffs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchStaffs();
}, []);
useEffect(() => {
  setSelectedOrder(null);
}, [page]);
  useEffect(() => {
  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/api/customers/${id}`);

      console.log("DETAIL:", res.data); // debug

      setData(res.data?.data || res.data || {});
    } catch (err) {
      console.error(err);
    }
  };

  fetchCustomer();
}, [id]);

  if (!data) return <p>Loading...</p>;

  const customer = data.customer || data;
const orders = data.orders || [];
console.log("ORDERS:", orders);
const totalSpent = orders.reduce(
  (sum, o) => sum + (o.totalAmount || 0),
  0
);

const avgSpent =
  orders.length > 0 ? totalSpent / orders.length : 0;
console.log("CUSTOMER DATA:", data);
const sortedOrders = [...orders].sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
);

const paginatedOrders = sortedOrders.slice(
  (page - 1) * pageSize,
  page * pageSize
);
  return (
    <div>
      <h2>Chi tiết khách hàng</h2>

      {/* 🧑 INFO */}
      <div>
        <h3>🧑 Thông tin</h3>
        <p>Tên: {customer?.fullName}</p>
        <p>Email: {customer?.email}</p>
        <p>Trạng thái: {customer?.status}</p>
        <p>
  Staff: {customer?.assignedTo?.fullName || "Chưa có"}
</p>
      </div>

      {/* 💰 STATS */}
      <div>
        <p>Tổng chi tiêu: {(totalSpent || 0).toLocaleString()} ₫</p>
<p>Tổng đơn: {orders.length}</p>
<p>Trung bình: {(avgSpent || 0).toLocaleString()} ₫</p>

      </div>

      {/* 📦 ORDERS */}
      <div className="order-history">
  <div>
  <h3>📦 Lịch sử đơn</h3>

{orders.length === 0 ? (
  <p>Chưa có đơn hàng</p>
) : (
  <>
<table className="order-table">
      <thead>
        <tr>
          <th>Mã</th>
          <th>Sản phẩm</th>
          <th>SL</th>
          <th>Ngày mua</th>
          <th>Ngày nhận</th>
          <th>Thanh toán</th>
          <th>SĐT</th>
          <th>Địa chỉ</th>
        </tr>
      </thead>

      <tbody>
        {paginatedOrders.map(o => (
          <tr
            key={o._id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(
                selectedOrder?._id === o._id ? null : o
              );
            }}
          >
            <td>{o._id.slice(-6)}</td>

            <td>
             {o.items?.map(i => i.product?.name || i.productName).join(", ")}
            </td>

            <td>
              {o.items?.reduce((sum, i) => sum + i.quantity, 0)}
            </td>

            <td>{new Date(o.createdAt).toLocaleDateString()}</td>

            <td>
              {o.deliveredAt
                ? new Date(o.deliveredAt).toLocaleDateString()
                : "-"}
            </td>

            <td>{o.paymentMethod}</td>
            <td>{o.shippingInfo?.phone}</td>
            <td>{o.shippingInfo?.address}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* 👇 phần này PHẢI nằm trong fragment */}
    {selectedOrder && (
      <p>
        Tổng đơn: {selectedOrder.totalAmount?.toLocaleString()} ₫
      </p>
    )}

    <div className="pagination">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Prev
      </button>

      <span>Trang {page}</span>

      <button
        disabled={page * pageSize >= sortedOrders.length}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>

    {selectedOrder && (
      <div className="order-detail">
        <h3>Chi tiết đơn #{selectedOrder._id.slice(-6)}</h3>

        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>

        
<tbody>
  {selectedOrder.items?.map(i => (
    <tr key={i._id}>
      <td>{i.productName || i.product?.name}</td>
      <td>{i.quantity}</td>
      <td>{(i.price || 0).toLocaleString()} đ</td>
      <td>{((i.price || 0) * (i.quantity || 0)).toLocaleString()} đ</td>
      
    </tr>
  ))}
</tbody>
        </table>
        <p className="order-total">
  Tổng hóa đơn: <span>{selectedOrder.totalAmount?.toLocaleString()} đ</span>
</p>
      </div>
    )}
  </>
)}
</div>
</div>

    </div>
  );
}

export default AdminCustomerDetail;