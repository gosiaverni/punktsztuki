const container = document.getElementById("events-container");
const select = document.getElementById("city-select");
const title = document.getElementById("city-title");
const loader = document.getElementById("list-loader");
const list = document.querySelector(".events-grid");



function hideLoader() {
  if (!loader) return;

  loader.classList.add("hidden");

  setTimeout(() => {
    loader.style.display = "none";
  }, 300);
}
function showList() {
  if (list) list.classList.add("visible");
}

let allEvents = [];

async function loadEvents() {

  const { data: events, error } = await supabaseClient
    .from("events")
    .select("id, title, institution, end_date, location, cover_image")
    .limit(50);

  if (error) {
    console.error("Events error:", error);
    return [];
  }

  return events || [];
}

function renderEvents(events, city) {
  const filtered = events.filter(e =>
    !city || e.location?.toLowerCase().includes(city.toLowerCase())
  );

  if (!filtered.length) {
    container.innerHTML = "<p>Brak wydarzeń dla wybranego miasta</p>";
    return;
  }

  container.innerHTML = "";

  if (title) {
    title.textContent = city ? city : "wydarzenia";
  }

  filtered.forEach(event => {
    const card = document.createElement("div");
    card.classList.add("event-card");

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${day}.${month}.${year}`;
    };

  card.innerHTML = `
  <div class="event-card-text">
    <h3>${event.title}</h3>
    <p>${event.institution || ""}</p>

    <div class="event-card-date">
      do ${formatDate(event.end_date)}
    </div>
  </div>

  ${event.cover_image
    ? `<img loading="lazy" src="${event.cover_image}">`
    : ""
  }
`;

    card.addEventListener("click", () => {
      window.location.href = `/event?id=${event.id}`;
    });

    container.appendChild(card);
  });
}

(async () => {
  try {
    const events = await loadEvents();

    allEvents = events;

    renderEvents(allEvents, "");

    showList();
    hideLoader();

  } catch (err) {
    console.error(err);
  }
})();

// 🔥 SELECT
if (select) {
  select.addEventListener("change", () => {
    renderEvents(allEvents, select.value);
  });
}