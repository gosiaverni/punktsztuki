const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

async function loadEvent() {
  const { data } = await supabaseClient
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!data) return;

  const event = data;

  document.querySelector("h1").textContent = event.title;

  document.getElementById("event-description").innerHTML = `<p>${event.description}</p>`;

  document.getElementById("event-location").textContent = event.institution || "";
  document.getElementById("event-address").textContent = event.location || "";

  document.querySelector(".event-date").textContent =
    `od ${event.start_date} do ${event.end_date}`;

  if (event.images?.length) {
    document.querySelector(".event-image").src = event.images[0];
  }

  if (event.link) {
    const linkEl = document.getElementById("event-link");
    linkEl.href = event.link;
    linkEl.textContent = "strona wydarzenia";
  }

  // 🔥 DODAJ TO TUTAJ
  const amenitiesContainer = document.getElementById("event-amenities");

  let amenitiesData = event.amenities;

  if (typeof amenitiesData === "string") {
    try {
      amenitiesData = JSON.parse(amenitiesData);
    } catch {
      amenitiesData = [];
    }
  }

  if (amenitiesData && amenitiesData.length > 0) {
    amenitiesContainer.textContent = amenitiesData.join(", ");
  } else {
    amenitiesContainer.style.display = "none";

    const title = document.querySelector(".amenities-title");
    if (title) title.style.display = "none";
  }
}
loadEvent();



const modal = document.getElementById("review-modal");

document.getElementById("add-review").onclick = async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    // 🔥 zapamiętaj gdzie user był
    localStorage.setItem("redirectAfterLogin", window.location.href);

    window.location.href = "/auth/auth.html";
    return;
  }

  // ✅ zalogowany → otwieramy modal
  modal.classList.add("active");
};

document.getElementById("close-modal").onclick = () => {
  modal.classList.remove("active");
};

let selectedRating = 0;

const stars = document.querySelectorAll("#stars img");

stars.forEach(star => {
  star.addEventListener("click", () => {
    selectedRating = star.dataset.value;

    stars.forEach(s => {
      s.src = "../assets/empty-star.png";
    });

    for (let i = 0; i < selectedRating; i++) {
      stars[i].src = "../assets/star.png";
    }
  });
});

document.getElementById("submit-review").onclick = async () => {

  const text = document.getElementById("review-text").value;

  if (!selectedRating) {
    alert("Dodaj ocenę");
    return;
  }

  await supabaseClient.from("reviews").insert([
    {
      event_id: eventId,
      rating: Number(selectedRating),
      text
    }
  ]);

  modal.classList.remove("active");

  loadReviews(); // 🔥 odśwież UI
};

async function loadReviews() {
  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("event_id", eventId);

  updateRatingUI(reviews);
}

function updateRatingUI(reviews) {
  if (!reviews || reviews.length === 0) return;

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) /
    reviews.length;

  document.getElementById("event-rating").textContent =
    "ocena " + avg.toFixed(1);
}



const reviewsModal = document.getElementById("reviews-modal");

document.getElementById("show-reviews").onclick = () => {
  renderReviews();
  reviewsModal.classList.add("active");
};

document.getElementById("close-reviews").onclick = () => {
  reviewsModal.classList.remove("active");
};

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

    const stars = document.createElement("div");
    stars.classList.add("review-stars");

    for (let i = 0; i < r.rating; i++) {
      const img = document.createElement("img");
      img.src = "../assets/star.png";
      stars.appendChild(img);
    }

    const text = document.createElement("div");
    text.classList.add("review-text");
    text.textContent = r.text;

    div.appendChild(stars);
    div.appendChild(text);

    container.appendChild(div);
  });
}

window.addEventListener("click", (e) => {
  if (e.target === reviewsModal) {
    reviewsModal.classList.remove("active");
  }
});



loadReviews();