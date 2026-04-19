const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

if (!eventId) {
  document.body.innerHTML = "<h2>Brak ID wydarzenia</h2>";
  throw new Error("Missing event ID");
}

let selectedRating = 0;
const stars = document.querySelectorAll("#stars img");
const modal = document.getElementById("review-modal");
const reviewsModal = document.getElementById("reviews-modal");

// =======================
// 📦 LOAD EVENT
// =======================
async function loadEvent() {
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

  document.querySelector("h1").textContent = event.title;

  document.getElementById("event-description").innerHTML = `<p>${event.description}</p>`;
  document.getElementById("event-location").textContent = event.institution || "";
  document.getElementById("event-address").textContent = event.location || "";

  const formatDate = (d) => {
    const [y, m, day] = d.split("-");
    return `${day}.${m}.${y}`;
  };

  document.querySelector(".event-date").textContent =
    `od ${formatDate(event.start_date)} do ${formatDate(event.end_date)}`;

  if (event.images?.length) {
    document.querySelector(".event-image").src = event.images[0];
  }

  if (event.link) {
    const linkEl = document.getElementById("event-link");
    let url = event.link;

    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    linkEl.href = url;
    linkEl.textContent = "strona wydarzenia";
  }

  // amenities
  const amenitiesContainer = document.getElementById("event-amenities");
  let amenitiesData = event.amenities;

  if (typeof amenitiesData === "string") {
    try {
      amenitiesData = JSON.parse(amenitiesData);
    } catch {
      amenitiesData = [];
    }
  }

  if (amenitiesData?.length) {
    amenitiesContainer.textContent = amenitiesData.join(", ");
  } else {
    amenitiesContainer.style.display = "none";
    const title = document.querySelector(".amenities-title");
    if (title) title.style.display = "none";
  }

  await loadReviews();
}

loadEvent();

// =======================
// ⭐ GWIAZDKI
// =======================
stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    selectedRating = index + 1;

    stars.forEach(s => s.src = "/assets/empty-star.png");

    for (let i = 0; i < selectedRating; i++) {
      stars[i].src = "/assets/star.png";
    }
  });
});

// =======================
// ➕ DODAJ RECENZJĘ
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

    // 🔥 reset formularza
    selectedRating = 0;
    document.getElementById("review-text").value = "";

    stars.forEach(s => s.src = "/assets/empty-star.png");
  };
}

// zamknięcie modala
const closeModalBtn = document.getElementById("close-modal");

if (closeModalBtn && modal) {
  closeModalBtn.onclick = () => {
    modal.classList.remove("active");
  };
}

// =======================
// 💾 ZAPIS RECENZJI
// =======================
const submitBtn = document.getElementById("submit-review");

if (submitBtn) {
  submitBtn.onclick = async () => {
    const text = document.getElementById("review-text").value;

    if (!selectedRating) {
      alert("Dodaj ocenę");
      return;
    }

    const { error } = await supabaseClient.from("reviews").insert([
      {
        event_id: eventId,
        rating: selectedRating,
        text
      }
    ]);

    if (error) {
      alert("Nie udało się dodać recenzji");
      console.error(error);
      return;
    }

    modal.classList.remove("active");
    loadReviews();
  };
}

// =======================
// 📊 LOAD REVIEWS
// =======================
async function loadReviews() {
  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("event_id", eventId);

  updateRatingUI(reviews);
}

// =======================
// ⭐ ŚREDNIA OCENA
// =======================
function updateRatingUI(reviews) {
  const el = document.getElementById("event-rating");

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
// 📋 MODAL RECENZJI
// =======================
const showReviewsBtn = document.getElementById("show-reviews");

if (showReviewsBtn && reviewsModal) {
  showReviewsBtn.onclick = () => {
    renderReviews();
    reviewsModal.classList.add("active");
  };
}

const closeReviewsBtn = document.getElementById("close-reviews");

if (closeReviewsBtn && reviewsModal) {
  closeReviewsBtn.onclick = () => {
    reviewsModal.classList.remove("active");
  };
}

// =======================
// 🧾 RENDER LISTY RECENZJI
// =======================
async function renderReviews() {
  const container = document.getElementById("reviews-list");
  container.innerHTML = "";

  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("event_id", eventId);

  if (!reviews || reviews.length === 0) {
    container.innerHTML = "<p>Brak recenzji</p>";
    return;
  }

  reviews.forEach(r => {
    const div = document.createElement("div");
    div.classList.add("review-item");

    const starsDiv = document.createElement("div");
    starsDiv.classList.add("review-stars");

    for (let i = 0; i < r.rating; i++) {
      const img = document.createElement("img");
      img.src = "/assets/star.png";
      starsDiv.appendChild(img);
    }

    const text = document.createElement("div");
    text.classList.add("review-text");
    text.textContent = r.text;

    div.appendChild(starsDiv);
    div.appendChild(text);

    container.appendChild(div);
  });
}

// klik poza modal
window.addEventListener("click", (e) => {
  if (e.target === reviewsModal) {
    reviewsModal.classList.remove("active");
  }
});