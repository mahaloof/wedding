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
const musicToggle = $("musicToggle");
const publishButton = $("publishButton");
const publishStatus = $("publishStatus");

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
  musicToggle.textContent = "♪ Play music";
}

async function startMusic() {
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
  if (musicMood.value === "off") {
    stopMusic();
    musicToggle.hidden = true;
    return;
  }
  musicToggle.hidden = false;
  startMusic();
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
      headers: { "Content-Type": "application/json" },
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
  } catch (error) {
    publishStatus.textContent = error.message.includes("Failed to fetch")
      ? "Publishing is ready after deployment. Add the Supabase settings in Vercel, then publish again."
      : error.message;
  } finally {
    publishButton.disabled = false;
    publishButton.textContent = "Publish & share";
  }
}

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
    musicToggle.hidden = musicMood.value === "off";
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
if (publicSlug) loadPublishedInvitation(publicSlug);
