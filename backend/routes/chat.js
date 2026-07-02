const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const Product = require("../models/Product");
const chatHistory = {};
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const userContext = {};

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // ✅ đổi key
  baseURL: "https://api.groq.com/openai/v1" // ✅ thêm dòng này
});
router.post("/", async (req, res) => {
console.log("🔥 API HIT");
  try {
    let { message, userId } = req.body || {};

// 🔥 nếu chưa có userId → guest
if (!userId) {
  userId = "guest";
}

// 🔥 init history trước
if (!chatHistory[userId]) {
  chatHistory[userId] = [];
}

// 🔥 reset context (đặt SAU userId)
message = message?.trim();

if (!message || message.trim() === "") {
  return res.json({
    reply: "Bạn muốn tìm gì?",
    products: []
  });
}

// 👉 reset sau khi trim
const msg = message.toLowerCase();
// 🔥 chỉ reset khi KHÔNG phải câu follow-up
const isFollowUp =
  msg.includes("nó") ||
  msg.includes("cái nào") ||
  msg.includes("so sánh") ||
  msg.includes("con nào") ||
  msg.includes("máy nào");

const isNewTopic =
  message.length > 20 ||
  msg.includes("tôi muốn") ||
  msg.includes("gợi ý") ||
  msg.includes("tìm");

if (!isFollowUp && isNewTopic) {
  chatHistory[userId] = [];
  userContext[userId] = {};
}

const history = chatHistory[userId].map(m => ({ ...m }));


   // ===============================
// 🔥 STEP 1: AI PHÂN TÍCH QUERY
// ===============================

let aiFilter;

try {
  console.log("👉 CALLING OPENAI FILTER...");
  aiFilter = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
     content: `
Bạn là AI phân tích yêu cầu mua sản phẩm (điện thoại, laptop, phụ kiện,...).

NHIỆM VỤ:
Trả về JSON hợp lệ duy nhất.

KHÔNG được:
- Không giải thích
- Không markdown
- Không dùng \`\`\`
- Không thêm text ngoài JSON

FORMAT:
{
  "brand": "",
  "category": "",
  "maxPrice": null,
  "sort": "asc | desc | null"
}

Ví dụ:
"iphone dưới 10 triệu"
→ { "brand": "iPhone", "maxPrice": 10000000, "sort": null }

"điện thoại rẻ"
→ { "brand": "", "maxPrice": null, "sort": "asc" }
`
     },
      {
        role: "user",
        content: message
      }
    ]
  });
} catch (err) {
  console.log("AI FILTER ERROR:", err.message);
  console.log("❌ OPENAI QUOTA HẾT:", err.message);

  // 🔥 fallback luôn
  const fallbackProducts = await Product.find().limit(5);

  return res.json({
    reply: "Mình gợi ý bạn các sản phẩm phù hợp 👇",
    products: fallbackProducts
  });
}

// 👉 FIX lỗi JSON hay bị bọc ```json
let raw = aiFilter?.choices?.[0]?.message?.content || "{}";
raw = raw.replace(/```json|```/g, "").trim();

let filter = {};

try {
  filter = JSON.parse(raw);
} catch (e) {
  console.log("❌ JSON PARSE ERROR:", raw);
  filter = {};
}

// ✅ FIX CHỐNG NULL / SAI TYPE
if (!filter || typeof filter !== "object") {
  filter = {};
}

// ✅ FIX DEFAULT VALUE (rất quan trọng)
filter.brand = filter.brand || "";
// 🔥 CONTEXT USER
if (!userContext[userId]) {
  userContext[userId] = {};
}

// 👉 nếu user đổi category → reset context
if (
  filter.category &&
  userContext[userId].category &&
  filter.category !== userContext[userId].category
) {
  userContext[userId] = {};
}

// 👉 merge context
filter = {
  ...userContext[userId],
  ...filter
};

userContext[userId] = filter;
if (typeof filter.maxPrice !== "number") {
  filter.maxPrice = null;
}
filter.sort = filter.sort || null;

// ✅ DEBUG
console.log("AI FILTER:", filter);


// ===============================
// 🔥 LV2: QUERY THÔNG MINH
// ===============================

// ===============================
// 🔥 STEP 2: QUERY DB THEO AI
// ===============================

