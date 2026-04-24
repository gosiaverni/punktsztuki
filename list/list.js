const container = document.getElementById("events-container");
const select = document.getElementById("city-select");
const title = document.getElementById("city-title");
const loader = document.getElementById("list-loader");
const list = document.querySelector(".events-grid");

function hideLoader() {
  if (!loader) return;

  loader.style.opacity = "0";

  setTimeout(() => {
    loader.style.display = "none";
  }, 300);
}

function showList() {
  if (list) list.classList.add("visible");
}

let allEvents = [];

async function loadEvents() {
  const { data: events } = await supabaseClient
    .from("events")
    .select("*");

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

// 🚀 START (POPRAWIONE)
(async () => {
  try {
    const events = await loadEvents();
    allEvents = events;
    renderEvents(allEvents, "");
  } catch (err) {
    console.error(err);
  } finally {
    hideLoader();
    showList();
  }
})();

// 🔥 SELECT
if (select) {
  select.addEventListener("change", () => {
    renderEvents(allEvents, select.value);
  });
}