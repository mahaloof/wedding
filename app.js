const $ = (id) => document.getElementById(id);

const fields = {
  bride: $("bride"),
  groom: $("groom"),
  hashtag: $("hashtag"),
  nikahDate: $("nikahDate"),
  nikahTime: $("nikahTimeInput"),
  nikahVenue: $("nikahVenueInput"),
  receptionDate: $("receptionDate"),
  receptionTime: $("receptionTimeInput"),
  receptionVenue: $("receptionVenueInput"),
  message: $("message"),
};

const templateInput = $("selectedTemplate");
const invitation = document.querySelector(".invitation");
const creatorScreen = $("creatorScreen");
const invitationStage = $("invitationStage");
const mapInputs = { nikah: $("nikahMapInput"), reception: $("receptionMapInput") };
const photoUpload = $("photoUpload");
const photoStory = $("photoStory");
const photoGrid = $("photoGrid");
const musicMood = $("musicMood");
const customMusicUpload = $("customMusicUpload");
const musicToggle = $("musicToggle");
const publishButton = $("publishButton");
const publishStatus = $("publishStatus");
const publishDialog = $("publishDialog");
const showShareLink = $("showShareLink");
const authGate = $("authGate");
const authForm = $("authForm");
const authEmail = $("authEmail");
const authPassword = $("authPassword");
const authSubmit = $("authSubmit");
const authSwitch = $("authSwitch");
const authStatus = $("authStatus");
const accountEmail = $("accountEmail");
const logoutButton = $("logoutButton");
const adminPanel = $("adminPanel");
const adminList = $("adminList");
const loadAdminInvitations = $("loadAdminInvitations");

let authMode = "login";
let activeSession;

function titleDate(value) {
  if (!value) return "Your special date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function mapUrl(venue) {
  return `https://maps.google.com/?q=${encodeURIComponent(venue)}`;
}

function preferredMapUrl(input, venue) {
  const value = input.value.trim();
  return value || mapUrl(venue || "Wedding venue");
}

function updatePreview() {
  const bride = fields.bride.value.trim() || "Bride";
  const groom = fields.groom.value.trim() || "Groom";
  const nikahDate = titleDate(fields.nikahDate.value);
  const receptionDate = titleDate(fields.receptionDate.value);
  const isNikah = templateInput.value === "blush";

  $("previewBride").textContent = bride;
  $("previewGroom").textContent = groom;
  $("previewBrideCard").textContent = bride;
  $("previewGroomCard").textContent = groom;
  $("previewDateLine").textContent = nikahDate;
  $("previewHashtag").textContent = fields.hashtag.value.trim() || `#${bride}And${groom}`;
  $("previewMessage").textContent = fields.message.value.trim() || "With love in our hearts, we invite you to celebrate this beautiful beginning with us.";
  $("occasionLabel").textContent = isNikah ? "The Nikah of" : "Together with their families";
  $("primaryEventType").textContent = isNikah ? "Nikah" : "Wedding ceremony";
  $("blessingQuote").textContent = isNikah
    ? "“May Allah bless you, shower His blessings upon you, and bring you together in goodness.”"
    : "“Love is the joy of a shared journey and the beginning of a beautiful forever.”";
  $("nikahDateTitle").textContent = nikahDate;
  $("nikahTime").textContent = fields.nikahTime.value.trim() || "To be announced";
  $("nikahVenue").textContent = fields.nikahVenue.value.trim() || "Venue to be announced";
  $("nikahMap").href = preferredMapUrl(mapInputs.nikah, fields.nikahVenue.value);
  $("receptionDateTitle").textContent = receptionDate;
  $("receptionTime").textContent = fields.receptionTime.value.trim() || "To be announced";
  $("receptionVenue").textContent = fields.receptionVenue.value.trim() || "Venue to be announced";
  $("receptionMap").href = preferredMapUrl(mapInputs.reception, fields.receptionVenue.value);
  startCountdown(fields.nikahDate.value);
}

