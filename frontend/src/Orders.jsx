import { useEffect, useState } from "react";
import axios from "axios";
import "./Orders.css";

function Orders() {

    const [orders, setOrders] = useState([]);

    const fetchOrders = () => {
        const token = localStorage.getItem("token");

        axios.get(
            "http://localhost:5000/api/orders/my-orders",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
            .then(res => {
                console.log("ORDERS:", res.data);
                setOrders(res.data);
            })
            .catch(err => {
                console.error("Lỗi lấy đơn hàng:", err);
            });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const steps = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"];

    // 🔥 FIX IMAGE
    const getImageUrl = (image) => {
        if (!image) return "/no-image.png";
        if (image.startsWith("http")) return image;
        return `http://localhost:5000/uploads/${image}`;
    };

    // 🔥 HỦY ĐƠN
    const cancelOrder = async (orderId) => {
        const token = localStorage.getItem("token");

        if (!window.confirm("Bạn có chắc muốn hủy đơn này?")) return;

        try {
            await axios.put(
                `http://localhost:5000/api/orders/cancel/${orderId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Đã hủy đơn hàng");
            fetchOrders(); // reload lại

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Lỗi hủy đơn");
        }
    };

    return (

        <div className="orders-page">

            <h2 className="orders-title">Đơn hàng của tôi</h2>

            {orders.map(order => {

                const currentStep = steps.indexOf(order.status);

                return (

                    <div className="order-card" key={order._id}>

                        <div className="order-header">

                            <div>
                                <b>Mã đơn:</b> {order._id}
                            </div>

                            {/* 🔥 STATUS CLASS */}
                            <div className={`order-status ${order.status}`}>
                                {order.status}
                            </div>

                        </div>

                        {/* PRODUCTS */}
                        <div className="order-items">
                            {order.items.map(item => (
                                <div className="order-item" key={item._id}>

                                    <img
                                        src={getImageUrl(item.product?.image)}
                                        alt={item.product?.name || "product"}
                                        onError={(e) => {
                                            e.target.src = "/no-image.png";
                                        }}
                                    />

                                    <div className="order-info">

                                        <div className="product-name">
                                            {item.product?.name}
                                        </div>

                                        <div className="product-price">
                                            {item.quantity} x {item.price.toLocaleString()} đ
                                        </div>

                                    </div>

                                </div>
                            ))}
                        </div>

                        {/* TIMELINE */}
                        <div className="timeline">

                            {steps.map((step, index) => {

                                const active = index <= currentStep;

                                return (

                                    <div className="timeline-step" key={step}>

                                        <div className={`circle ${active ? "active" : ""}`}>
                                            {index + 1}
                                        </div>

                                        <div className={`label ${active ? "active" : ""}`}>
                                            {step}
                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                        {/* FOOTER */}
                        <div className="order-footer">
                            Tổng tiền:
                            <span>{order.totalAmount.toLocaleString()} đ</span>
                        </div>

                        {/* 🔥 NÚT HỦY */}
                        {order.status === "PENDING" && (
                            <button
                                className="cancel-btn"
                                onClick={() => cancelOrder(order._id)}
                            >
                                Hủy đơn
                            </button>
                        )}

                    </div>

                );

            })}

            {orders.length === 0 && (
                <div className="no-orders">
                    Bạn chưa có đơn hàng nào
                </div>
            )}

        </div>

    );

}

export default Orders;