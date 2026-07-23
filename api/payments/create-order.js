const crypto = require("crypto");
const invitations = require("../invitations");

const json = (res, status, body) => res.status(status).json(body);
const PRICE_PAISE = 100;

function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel.");
  return { keyId, keySecret };
}

async function razorpay(path, keyId, keySecret, options = {}) {
  const basic = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.description || "Unable to create the payment order.");
  return result;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const { url, key } = invitations.required();
    const user = await invitations.authenticatedUser(req, url, key);
    if (invitations.isAdmin(user)) return json(res, 200, { isAdmin: true });
    const { keyId, keySecret } = razorpayConfig();
    const receipt = `wedly_${crypto.randomBytes(12).toString("hex")}`;
    const order = await razorpay("/orders", keyId, keySecret, {
      method: "POST",
      body: JSON.stringify({ amount: PRICE_PAISE, currency: "INR", receipt, notes: { product: "Wedly invitation publishing", user_id: user.id } }),
    });
    await invitations.supabase(url, key, "/rest/v1/payment_orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ razorpay_order_id: order.id, user_id: user.id, amount: PRICE_PAISE, currency: "INR", status: "created" }),
    });
    return json(res, 201, { orderId: order.id, keyId, amount: PRICE_PAISE, currency: "INR", isAdmin: false });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "Unable to prepare payment." });
  }
};

module.exports.razorpayConfig = razorpayConfig;
module.exports.razorpay = razorpay;
module.exports.PRICE_PAISE = PRICE_PAISE;