let photoUrls = [];
function renderPhotoStory(urls) {
  photoUrls.filter((url) => url.startsWith("blob:")).forEach((url) => URL.revokeObjectURL(url));
  photoUrls = [];
  photoGrid.replaceChildren();
  photoStory.hidden = urls.length === 0;
  urls.slice(0, 4).forEach((url) => {
    const image = document.createElement("img");
    photoUrls.push(url);
    image.src = url;
    image.alt = "A special wedding memory";
    photoGrid.append(image);
  });
}

function updatePhotoStory() {
  const photos = Array.from(photoUpload.files || []).slice(0, 4).map((file) => URL.createObjectURL(file));
  renderPhotoStory(photos);
}

let countdownTimer;
function startCountdown(dateValue) {
  clearInterval(countdownTimer);
  const target = dateValue ? new Date(`${dateValue}T17:00:00`) : null;
  const render = () => {
    const difference = target ? Math.max(0, target.getTime() - Date.now()) : 0;
    const units = [
      Math.floor(difference / 86400000),
      Math.floor((difference / 3600000) % 24),
      Math.floor((difference / 60000) % 60),
      Math.floor((difference / 1000) % 60),
    ];
    ["days", "hours", "minutes", "seconds"].forEach((id, index) => {
      $(id).textContent = String(units[index]).padStart(2, "0");
    });
  };
  render();
  countdownTimer = setInterval(render, 1000);
}

function applyTemplate(template) {
  invitation.classList.remove("template-blush", "template-classic", "template-midnight", "template-botanical");
  invitation.classList.add(`template-${template}`);
}

let audioContext;
let musicTimer;
let musicActive = false;
let musicRun = 0;
let customMusicUrl = "";
const customMusicAudio = new Audio();
const musicSettings = {
  piano: { notes: [261.63, 329.63, 392, 523.25], wave: "sine", gap: 1300, level: .055 },
  strings: { notes: [220, 293.66, 329.63, 440], wave: "triangle", gap: 1600, level: .045 },
  bells: { notes: [392, 523.25, 659.25, 783.99], wave: "sine", gap: 1050, level: .035 },
};

function stopMusic() {
  musicRun += 1;
  clearInterval(musicTimer);
  musicTimer = undefined;
  musicActive = false;
  customMusicAudio.pause();
  customMusicAudio.currentTime = 0;
  musicToggle.textContent = "♪ Play music";
}

async function startMusic() {
  if (customMusicUrl) {
    if (musicActive) return;
    customMusicAudio.src = customMusicUrl;
    customMusicAudio.loop = true;
    try {
      await customMusicAudio.play();
      musicActive = true;
      musicToggle.textContent = "♫ Pause music";
    } catch {
      musicToggle.textContent = "♪ Play music";
    }
    return;
  }
  const setting = musicSettings[musicMood.value];
  if (!setting || musicActive) return;
  const run = ++musicRun;
  audioContext ||= new AudioContext();
  await audioContext.resume();
  if (run !== musicRun || musicMood.value === "off" || musicActive) return;
  let noteIndex = 0;
  const playNote = () => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = setting.wave;
    oscillator.frequency.value = setting.notes[noteIndex++ % setting.notes.length];
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(setting.level, now + .08);
    gain.gain.exponentialRampToValueAtTime(.0001, now + 1.3);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.35);
  };
  playNote();
  musicTimer = setInterval(playNote, setting.gap);
  musicActive = true;
  musicToggle.textContent = "♫ Pause music";
}

function configureMusic() {
  if (!customMusicUrl && musicMood.value === "off") {
    stopMusic();
    musicToggle.hidden = true;
    return;
  }
  musicToggle.hidden = false;
  startMusic();
}

function setCustomMusicUrl(url) {
  if (customMusicUrl.startsWith("blob:")) URL.revokeObjectURL(customMusicUrl);
  customMusicUrl = url || "";
}

function updateCustomMusic() {
  const file = customMusicUpload.files?.[0];
  if (file && file.size > 3_000_000) {
    customMusicUpload.value = "";
    $("formStatus").textContent = "Please choose a music file smaller than 3 MB.";
    return;
  }
  setCustomMusicUrl(file ? URL.createObjectURL(file) : "");
}

function selectTemplate(template) {
  templateInput.value = template;
  document.querySelectorAll("[data-template]").forEach((card) => {
    const isSelected = card.dataset.template === template;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });
}

