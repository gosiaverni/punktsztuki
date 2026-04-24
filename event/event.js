// =======================
// 🔗 PARAMS
// =======================
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

if (!eventId) {
  document.body.innerHTML = "<h2>Brak ID wydarzenia</h2>";
  throw new Error("Missing event ID");
}

// =======================
// 🌍 GLOBAL STATE
// =======================
let selectedRating = 0;
let isSaved = false;

const stars = document.querySelectorAll("#stars img");
const modal = document.getElementById("review-modal");
const reviewsModal = document.getElementById("reviews-modal");
const bookmarkBtn = document.getElementById("bookmark-btn");

// =======================
// 🧠 HELPERS
// =======================
function shortenAddress(full) {
  if (!full) return "";

  const parts = full.split(",").map(p => p.trim());

  const street = parts[0] || "";
  const postcode = parts.find(p => /\d{2}-\d{3}/.test(p)) || "";
  const city = parts.find(p =>
    p !== street &&
    !p.includes("województwo") &&
    !/\d{2}-\d{3}/.test(p) &&
    p.length > 2
  ) || "";

  return [street, postcode, city].filter(Boolean).join(", ");
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

// =======================
// 📦 LOAD EVENT
// =======================
async function loadEvent() {
  try {
    const { data } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!data) {
      document.body.innerHTML = "<h2>Nie znaleziono wydarzenia</h2>";
      return;
    }

    const event = data;

    // 🧠 SAFE SETTERS
    const titleEl = document.querySelector("h1");
    if (titleEl) titleEl.textContent = event.title;

    const descEl = document.getElementById("event-description");
    if (descEl) descEl.innerHTML = `<p>${event.description}</p>`;

    const locEl = document.getElementById("event-location");
    if (locEl) locEl.textContent = event.institution || "";

    const addrEl = document.getElementById("event-address");
    if (addrEl) addrEl.textContent = shortenAddress(event.location);

    const dateEl = document.querySelector(".event-date");
    if (dateEl) {
      dateEl.textContent =
        `od ${formatDate(event.start_date)} do ${formatDate(event.end_date)}`;
    }

    const imgEl = document.querySelector(".event-image");
    if (imgEl && event.images?.length) {
      imgEl.src = event.images[0];
    }

    // 🔗 LINK
    if (event.link) {
      const linkEl = document.getElementById("event-link");
      if (linkEl) {
        let url = event.link;
        if (!url.startsWith("http")) url = "https://" + url;

        linkEl.href = url;
        linkEl.textContent = "strona wydarzenia";
      }
    }

    // 🎯 AMENITIES
    const amenitiesContainer = document.getElementById("event-amenities");
    let amenitiesData = event.amenities;

    if (typeof amenitiesData === "string") {
      try {
        amenitiesData = JSON.parse(amenitiesData);
      } catch {
        amenitiesData = [];
      }
    }

    if (amenitiesContainer) {
      if (amenitiesData?.length) {
        amenitiesContainer.textContent = amenitiesData.join(", ");
      } else {
        amenitiesContainer.style.display = "none";
        const title = document.querySelector(".amenities-title");
        if (title) title.style.display = "none";
      }
    }

    await loadReviews();
    await checkIfSaved();

  } catch (err) {
    console.error("Load event error:", err);
  }
}

loadEvent();

// =======================
// 🔖 BOOKMARK
// =======================
async function checkIfSaved() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data } = await supabaseClient
    .from("saved_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  isSaved = !!data;
  updateBookmarkUI();
}

function updateBookmarkUI() {
  if (!bookmarkBtn) return;

  bookmarkBtn.src = isSaved
    ? "/assets/bookmark.png"
    : "/assets/bookmark-empty.png";
}

if (bookmarkBtn) {
  bookmarkBtn.onclick = async () => {
    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) {
      localStorage.setItem("redirectAfterLogin", window.location.href);
      window.location.href = "/auth";
      return;
    }

    if (isSaved) {
      await supabaseClient
        .from("saved_events")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      isSaved = false;
    } else {
      await supabaseClient
        .from("saved_events")
        .insert([{ user_id: user.id, event_id: eventId }]);

      isSaved = true;
    }

    updateBookmarkUI();
  };
}

// =======================
// ⭐ GWIAZDKI
// =======================
if (stars.length) {
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      selectedRating = index + 1;

      stars.forEach(s => s.src = "/assets/empty-star.png");
      for (let i = 0; i < selectedRating; i++) {
        stars[i].src = "/assets/star.png";
      }
    });
  });
}

// =======================
// ➕ RECENZJA
// =======================
const addReviewBtn = document.getElementById("add-review");

if (addReviewBtn && modal) {
  addReviewBtn.onclick = async () => {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
      localStorage.setItem("redirectAfterLogin", window.location.href);
      window.location.href = "/auth";
      return;
    }

    modal.classList.add("active");

    selectedRating = 0;
    const input = document.getElementById("review-text");
    if (input) input.value = "";

    stars.forEach(s => s.src = "/assets/empty-star.png");
  };
}

// =======================
// 💾 SAVE REVIEW
// =======================
const submitBtn = document.getElementById("submit-review");

if (submitBtn) {
  submitBtn.onclick = async () => {
    const text = document.getElementById("review-text")?.value;

    if (!selectedRating) {
      alert("Dodaj ocenę");
      return;
    }

    await supabaseClient
      .from("reviews")
      .insert([{ event_id: eventId, rating: selectedRating, text }]);

    modal.classList.remove("active");
    loadReviews();
  };
}

// =======================
// 📊 REVIEWS
// =======================
async function loadReviews() {
  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("event_id", eventId);

  updateRatingUI(reviews);
}

function updateRatingUI(reviews) {
  const el = document.getElementById("event-rating");
  if (!el) return;

  if (!reviews || reviews.length === 0) {
    el.textContent = "brak ocen";
    return;
  }

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) /
    reviews.length;

  el.textContent = "ocena " + avg.toFixed(1);
}

// =======================
// 🔥 NAVBAR AUTH
// =======================
async function renderNavbar() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session?.user;

  const container = document.getElementById("auth-section");
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="dropdown">
        <button class="nav-btn">TWOJE KONTO</button>
        <div class="dropdown-content">
          <div onclick="location.href='/profile'">Profil</div>
          <div>Ustawienia</div>
          <div id="logout-btn">Wyloguj się</div>
        </div>
      </div>
    `;

    document.getElementById("logout-btn").onclick = async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/";
    };

  } else {
    container.innerHTML = `
      <button class="nav-btn" onclick="location.href='/auth'">
        ZALOGUJ SIĘ
      </button>
    `;
  }
}

// 🔥 INIT
renderNavbar();