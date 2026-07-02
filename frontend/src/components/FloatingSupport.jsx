import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Phone, X } from "lucide-react";

export default function FloatingSupport() {
  console.log("🔥 FloatingSupport render");
const moved = useRef(false);

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
 const btnClass =
    "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-105";
const [position, setPosition] = useState({
  x: window.innerWidth - 100,
  y: window.innerHeight - 100,
});

const dragging = useRef(false);
const offset = useRef({ x: 0, y: 0 });

const handleMouseDown = (e) => {
  e.stopPropagation();
  dragging.current = true;
  moved.current = false;

  offset.current = {
    x: e.clientX - position.x,
    y: e.clientY - position.y,
  };
};

const handleMouseMove = (e) => {
  if (!dragging.current) return;

  moved.current = true;

  requestAnimationFrame(() => {   // 🔥 THÊM DÒNG NÀY
    const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - offset.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - offset.current.y));

    setPosition({ x, y });
  });
};

const handleMouseUp = () => {
  dragging.current = false;

  requestAnimationFrame(() => {
    setPosition((prev) => ({
      x: prev.x < window.innerWidth / 2 ? 10 : window.innerWidth - 70,
      y: Math.max(10, Math.min(window.innerHeight - 70, prev.y)),
    }));
  });
};

useEffect(() => {
  const saved = localStorage.getItem("support-pos");
  if (saved) setPosition(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem("support-pos", JSON.stringify(position));
}, [position]);
useEffect(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, []);


  

  // close when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const containerStyle = {
    position: "fixed",
    top: position.y,
left: position.x,
    zIndex: 2147483647,
    display: "flex",
    flexDirection: "row",
alignItems: "flex-start",
    gap: 12,
    
  };

  const menuStyle = {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    padding: 12,
    width: 220,
    marginBottom: 8,
    transformOrigin: "bottom right",
  };

  const optionStyle = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    background: "white",
  };
return (
    <div ref={containerRef} style={containerStyle} className="text-black">
      {/* Menu xuất hiện khi open = true */}
      {open && (
        <div style={menuStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Hỗ trợ trực tuyến</strong>
            <X className="cursor-pointer" onClick={() => setOpen(false)} />
          </div>

          <a href="tel:1900969642" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={optionStyle}>
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: 600 }}>1999.9999</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>(8:00 - 21:30)</div>
              </div>
            </div>
          </a>

          <a
            href="https://zalo.me/"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", color: "inherit", marginTop: 8 }}
          >
            <div style={optionStyle}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                alt="zalo"
                style={{ width: 20, height: 20 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Chat Zalo</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>(7h30 - 22h00)</div>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Nút mở support (luôn hiển thị) */}
      <button
  onMouseDown={handleMouseDown}
  onClick={() => {
    if (moved.current) return; // 🔥 nếu vừa kéo thì không mở
    setOpen((v) => !v);
  }}
        className="w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        style={{ border: "2px solid rgba(255,255,255,0.06)" }}
        aria-label="Mở hỗ trợ"
      >
        
       <MessageCircle size={26} className="translate-x-[1px]" />
      </button>
    </div>
  );
}