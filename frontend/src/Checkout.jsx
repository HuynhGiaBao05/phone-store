import { useEffect, useState } from "react";
import axios from "axios";
import "./Checkout.css";

function Checkout() {

  // ==========================================
  // 🔥 STEP: 1 = THÔNG TIN | 2 = THANH TOÁN
  // ==========================================
  const [step, setStep] = useState(1);

  const [cart, setCart] = useState([]);
  const [stores, setStores] = useState([]);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const token = localStorage.getItem("token");

  const [deliveryMethod, setDeliveryMethod] = useState("STORE"); 
  const [storeAddress, setStoreAddress] = useState("");


  // ==========================================
  // 🔥 LOAD CHECKOUT ITEMS
  // ==========================================
  useEffect(() => {
    const items =
      JSON.parse(localStorage.getItem("checkoutItems")) || [];
    setCart(items);
  }, []);
/*Fetch store khi load:*/
  useEffect(() => {
  fetchStores();
}, []);

const fetchStores = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/stores");
    setStores(res.data);
  } catch (err) {
    console.log(err);
  }
};
  // ==========================================
  // 🔥 TÍNH TỔNG TIỀN
  // ==========================================
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ==========================================
  // 🔥 NEXT STEP
  // ==========================================
  const handleNext = () => {

  if (!customer.name || !customer.phone) {
    alert("Vui lòng nhập đủ thông tin");
    return;
  }

  if (deliveryMethod === "DELIVERY" && !customer.address) {
    alert("Vui lòng nhập địa chỉ giao hàng");
    return;
  }

  if (deliveryMethod === "STORE" && !storeAddress) {
    alert("Vui lòng chọn cửa hàng");
    return;
  }

  setStep(2);
};

  // ==========================================
  // 🔥 TẠO ORDER
  // ==========================================
  const handlePayment = async () => {
    try {

      const formattedItems = cart.map(item => ({
        product: item._id,
        quantity: item.quantity
      }));

      await axios.post(
        "http://localhost:5000/api/orders",
        { items: formattedItems },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("🎉 Thanh toán thành công!");
      localStorage.removeItem("checkoutItems");
      window.location.href = "/";

    } catch (error) {
      alert("Có lỗi xảy ra");
    }
  };

  return (
  <div className="checkout-page">

    <div className="checkout-wrapper">

      {/* ===== STEP HEADER ===== */}
      <div className="checkout-steps">
        <div className={step === 1 ? "active" : ""}>
          1. THÔNG TIN
        </div>
        <div className={step === 2 ? "active" : ""}>
          2. THANH TOÁN
        </div>
      </div>

      {/* ===== PRODUCT CARD ===== */}
      <div className="checkout-card">
        {cart.map(item => (
          <div key={item._id} className="product-row">
            <img src={item.image} alt={item.name} />
            <div className="product-info">
              <h4>{item.name}</h4>
              <p>{item.price.toLocaleString()}đ</p>
              <span>Số lượng: {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
  <div className="checkout-card">

    <h3>Thông tin khách hàng</h3>

    <div className="input-group">
      <input
        placeholder="Họ và tên"
        value={customer.name}
        onChange={(e) =>
          setCustomer({ ...customer, name: e.target.value })
        }
      />

      <input
        placeholder="Số điện thoại"
        value={customer.phone}
        onChange={(e) =>
          setCustomer({ ...customer, phone: e.target.value })
        }
      />

      <input
        placeholder="Email"
        value={customer.email}
        onChange={(e) =>
          setCustomer({ ...customer, email: e.target.value })
        }
      />
    </div>

    {/* ==========================================
        🔥 CHỌN HÌNH THỨC NHẬN HÀNG
    ========================================== */}
    <div className="delivery-method">

      <label>
        <input
          type="radio"
          checked={deliveryMethod === "STORE"}
          onChange={() => setDeliveryMethod("STORE")}
        />
        Nhận tại cửa hàng
      </label>

      <label>
        <input
          type="radio"
          checked={deliveryMethod === "DELIVERY"}
          onChange={() => setDeliveryMethod("DELIVERY")}
        />
        Giao hàng tận nơi
      </label>

    </div>

    {/* ==========================================
        🔥 NẾU NHẬN TẠI CỬA HÀNG
    ========================================== */}
    {deliveryMethod === "STORE" && (
      <div className="store-select">
        <select
        value={storeAddress}
        onChange={(e) => setStoreAddress(e.target.value)}
        >
        <option value="">Chọn cửa hàng</option>

        {stores.map(store => (
            <option key={store._id} value={store.address}>
            {store.address}
            </option>
        ))}

        </select>
      </div>
    )}

    {/* ==========================================
        🔥 NẾU GIAO HÀNG TẬN NƠI
    ========================================== */}
    {deliveryMethod === "DELIVERY" && (
      <input
        className="full-address"
        placeholder="Địa chỉ nhận hàng"
        value={customer.address}
        onChange={(e) =>
          setCustomer({ ...customer, address: e.target.value })
        }
      />
    )}

    {/* ==========================================
        SUMMARY
    ========================================== */}
    <div className="checkout-summary">
      <span>Tổng tiền tạm tính:</span>
      <span className="price">
        {total.toLocaleString()}đ
      </span>
    </div>

    <button className="primary-btn" onClick={handleNext}>
      Tiếp tục
    </button>

  </div>
)}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <div className="checkout-card">

          <h3>Phương thức thanh toán</h3>

          <div className="payment-method">
            <label>
              <input
                type="radio"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              Thanh toán khi nhận hàng
            </label>

            <label>
              <input
                type="radio"
                checked={paymentMethod === "BANK"}
                onChange={() => setPaymentMethod("BANK")}
              />
              Chuyển khoản ngân hàng
            </label>
          </div>

          <div className="checkout-summary">
            <span>Tổng tiền:</span>
            <span className="price">
              {total.toLocaleString()}đ
            </span>
          </div>

          <button className="primary-btn" onClick={handlePayment}>
            Thanh toán
          </button>

        </div>
      )}

    </div>
  </div>
);
}

export default Checkout;