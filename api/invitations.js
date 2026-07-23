const crypto = require("crypto");

const json = (res, status, body) => res.status(status).json(body);
const required = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  return { url: url.replace(/\/$/, ""), key };
};

function slugify(value) {
  const readable = String(value || "our-wedding").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 34) || "our-wedding";
  return `${readable}-${crypto.randomBytes(4).toString("hex")}`;
}

function decodeImage(dataUrl) {
  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) throw new Error("One of the uploaded photos is not a supported image.");
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64") };
}

async function supabase(url, key, path, options = {}) {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(await response.text() || "Supabase request failed.");
  return response;
}

async function uploadPhotos(url, key, slug, photos = []) {
  const uploaded = [];
  for (let index = 0; index < photos.slice(0, 4).length; index += 1) {
    const image = decodeImage(photos[index]);
    if (image.bytes.length > 3_500_000) throw new Error("Each photo must be smaller than 3.5 MB before publishing.");
    const extension = image.contentType.split("/")[1].replace("jpeg", "jpg");
    const path = `${slug}/${index + 1}.${extension}`;
    await supabase(url, key, `/storage/v1/object/invitation-photos/${path}`, {
      method: "POST",
      headers: { "Content-Type": image.contentType, "x-upsert": "true" },
      body: image.bytes,
    });
    uploaded.push(`${url}/storage/v1/object/public/invitation-photos/${path}`);
  }
  return uploaded;
}

module.exports = async (req, res) => {
  try {
    const { url, key } = required();
    if (req.method === "GET") {
      const slug = String(req.query.slug || "").trim();
      if (!slug) return json(res, 400, { error: "An invitation link is required." });
      const response = await supabase(url, key, `/rest/v1/invitations?slug=eq.${encodeURIComponent(slug)}&select=data&limit=1`);
      const rows = await response.json();
      if (!rows[0]) return json(res, 404, { error: "This invitation could not be found." });
      return json(res, 200, { invitation: rows[0].data });
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!data?.bride || !data?.groom || !data?.nikahDate) return json(res, 400, { error: "Names and the ceremony date are required before publishing." });
    const slug = slugify(`${data.bride}-${data.groom}`);
    const photos = await uploadPhotos(url, key, slug, data.photos);
    const invitation = { ...data, photos };
    await supabase(url, key, "/rest/v1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ slug, data: invitation }),
    });
    return json(res, 201, { slug });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unable to publish this invitation." });
  }
};
