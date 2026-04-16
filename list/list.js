const container = document.getElementById("events-container");
const select = document.getElementById("city-select");
const title = document.getElementById("city-title");

const events = JSON.parse(localStorage.getItem("events")) || [];

function renderEvents(city) {
  container.innerHTML = "";

  const filtered = events.filter(e =>
    e.location.toLowerCase().includes(city.toLowerCase())
  );

  title.textContent = city ? `${city}` : "wydarzenia";

  filtered.forEach(event => {
    const card = document.createElement("div");
    card.classList.add("event-card");

    let ratingHTML = "";

if (event.reviews && event.reviews.length > 0) {
  const avg =
    event.reviews.reduce((sum, r) => sum + r.rating, 0) /
    event.reviews.length;

  ratingHTML = `
    <div class="event-rating">
      <img src="../assets/star.png" class="rating-star">
      <span>${avg.toFixed(1)}</span>
    </div>
  `;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL");
}

card.innerHTML = `
  <div class="event-card-text">
    <h3>${event.title}</h3>

    ${ratingHTML}

    <p>${event.institution || ""}</p>

    <div class="event-card-date">
      do ${formatDate(event.endDate)}
    </div>
  </div>

  ${event.images && event.images.length > 0 
    ? `<img src="${event.images[0]}">`
    : ""
  }
`;

    // 🔥 klik → event page
    card.addEventListener("click", () => {
      window.location.href = `../event/event.html?id=${event.id}`;
    });

    container.appendChild(card);
  });
}

// wybór miasta
select.addEventListener("change", () => {
  renderEvents(select.value);
});

// start
renderEvents("");