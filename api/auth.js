const json = (res, status, body) => res.status(status).json(body);

function config() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!url || !anonKey) throw new Error("Supabase Auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.");
  return { url: url.replace(/\/$/, ""), anonKey, adminEmail };
}

async function userFromToken(req, url, anonKey) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  return response.ok ? response.json() : null;
}

module.exports = async (req, res) => {
  try {
    const { url, anonKey, adminEmail } = config();
    if (req.method === "GET") {
      const user = await userFromToken(req, url, anonKey);
      if (!user) return json(res, 401, { error: "Please log in." });
      return json(res, 200, { user: { id: user.id, email: user.email }, isAdmin: user.email?.toLowerCase() === adminEmail });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const { action, email, password } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!email || !password || password.length < 8) return json(res, 400, { error: "Enter an email and a password of at least 8 characters." });
    const endpoint = action === "signup" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const response = await fetch(`${url}${endpoint}`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok) return json(res, response.status, { error: result.msg || result.message || "Unable to continue." });
    return json(res, 200, { session: result, needsConfirmation: action === "signup" && !result.access_token });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to continue." });
  }
};
