import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartPage.css";

function CartPage() {

  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // ====================================================
  // 🔥 FETCH CART FROM BACKEND
  // ====================================================
  useEffect(() => {
    fetchCart();
  }, []);
/*check user login chưa khi vô giỏ*/
  useEffect(() => {

  const token = localStorage.getItem("token");

  // ❌ Chưa login → chuyển về login
  if (!token) {
    navigate("/login");
    return;
  }

  fetchCart();



}, []);

  const fetchCart = async () => {

  const token = localStorage.getItem("token");

  if (!token) return; // 🔥 không gọi API nếu chưa login

  try {

    const res = await axios.get(
      "http://localhost:5000/api/cart",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setCart(res.data.items);

  } catch (err) {
    console.log(err);
  }
};

  // ====================================================
  // 🔥 SELECT ITEM
  // ====================================================
  const toggleSelect = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      const allIds = cart.map(item => item.product?._id);
      setSelectedItems(allIds);
    }
  };

  // ====================================================
  // 🔥 UPDATE QUANTITY
  // ====================================================
  const updateQuantity = async (productId, quantity) => {
    try {
      await axios.put(
        "http://localhost:5000/api/cart/update",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchCart();
    } catch (err) {
      console.log("Update qty error:", err);
    }
  };

  const increaseQty = (item) => {
    updateQuantity(item.product._id, item.quantity + 1);
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.product._id, item.quantity - 1);
    }
  };

  // ====================================================
  // 🔥 REMOVE ITEM
  // ====================================================
  const removeItem = async (productId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/cart/remove/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedItems(prev =>
        prev.filter(id => id !== productId)
      );

      fetchCart();
    } catch (err) {
      console.log("Remove error:", err);
    }
  };

  // ====================================================
  // 🔥 CALCULATE TOTAL
  // ====================================================
  const selectedProducts = cart.filter(item =>
    selectedItems.includes(item.product?._id)
  );

  const total = selectedProducts.reduce(
    (sum, item) =>
      sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // ====================================================
  // 🔥 CHECKOUT
  // ====================================================
  const handleCheckout = () => {

  if (selectedProducts.length === 0) return;

  // 🔥 Lưu sản phẩm được chọn vào sessionStorage
  sessionStorage.setItem(
    "checkoutItems",
    JSON.stringify(selectedProducts)
  );

  // 🔥 Chuyển qua trang checkout
  navigate("/checkout");
};

  // ====================================================
  // 🔥 HELPER: FIX IMAGE URL
  // ====================================================
  const getImageUrl = (image) => {

    if (!image) return "";

    // nếu đã là full URL
    if (image.startsWith("http")) return image;

    // nếu chỉ là /uploads/xxx.jpg
    return `http://localhost:5000${image}`;
  };

  // ====================================================
  // RENDER
  // ====================================================
  return (
    <div className="cart-page">

      <h2 className="cart-title">Giỏ hàng của bạn</h2>

      {/* SELECT ALL */}
      {cart.length > 0 && (
        <div className="select-all-row">
          <div
            className={`check-circle ${
              selectedItems.length === cart.length
                ? "checked"
                : ""
            }`}
            onClick={handleSelectAll}
          ></div>
          <span>Chọn tất cả</span>
        </div>
      )}

      {/* EMPTY */}
      {cart.length === 0 && (
        <div className="empty-cart">
          🛒 Giỏ hàng trống
        </div>
      )}

      {/* LIST */}
      {cart.map(item => {

  console.log("ITEM:", item);
  console.log("PRODUCT:", item.product);
  console.log("IMAGE FIELD:", item.product?.image);

  return (
          <div key={item.product._id} className="cart-item">

            <div
              className={`check-circle ${
                selectedItems.includes(item.product._id)
                  ? "checked"
                  : ""
              }`}
              onClick={() =>
                toggleSelect(item.product._id)
              }
            ></div>

            {/* 🔥 FIX IMAGE CHẮC CHẮN HIỆN */}
            <img
                src={
                  item.product.image?.startsWith("http")
                    ? item.product.image
                    : `http://localhost:5000/uploads/${item.product.image}`
                }
                alt={item.product.name}
              />

            <div className="item-info">
              <h4>{item.product.name}</h4>

              <div className="price-box">
                <span className="new-price">
                  {item.product.price?.toLocaleString()}đ
                </span>
              </div>

              <div className="qty">
                <button onClick={() => decreaseQty(item)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => increaseQty(item)}>+</button>
              </div>
            </div>

            <button
              className="delete-btn"
              onClick={() =>
                removeItem(item.product._id)
              }
            >
              🗑
            </button>

          </div>
        );
      })}

      {/* BOTTOM */}
      {cart.length > 0 && (
        <div className="bottom-bar">
          <div className="temp">
            Tạm tính: {total.toLocaleString()}đ
          </div>

          <button
            className="buy-now-btn"
            disabled={selectedProducts.length === 0}
            onClick={handleCheckout}
          >
            Mua ngay ({selectedProducts.length})
          </button>
        </div>
      )}

    </div>
  );
}

export default CartPage;