let query = {};
let sort = {};
let limit = 5;
// 👉 CATEGORY (quan trọng)
// 👉 CATEGORY (FIX CHUẨN)
// 👉 CATEGORY (PRO VERSION)
if (filter.category && typeof filter.category === "string") {
  const keyword = filter.category?.toLowerCase();

  const categoryDoc = await Category.findOne({
    name: { $regex: keyword, $options: "i" }
  });

  if (categoryDoc) {
    query.category = categoryDoc._id;
  }
}

// 👉 fallback từ DB (KHÔNG hardcode nữa)
if (!filter.category) {
  const categoryDocs = await Category.find().lean();

  const matched = categoryDocs.find(cat =>
    message.toLowerCase().includes(cat.name.toLowerCase()) ||
    cat.name.toLowerCase().includes(message.toLowerCase())
  );

  if (matched) {
    query.category = matched._id;
  }
}

// 👉 KHÔNG tìm được category → KHÔNG filter
if (!query.category) {
  console.log("⚠️ NO CATEGORY MATCH → KHÔNG FILTER CATEGORY");
}
// 👉 brand
// 👉 bỏ qua các từ không phải brand thật
const invalidBrands = ["điện thoại", "phone", "smartphone", "máy"];

if (
  filter.brand &&
  typeof filter.brand === "string" &&
  !invalidBrands.includes(filter.brand.toLowerCase())
) {
  const brandDoc = await Brand.findOne({
    name: new RegExp(filter.brand, "i")
  });

  if (brandDoc) {
    query.brand = brandDoc._id;
  }
}

// 👉 giá
if (typeof filter.maxPrice === "number") {
  query.originalPrice = { $lte: filter.maxPrice };
}

// 👉 sort
if (filter.sort === "asc") {
  sort.originalPrice = 1;
}

if (filter.sort === "desc") {
  sort.originalPrice = -1;
}

// 👉 default sort
if (!filter.brand && !filter.maxPrice && !filter.sort) {
  sort.createdAt = -1; // 🔥 mới nhất
    // 👉 random nhẹ
  if (Math.random() > 0.5) {
    sort.createdAt = 1;
  }

}
console.log("FINAL QUERY:", query);
// 👉 query DB
let products = await Product.find(query)
  .sort(sort)
  .limit(limit)
  .lean();

// 👉 fallback
if (!products.length) {
  products = await Product.find().limit(5);
}


    // ===============================
    // 🔥 3. Format dữ liệu cho AI
    // ===============================

   const productText = products.map(p => {
  return `
Tên: ${p.name}
Giá: ${p.originalPrice?.toLocaleString() || 0}đ
Giảm: ${p.discount || 0}%
`;
}).join("\n");

    // ===============================
    // 🔥 4. Gọi AI (có context sản phẩm)
    // ===============================
    
// 🔥 sẽ lưu history sau khi có reply


// 🔥 giới hạn 6 tin
// 🔥 giữ 10 messages (5 cặp hội thoại)
  let response;

try {
  console.log("👉 CALLING OPENAI CHAT...");
  response = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
  {
  role: "system",
  content: `
Bạn là nhân viên bán hàng.

QUY TẮC:
- Tư vấn đúng loại sản phẩm theo yêu cầu (điện thoại, laptop, phụ kiện...)
- Không được đưa sản phẩm sai loại
- Chỉ chọn 2-3 sản phẩm phù hợp nhất
- Trả lời ngắn gọn, dễ hiểu
- Không giải thích dài dòng

Danh sách sản phẩm:
${productText}
`
},

  // 🔥 CHỈ dùng history
  ...history,
  {
    role: "user",
    content: message
  }
]
  });
} catch (err) {
  console.log("AI CHAT ERROR:", err.message);


  return res.json({
    reply: "Không thể tư vấn lúc này, vui lòng thử lại",
    products
  });
}

// ✅ trả kết quả ở đây
const reply =
  response.choices?.[0]?.message?.content ||
  "Đây là các sản phẩm phù hợp cho bạn";
  if (!reply || reply.trim() === "") {
  return res.json({
    reply: "Mình gợi ý bạn các sản phẩm này nhé 👇",
    products
  });
}
chatHistory[userId].push(
  { role: "user", content: message },
  { role: "assistant", content: reply }
);
chatHistory[userId] = chatHistory[userId].slice(-10);

return res.json({
  reply,
  products
});

  } catch (err) {
  console.log("❌ SERVER ERROR:", err);
  res.status(500).json({ error: err.message });
}
});

module.exports = router;