document.querySelectorAll("[data-template]").forEach((card) => {
  card.addEventListener("click", () => selectTemplate(card.dataset.template));
});

$("invitationForm").addEventListener("submit", (event) => {
  event.preventDefault();
  updatePreview();
  updatePhotoStory();
  updateCustomMusic();
  applyTemplate(templateInput.value);
  configureMusic();
  creatorScreen.hidden = true;
  invitationStage.hidden = false;
  invitationStage.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("editInvitation").addEventListener("click", () => {
  stopMusic();
  invitationStage.hidden = true;
  creatorScreen.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

musicToggle.addEventListener("click", () => {
  if (musicActive) stopMusic();
  else startMusic();
});

customMusicUpload.addEventListener("change", updateCustomMusic);

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function currentInvitationData() {
  const photos = await Promise.all(Array.from(photoUpload.files || []).slice(0, 4).map(fileAsDataUrl));
  const customMusic = customMusicUpload.files?.[0] ? await fileAsDataUrl(customMusicUpload.files[0]) : "";
  return {
    template: templateInput.value,
    bride: fields.bride.value.trim(),
    groom: fields.groom.value.trim(),
    hashtag: fields.hashtag.value.trim(),
    nikahDate: fields.nikahDate.value,
    nikahTime: fields.nikahTime.value.trim(),
    nikahVenue: fields.nikahVenue.value.trim(),
    nikahMap: mapInputs.nikah.value.trim(),
    receptionDate: fields.receptionDate.value,
    receptionTime: fields.receptionTime.value.trim(),
    receptionVenue: fields.receptionVenue.value.trim(),
    receptionMap: mapInputs.reception.value.trim(),
    message: fields.message.value.trim(),
    musicMood: musicMood.value,
    customMusic,
    photos,
  };
}

async function publishInvitation() {
  publishButton.disabled = true;
  publishButton.textContent = "Publishing…";
  publishStatus.textContent = "Saving your invitation and preparing a public link…";
  try {
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(await currentInvitationData()),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to publish this invitation.");
    const shareUrl = `${window.location.origin}/invite/${result.slug}`;
    publishStatus.replaceChildren("Your invitation is live: ");
    const link = document.createElement("a");
    link.href = shareUrl;
    link.textContent = shareUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    publishStatus.append(link);
    await navigator.clipboard?.writeText(shareUrl);
    publishStatus.append(" — copied to your clipboard.");
    publishDialog.showModal();
  } catch (error) {
    publishStatus.textContent = error.message.includes("Failed to fetch")
      ? "Publishing is ready after deployment. Add the Supabase settings in Vercel, then publish again."
      : error.message;
  } finally {
    publishButton.disabled = false;
    publishButton.textContent = "Publish & share";
  }
}

showShareLink.addEventListener("click", () => {
  publishDialog.close();
  publishStatus.scrollIntoView({ behavior: "smooth", block: "center" });
});

function authHeaders() {
  return activeSession?.access_token ? { Authorization: `Bearer ${activeSession.access_token}` } : {};
}

function setAuthMode(mode) {
  authMode = mode;
  authSubmit.textContent = mode === "login" ? "Log in to Wedly" : "Create my Wedly account";
  authSwitch.textContent = mode === "login" ? "New here? Create an account" : "Already have an account? Log in";
  authPassword.autocomplete = mode === "login" ? "current-password" : "new-password";
  authStatus.textContent = "";
}

async function loadAdminOverview() {
  const response = await fetch("/api/admin/invitations", { headers: authHeaders() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load invitations.");
  adminList.replaceChildren();
  result.invitations.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-item";
    const details = document.createElement("span");
    details.textContent = `${item.data?.bride || "Couple"} & ${item.data?.groom || ""} · ${new Date(item.created_at).toLocaleDateString()}`;
    const link = document.createElement("a");
    link.href = `/invite/${item.slug}`;
    link.textContent = "Open invitation";
    link.target = "_blank";
    link.rel = "noreferrer";
    row.append(details, link);
    adminList.append(row);
  });
  if (!result.invitations.length) adminList.textContent = "No invitations have been published yet.";
}

async function enterWedly(session) {
  activeSession = session;
  localStorage.setItem("wedly-session", JSON.stringify(session));
  const response = await fetch("/api/auth", { headers: authHeaders() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Your session has expired. Please log in again.");
  accountEmail.textContent = result.user.email;
  authGate.hidden = true;
  creatorScreen.hidden = false;
  adminPanel.hidden = !result.isAdmin;
  if (result.isAdmin) loadAdminOverview().catch(() => { adminList.textContent = "Unable to load invitations right now."; });
}

authSwitch.addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authSubmit.disabled = true;
  authStatus.textContent = authMode === "login" ? "Logging you in…" : "Creating your account…";
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: authMode, email: authEmail.value.trim(), password: authPassword.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to continue.");
    if (result.needsConfirmation) {
      authStatus.textContent = "Check your email to confirm your account, then return here to log in.";
      setAuthMode("login");
      return;
    }
    await enterWedly(result.session);
  } catch (error) {
    authStatus.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("wedly-session");
  activeSession = undefined;
  location.reload();
});

loadAdminInvitations.addEventListener("click", () => {
  loadAdminInvitations.disabled = true;
  loadAdminOverview().catch((error) => { adminList.textContent = error.message; }).finally(() => { loadAdminInvitations.disabled = false; });
});

function setFieldValues(data) {
  const values = {
    bride: data.bride, groom: data.groom, hashtag: data.hashtag,
    nikahDate: data.nikahDate, nikahTime: data.nikahTime, nikahVenue: data.nikahVenue,
    receptionDate: data.receptionDate, receptionTime: data.receptionTime, receptionVenue: data.receptionVenue,
    message: data.message,
  };
  Object.entries(values).forEach(([key, value]) => { if (value != null) fields[key].value = value; });
  mapInputs.nikah.value = data.nikahMap || "";
  mapInputs.reception.value = data.receptionMap || "";
  musicMood.value = data.musicMood || "off";
  setCustomMusicUrl(data.customMusic || "");
  selectTemplate(data.template || "blush");
  updatePreview();
  applyTemplate(templateInput.value);
  renderPhotoStory(data.photos || []);
}

async function loadPublishedInvitation(slug) {
  try {
    const response = await fetch(`/api/invitations?slug=${encodeURIComponent(slug)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "This invitation could not be found.");
    setFieldValues(result.invitation);
    creatorScreen.hidden = true;
    invitationStage.hidden = false;
    $("editInvitation").hidden = true;
    publishButton.hidden = true;
    musicToggle.hidden = musicMood.value === "off" && !customMusicUrl;
    musicToggle.textContent = "♪ Play music";
  } catch (error) {
    publishStatus.textContent = error.message;
  }
}

publishButton.addEventListener("click", publishInvitation);

$("demoFill").addEventListener("click", () => {
  const demo = {
    bride: "Leena",
    groom: "Kabir",
    hashtag: "#LeenaAndKabir",
    nikahDate: "2027-06-12",
    nikahTime: "5:30 P.M.",
    nikahVenue: "Juniper Auditorium (Demo Venue)",
    receptionDate: "2027-06-13",
    receptionTime: "7:00 P.M. onwards",
    receptionVenue: "Riverstone Ballroom (Demo Venue)",
    message: "With grateful hearts and the warmth of our families, we invite you to celebrate the beginning of our beautiful forever. Your presence will make our day complete.",
  };
  Object.entries(demo).forEach(([key, value]) => { fields[key].value = value; });
  $("formStatus").textContent = "Demo details added — choose a style and create the invitation.";
});

selectTemplate(templateInput.value);

const pathSlug = window.location.pathname.match(/^\/invite\/([^/]+)\/?$/)?.[1];
const publicSlug = new URLSearchParams(window.location.search).get("invite") || pathSlug;
if (publicSlug) {
  authGate.hidden = true;
  loadPublishedInvitation(publicSlug);
} else {
  try {
    const savedSession = JSON.parse(localStorage.getItem("wedly-session") || "null");
    if (savedSession?.access_token) enterWedly(savedSession).catch(() => localStorage.removeItem("wedly-session"));
  } catch {
    localStorage.removeItem("wedly-session");
  }
}
