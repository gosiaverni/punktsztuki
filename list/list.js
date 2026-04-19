const container = document.getElementById("events-container");
const select = document.getElementById("city-select");
const title = document.getElementById("city-title");

let allEvents = [];

async function loadEvents() {
  const { data: events } = await supabaseClient
    .from("events")
    .select("*");

  return events || [];
}

function renderEvents(events, city) {
  container.innerHTML = "<p>Ładowanie...</p>";

  const filtered = events.filter(e =>
    !city || e.location?.toLowerCase().includes(city.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = "<p>Brak wydarzeń dla wybranego miasta</p>";
    return;
  }

  container.innerHTML = "";

  title.textContent = city ? `${city}` : "wydarzenia";

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

      ${event.images?.length 
        ? `<img src="${event.images[0]}">`
        : ""
      }
    `;

    card.addEventListener("click", () => {
      window.location.href = `/event?id=${event.id}`;
    });

    container.appendChild(card);
  });
}

// 🔥 start
loadEvents().then(events => {
  allEvents = events;
  renderEvents(allEvents, "");
});

// 🔥 select
select.addEventListener("change", () => {
  renderEvents(allEvents, select.value);
});