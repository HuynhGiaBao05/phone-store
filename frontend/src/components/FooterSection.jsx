import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./FooterSection.css";

/*
  Footer dùng chung toàn site
  - Tự fetch categories
  - Có review
  - Có newsletter
*/

function FooterSection() {
  const [categories, setCategories] = useState([]);

  // ===== LOAD DANH MỤC =====
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <div className="footer-container">

          {/* ===== THÔNG TIN SHOP ===== */}
          <div>
            <Link to="/" className="footer-logo">
                BaoPhone
            </Link>
            <p>Gò Vấp, TP.HCM</p>
            <p>Hotline: 0384 078 353</p>

            {/* SOCIAL ICONS */}
            <div className="footer-social">
              <a href="https://www.facebook.com/giabaohuynh100905?mibextid=wwXIfr&rdid=l1qpYns4jzhqyHNn&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1KruqujEi7%2F%3Fmibextid%3DwwXIfr#" target="_blank" rel="noreferrer">
                <i className="fa-brands fa-facebook-f"></i>
              </a>

              <a href="https://www.instagram.com/hzabaoo_05?igsh=cGM2bHVneWY2c3Jz&utm_source=qr" target="_blank" rel="noreferrer">
                <i className="fa-brands fa-instagram"></i>
              </a>

              <a href="https://www.tiktok.com/@hyunjaebaoo_05?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer">
                <i className="fa-brands fa-tiktok"></i>
              </a>
            </div>
          </div>

          {/* ===== DANH MỤC ===== */}
          <div>

            <h4>DANH MỤC</h4>

            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/category/${c.slug}`}
                className="footer-link"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* ===== HỖ TRỢ ===== */}
          <div>
            <h4>HỖ TRỢ</h4>

            <Link to="/warranty" className="footer-link">
              Chính sách bảo hành
            </Link>

            <Link to="/return-policy" className="footer-link">
              Đổi trả
            </Link>

            <Link to="/contact" className="footer-link">
              Liên hệ
            </Link>
          </div>

          {/* ===== NHẬN ƯU ĐÃI (ĐÃ THÊM LẠI) ===== */}
          <div>
            <h4>NHẬN ƯU ĐÃI</h4>

            <div className="newsletter">
              <input
                type="email"
                placeholder="Email của bạn"
              />
              <button>Gửi</button>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          © 2026 BaoPhone. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default FooterSection;