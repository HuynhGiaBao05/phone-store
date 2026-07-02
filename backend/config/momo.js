
module.exports = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",

  // ✅ redirect về frontend
  redirectUrl: "http://localhost:5173/checkout?momo=success",
  // ✅ backend nhận callback
  ipnUrl: "http://localhost:5000/ipn"
};