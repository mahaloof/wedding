const crypto = require("crypto");
const invitations = require("../invitations");
const { razorpayConfig, razorpay, PRICE_PAISE } = require("./create-order");

const json = (res, status, body) => res.status(status).json(body);
const safeEqual = (left, right) => {
  const leftBytes = Buffer.from(left || "");
  const rightBytes = Buffer.from(right || "");
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
};

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const { url, key } = invitations.required();
    const user = await invitations.authenticatedUser(req, url, key);
    if (invitations.isAdmin(user)) return json(res, 403, { error: "Administrators publish directly without payment." });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invitation } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invitation) return json(res, 400, { error: "Missing payment or invitation details." });

    const orderResponse = await invitations.supabase(url, key, `/rest/v1/payment_orders?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`);
    const orders = await orderResponse.json();
    if (!orders[0] || orders[0].status !== "created") return json(res, 400, { error: "This payment order is not available for publishing." });

    const { keyId, keySecret } = razorpayConfig();
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (!safeEqual(expectedSignature, razorpay_signature)) return json(res, 400, { error: "Payment verification failed. Your invitation remains a draft." });
    const razorpayOrder = await razorpay(`/orders/${encodeURIComponent(razorpay_order_id)}`, keyId, keySecret);
    if (razorpayOrder.status !== "paid" || razorpayOrder.amount !== PRICE_PAISE || razorpayOrder.currency !== "INR") {
      return json(res, 400, { error: "Payment is not confirmed yet. Your invitation remains a draft." });
    }

    await invitations.supabase(url, key, "/rest/v1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ razorpay_payment_id, razorpay_order_id, user_id: user.id, amount: PRICE_PAISE, currency: "INR", status: "verified" }),
    });
    const published = await invitations.publishInvitation(invitation, user, url, key);
    await invitations.supabase(url, key, `/rest/v1/payments?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "published", invitation_slug: published.slug }),
    });
    await invitations.supabase(url, key, `/rest/v1/payment_orders?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "paid" }),
    });
    return json(res, 201, published);
  } catch (error) {
    const status = /duplicate key|unique constraint/i.test(error.message) ? 409 : error.status || 500;
    return json(res, status, { error: error.message || "Unable to verify payment." });
  }
};
