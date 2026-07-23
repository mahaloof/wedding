const json = (res, status, body) => res.status(status).json(body);

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });
    const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!url || !key || !adminEmail) throw new Error("Admin access is not configured.");
    const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    const user = userResponse.ok ? await userResponse.json() : null;
    if (!user || user.email?.toLowerCase() !== adminEmail) return json(res, 403, { error: "Administrator access is required." });
    const response = await fetch(`${url}/rest/v1/invitations?select=slug,data,created_at,owner_id&order=created_at.desc&limit=50`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(await response.text());
    return json(res, 200, { invitations: await response.json() });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to load invitations." });
  }
};
