import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import { FaUserCircle } from "react-icons/fa";

function Navbar() {

  const [categories, setCategories] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ================= LOAD CATEGORY =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log(err));
  }, []);

  // ================= LOGO CLICK =================
  const handleLogoClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // ================= CART =================
  const handleCartClick = () => {
    if (!token || role !== "USER") {
      setShowLoginModal(true);
      return;
    }

    navigate("/cart");
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");

    navigate("/login");
  };

  // ================= SEARCH =================
  useEffect(() => {

    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(() => {

      setLoading(true);

      axios
        .get(`http://localhost:5000/api/products/search?q=${searchTerm}`)
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

    }, 400);

    return () => clearTimeout(delay);

  }, [searchTerm]);

  return (
    <>
      <header className="navbar">

        <div className="nav-inner">

          {/* LOGO */}
          <Link
            to="/"
            className="logo"
            onClick={handleLogoClick}
          >
            BaoPhone
          </Link>

          {/* CATEGORY */}
          <nav>
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/category/${c.slug}`}
                className="nav-link"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          {/* ICONS */}
          <div className="icons">

            {/* SEARCH */}
            <span
              className="icon-btn"
              onClick={() => setShowSearch(true)}
            >
              🔍
            </span>

            {/* CART */}
            <span
              className="icon-btn"
              onClick={handleCartClick}
            >
              🛒
            </span>

            {/* USER */}
            {token && role === "USER" ? (

              <div className="user-menu">

                <FaUserCircle
                  size={28}
                  className="user-icon"
                  onClick={() => setOpen(!open)}
                />

                {open && (
                  <div className="dropdown">

                    <p onClick={() => navigate("/profile")}>
                      Thông tin cá nhân
                    </p>

                    <p onClick={() => navigate("/orders")}>
                      Đơn hàng của tôi
                    </p>

                    <p onClick={handleLogout}>
                      Đăng xuất
                    </p>

                  </div>
                )}

              </div>

            ) : (

              <span
                className="login-link"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </span>

            )}

          </div>

        </div>

      </header>

      {/* LOGIN MODAL */}
      {showLoginModal && (

        <div className="cart-login-overlay">

          <div className="cart-login-box">

            <h3>🔐 Yêu cầu đăng nhập</h3>
            <p>Vui lòng đăng nhập để xem giỏ hàng</p>

            <div className="cart-login-buttons">

              <button
                className="btn-back"
                onClick={() => setShowLoginModal(false)}
              >
                Trở về
              </button>

              <button
                className="btn-login"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </button>

            </div>

          </div>

        </div>

      )}

      {/* SEARCH OVERLAY */}
      {showSearch && (

        <div className="search-overlay">

          <div className="search-header">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />

            <button
              onClick={() => {
                setShowSearch(false);
                setSearchTerm("");
                setResults([]);
              }}
            >
              ✕
            </button>

          </div>

          <div className="search-results">

            {loading && <p>Đang tìm...</p>}

            {results.map((item) => (

              <Link
                key={item._id}
                to={`/product/${item._id}`}
                className="search-item"
                onClick={() => setShowSearch(false)}
              >

                <img src={item.image} alt={item.name} />

                <div>
                  <p>{item.name}</p>
                  <span>{item.price?.toLocaleString()} đ</span>
                </div>

              </Link>

            ))}

          </div>

        </div>

      )}

    </>
  );
}

export default Navbar;