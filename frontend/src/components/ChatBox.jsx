import axios from "axios";
import "./ChatBox.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function ChatBox() {
  const [open, setOpen] = useState(false); // mở/đóng chat
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
const bottomRef = useRef(null);
  const [messages, setMessages] = useState([
  {
    sender: "bot",
    text: "Xin chào Anh/Chị! Em là trợ lý AI của BAOPHONE store 👋"
  },
  {
    sender: "bot",
    text: "Em rất sẵn lòng hỗ trợ mình ạ!!! 😊"
  }
]);
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
const currentUserIndexRef = useRef(null);
  const sendMessage = async () => {
  if (!message.trim()) return;

  const userMsg = {
    sender: "user",
    text: message,
   status: "sending"
  };

  // 🔥 1. hiện "Đã gửi"
  setMessages(prev => {
  currentUserIndexRef.current = prev.length; // 🔥 lưu index chuẩn
  return [...prev, userMsg];
});
  setMessage("");

  // 🔥 2. typing
 const typingTimeout = setTimeout(() => {
 setMessages(prev => {
  if (prev[prev.length - 1]?.typing) return prev;
  return [...prev, { sender: "bot", typing: true }];
});
}, 300);

  try {
    const res = await axios.post(
  "http://localhost:5000/api/chat",
  {
    message,
    history: messages   
  }
);
    clearTimeout(typingTimeout);
    setMessages(prev => {
      let updated = [...prev];

      // 🔥 xoá typing
      updated = updated.filter(m => !m.typing);

      // 🔥 update "Đã nhận"
     const lastUserIndex = currentUserIndexRef.current;

     
if (lastUserIndex !== -1) {
  updated[lastUserIndex] = {
    ...updated[lastUserIndex],
    status: "sent"
  };
}
      return [
        ...updated,
        {
          sender: "bot",
          text: res.data.reply,
          products: res.data.products
        }
      ];
    });
setTimeout(() => {
  setMessages(prev => {
    let updated = [...prev];

  const lastUserIndex = currentUserIndexRef.current;

    if (lastUserIndex !== -1) {
      updated[lastUserIndex] = {
        ...updated[lastUserIndex],
        status: "received"
      };
    }

    return updated;
  });
}, 300);

  } catch (err) {
    clearTimeout(typingTimeout);
    console.log(err);

  setMessages(prev => {
    let updated = [...prev];

    // 🔥 xoá typing nếu còn
   updated = updated.filter(m => !m.typing);

    // 🔥 update status user cuối
  const lastUserIndex = currentUserIndexRef.current;

    if (lastUserIndex !== -1) {
      updated[lastUserIndex] = {
        ...updated[lastUserIndex],
        status: "received" // hoặc "failed"
      };
    }

    return [
      ...updated,
      { sender: "bot", text: "⚠️ Server đang lỗi, thử lại sau" }
    ];
  });
  }
}
  const lastUserIndex = messages
  .map(m => m.sender)
  .lastIndexOf("user");
  return (
    <>
      {/* BUTTON MỞ CHAT */}
      <div
  className="chat-toggle"
onClick={() => setOpen(!open)}
  draggable
  onDragEnd={(e) => {
    const el = e.target;
    el.style.left = e.pageX + "px";
    el.style.top = e.pageY + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
  }}
>
        💬
      </div>

      {/* CHAT BOX */}
      {open && (
        <div className="chat-box">
          <div className="chat-header">BAOPHONE store</div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={m.sender}>
  <div className="bubble">
  {m.typing ? <div className="typing"></div> : m.text}
</div>

  {/* 🔥 chỉ show cho message user CUỐI */}
  {m.sender === "user" &&
 i === lastUserIndex &&
 m.status && (
  <div className="status">
   {m.status === "sending"
  ? "⏳ Đang gửi..."
  : m.status === "sent"
  ? "✓ Đã gửi"
  : "✓✓ Đã nhận"}
  </div>
)}

                {/* 🔥 HIỂN THỊ PRODUCT */}
                {m.products && m.products.map(p => (
                  <div key={p._id} className="chat-product"
                  onClick={() => navigate(`/product/${p._id}`)}
  style={{ cursor: "pointer" }}>
                    <img
  src={
    p.images?.[0]
      ? `http://localhost:5000/uploads/${p.images[0]}`
      : "https://via.placeholder.com/50"
  }
  width={50}
/>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập câu hỏi..."
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>

        </div>
        
      )}
    </>
  );
}

export default ChatBox;