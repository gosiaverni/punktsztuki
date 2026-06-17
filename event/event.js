// =======================
// 🔗 PARAMS
// =======================
const params = new URLSearchParams(window.location.search);
const eventIdRaw = params.get("id");

if (!eventIdRaw) {
  document.body.innerHTML = "<h2>Brak ID wydarzenia</h2>";
  throw new Error("Missing event ID");
}
const eventId = eventIdRaw;

// =======================
// 🌍 GLOBAL STATE
// =======================
let selectedRating = 0;
let isSaved = false;

const stars = document.querySelectorAll("#stars img");
const modal = document.getElementById("review-modal");
const bookmarkBtn = document.getElementById("bookmark-btn");
const reportBtn =
  document.getElementById("report-event-btn");

const reportModal =
  document.getElementById("report-modal");

if (reportBtn && reportModal) {

  reportBtn.addEventListener("click", () => {

    reportModal.classList.add("active");

  });

}

const closeReportModal =
  document.getElementById("close-report-modal");

if (closeReportModal && reportModal) {

  closeReportModal.addEventListener(
    "click",
    () => {
      reportModal.classList.remove("active");
    }
  );

}

if (reportModal) {

  reportModal.addEventListener("click", (e) => {

    if (e.target === reportModal) {
      reportModal.classList.remove("active");
    }

  });

}
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
    const { data, error } = await supabaseClient
      .from("events")
      .select("id, title, description, institution, location, start_date, end_date, images, link, amenities, user_id")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error(error);
      document.body.innerHTML = "<h2>Błąd ładowania wydarzenia</h2>";
      return;
    }

    if (!data) {
      document.body.innerHTML = "<h2>Nie znaleziono wydarzenia</h2>";
      return;
    }

    const event = data;

    const { data: sessionData } =
  await supabaseClient.auth.getSession();

const currentUserId =
  sessionData.session?.user?.id;

const isOwner =
  currentUserId === event.user_id;

const controls =
  document.getElementById("event-owner-controls");

  if (isOwner && controls) {

  controls.innerHTML = `
    <div class="owner-buttons">

      <button
        id="edit-event-btn"
        class="submit-btn"
      >
        Edytuj wydarzenie
      </button>

      <button
        id="delete-event-btn"
        class="submit-btn delete-btn"
      >
        Usuń wydarzenie
      </button>

    </div>
  `;
}

document
  .getElementById("delete-event-btn")
  ?.addEventListener("click", async () => {

    const confirmed = confirm(
      "Na pewno usunąć wydarzenie?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
      .from("events")
      .delete()
      .eq("id", event.id);

    if (error) {
      console.error(error);
      alert("Nie udało się usunąć.");
      return;
    }

    window.location.href = "/map";
});

    // 🧠 SAFE SETTERS
    const titleEl = document.querySelector("h1");
    if (titleEl) titleEl.textContent = event.title;

    const descEl = document.getElementById("event-description");
    if (descEl) {
      const p = document.createElement("p");
      p.textContent = event.description || "";
      descEl.innerHTML = "";
      descEl.appendChild(p);
    }

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
  const user = userData?.user;

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("saved_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) console.error(error);

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
    const user = userData?.user;

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

async function uploadReportFiles(files) {

  const uploaded = [];

  for (const file of files) {

    const path =
      `${Date.now()}-${file.name}`;

    const { error } =
      await supabaseClient.storage
        .from("report-attachments")
        .upload(path, file);

    if (error) {
      console.error(error);
      continue;
    }

    uploaded.push(path);
  }

  return uploaded;
}

const submitReportBtn =
  document.getElementById("submit-report-btn");

if (submitReportBtn) {

  submitReportBtn.addEventListener(
    "click",
    async () => {

      const reason =
        document.getElementById("report-reason").value;

      const description =
        document.getElementById("report-description").value;

      const email =
        document.getElementById("report-email").value;

      const files =
        document.getElementById("report-files").files;

      if (!reason) {
        alert("Wybierz powód");
        return;
      }

      if (!description.trim()) {
        alert("Opisz problem");
        return;
      }

      let attachments = [];

      if (files.length) {

        attachments =
          await uploadReportFiles(files);

      }

      const { data: userData } =
        await supabaseClient.auth.getUser();

      const user =
        userData?.user;

      const { error } =
        await supabaseClient
          .from("event_reports")
          .insert([{
            event_id: eventId,
            user_id: user?.id ?? null,

            reason,
            description,
            email,

            attachments
          }]);

      if (error) {

        console.error(error);

        alert(
          "Nie udało się wysłać zgłoszenia"
        );

        return;
      }

      alert(
        "Dziękujemy. Zgłoszenie zostało wysłane."
      );

      reportModal.classList.remove("active");

    }
  );

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

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabaseClient
      .from("reviews")
      .insert([{
        event_id: eventId,
        rating: selectedRating,
        text,
        user_id: user.id
      }]);

    if (error) {
      console.error(error);
      alert("Nie udało się dodać opinii");
      return;
    }

    modal.classList.remove("active");
    loadReviews();
  };
}

// =======================
// 📊 REVIEWS
// =======================
async function loadReviews() {
  const { data: reviews, error } = await supabaseClient
    .from("reviews")
    .select("rating")
    .eq("event_id", eventId);

  if (error) {
    console.error(error);
    return;
  }

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