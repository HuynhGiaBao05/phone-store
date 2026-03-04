import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./ProductDetail.css";
import { useNavigate } from "react-router-dom";
// ❌ XÓA LoginRequiredModal

function ProductDetail() {

  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const navigate = useNavigate();

  // ✅ THÊM state thông báo login
  const [loginMessage, setLoginMessage] = useState("");

  // =====================================================
  // LOAD PRODUCT
  // =====================================================
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  // =====================================================
  // 🔥 TỰ ẨN THÔNG BÁO SAU 3 GIÂY
  // =====================================================
  useEffect(() => {
    if (loginMessage) {
      const timer = setTimeout(() => {
        setLoginMessage("");
      }, 3000);

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

  if (!product) return <div className="loading">Đang tải...</div>;

  const formattedEndDate = product.promoEndDate
    ? new Date(product.promoEndDate).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // =====================================================
  // 🛒 THÊM VÀO GIỎ HÀNG
  // =====================================================
  const handleAddToCart = async () => {

    const token = localStorage.getItem("token");

    // ❌ CHƯA LOGIN → HIỆN THÔNG BÁO NGAY TẠI TRANG
    if (!token) {
      setLoginMessage("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    try {

      await axios.post(
        "http://localhost:5000/api/cart/add",
        {
          productId: product._id,
          quantity: 1
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Đã thêm vào giỏ hàng 🛒");

    } catch (err) {
      console.log(err);
    }
  };

  // =====================================================
  // 🔥 MUA NGAY
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

        {/* ================= LEFT: IMAGE ================= */}
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

        {/* ================= RIGHT: INFO ================= */}
        <div className="detail-right">

          <h1 className="product-title">{product.name}</h1>

          {/* ================= LOGIN MODAL ================= */}
{loginMessage && (
  <div className="login-modal-overlay">

    <div className="login-modal">

      <h3>🔒 Yêu cầu đăng nhập</h3>

      <p>{loginMessage}</p>

      <div className="login-modal-buttons">

        {/* Nút đóng */}
        <button
          className="btn-cancel"
          onClick={() => setLoginMessage("")}
        >
          Đóng
        </button>

        {/* Nút đăng nhập */}
        <button
          className="btn-login"
          onClick={() => navigate("/login")}
        >
          Đăng nhập ngay
        </button>

      </div>

    </div>
  </div>
)}

          {product.isExpiringSoon && (
            <div className="expiring-badge">
              🔥 Sắp hết giờ
            </div>
          )}

          {/* ===== BOX GIÁ ===== */}
          {product.discount > 0 ? (
            <div className="promo-highlight-box">
              <div className="promo-left">
                <div className="promo-label">
                  Online Giá Rẻ Quá
                </div>
                <div className="promo-price">
                  {product.price?.toLocaleString()}đ
                </div>
                <div className="promo-original">
                  {product.originalPrice?.toLocaleString()}đ
                </div>
                <div className="vat-note">
                  Giá đã bao gồm VAT
                </div>
              </div>

              <div className="promo-right">
                <div className="countdown-label">
                  Kết thúc sau
                </div>
                <div className="countdown-time">
                  {timeLeft}
                </div>

                {formattedEndDate && (
                  <div className="countdown-meta">
                    {formattedEndDate} • TP.HCM
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="price-highlight-box">
              <span className="new-price">
                {product.price?.toLocaleString()}đ
              </span>
              <div className="vat-note">
                Giá đã bao gồm VAT
              </div>
            </div>
          )}

          {/* ===== KHUYẾN MÃI ===== */}
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

          {/* ===== BUTTONS ===== */}
          <div className="button-group">

            <button
              className="installment"
              onClick={handleAddToCart}
            >
              🛒 Thêm vào giỏ
            </button>

            <button
              className="buy-now"
              onClick={handleBuyNow}
            >
              MUA NGAY {product.price?.toLocaleString()}đ
            </button>

          </div>

          {/* ===== MÔ TẢ ===== */}
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