// ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetail.css";

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    // =====================================================
    // LOAD PRODUCT
    // =====================================================
    useEffect(() => {
        axios
            .get(`http://localhost:5000/api/products/${id}`)
            .then((res) => setProduct(res.data))
            .catch((err) => {
                console.log(err);
                if (err.response?.status === 404) {
                    setErrorMessage("Sản phẩm không tồn tại");
                } else {
                    setErrorMessage("Lỗi khi tải sản phẩm");
                }
            });
    }, [id]);

    // =====================================================
    // ẨN THÔNG BÁO LOGIN SAU 3 GIÂY
    // =====================================================
    useEffect(() => {
        if (loginMessage) {
            const timer = setTimeout(() => setLoginMessage(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [loginMessage]);

    // =====================================================
    // COUNTDOWN KHUYẾN MÃI
    // =====================================================
    useEffect(() => {
        if (!product?.promoEndDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(product.promoEndDate);
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("Đã kết thúc");
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, "0")}:` +
                `${minutes.toString().padStart(2, "0")}:` +
                `${seconds.toString().padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [product?.promoEndDate]);

    if (errorMessage) return <div className="loading">{errorMessage}</div>;
    if (!product) return <div className="loading">Đang tải...</div>;

    // =====================================================
    // THÊM VÀO GIỎ HÀNG
    // =====================================================
    const handleAddToCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoginMessage("Vui lòng đăng nhập để thêm vào giỏ hàng");
            return;
        }

        try {
            await axios.post(
                "http://localhost:5000/api/cart/add",
                { productId: product._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Đã thêm vào giỏ hàng 🛒");
        } catch (err) {
            console.log(err);
        }
    };

    // =====================================================
    // MUA NGAY
    // =====================================================
    const handleBuyNow = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoginMessage("Vui lòng đăng nhập để mua sản phẩm");
            return;
        }
        await handleAddToCart();
        navigate("/cart");
    };

    return (
        <div className="product-detail-page">
            <div className="detail-container">

                {/* LEFT: IMAGE */}
                <div className="detail-left">
                    <div className="main-image">
                        <img src={product.image} alt={product.name} />
                    </div>
                    <div className="thumbnail-row">
                        <img src={product.image} alt="" />
                        <img src={product.image} alt="" />
                        <img src={product.image} alt="" />
                    </div>
                </div>

                {/* RIGHT: INFO */}
                <div className="detail-right">

                    <h1 className="product-title">{product.name}</h1>

                    {/* LOGIN MODAL */}
                    {loginMessage && (
                        <div className="login-modal-overlay">
                            <div className="login-modal">
                                <h3>🔒 Yêu cầu đăng nhập</h3>
                                <p>{loginMessage}</p>
                                <div className="login-modal-buttons">
                                    <button className="btn-cancel" onClick={() => setLoginMessage("")}>
                                        Đóng
                                    </button>
                                    <button className="btn-login" onClick={() => navigate("/login")}>
                                        Đăng nhập ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {product.isExpiringSoon && <div className="expiring-badge">🔥 Sắp hết giờ</div>}

                    {/* ===== GIÁ + COUNTDOWN CÙNG 1 HÀNG ===== */}
                    <div className="price-highlight-box">
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span className="new-price" style={{ color: "#1e88e5" }}>
                                {product.discount > 0 ? product.price?.toLocaleString() : product.originalPrice?.toLocaleString()}đ
                            </span>
                            <span className="vat-note">Giá đã bao gồm VAT</span>
                        </div>

                        {product.discount > 0 && (
                            <span
                                className="countdown-time"
                                style={{
                                    fontSize: "20px",
                                    fontWeight: "bold",
                                    color: "#43a047",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {timeLeft}
                            </span>
                        )}
                    </div>

                    {/* KHUYẾN MÃI */}
                    {product.promotion && product.promotion.trim() !== "" && (
                        <div className="promotion-box">
                            <h3>Khuyến mãi</h3>
                            <ul>
                                {product.promotion.split("\n").map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* BUTTONS */}
                    <div className="button-group">
                        <button className="installment" onClick={handleAddToCart}>🛒 Thêm vào giỏ</button>
                        <button className="buy-now" onClick={handleBuyNow}>
                            MUA NGAY {product.discount > 0 ? product.price?.toLocaleString() : product.originalPrice?.toLocaleString()}đ
                        </button>
                    </div>

                    {/* MÔ TẢ */}
                    <div className="product-description">
                        <h3>Mô tả sản phẩm</h3>
                        <p>{product.description}</p>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default ProductDetail;