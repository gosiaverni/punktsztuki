// pobranie adresu z URL
const params = new URLSearchParams(window.location.search);
const address = params.get("address");


const map = L.map('map').setView([52.2297, 21.0122], 6); // Polska
function isEventExpired(end_Date) {
  const today = new Date();
  const eventDate = new Date(end_Date);

  // zerujemy godziny (ważne!)
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate < today;
}


L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);
if (address) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;

        map.setView([lat, lon], 14);

      
      }
    });
}
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
}
const addBtn = document.querySelector(".add-event-btn");

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
      localStorage.setItem("redirectAfterLogin", window.location.href);
      window.location.href = "/auth";
      return;
    }

    window.location.href = "/create";
  });
}
const customIcon = L.icon({
  iconUrl: '/assets/pin.png',
  iconSize: [40, 40],      // dopasuj jeśli trzeba
  iconAnchor: [20, 40],    // środek dole = punkt wbicia
  popupAnchor: [0, -35]    // gdzie pojawia się popup
});

async function loadEvents() {
  const { data: events } = await supabaseClient
    .from("events")
    .select("*");

  const { data: reviews } = await supabaseClient
    .from("reviews")
    .select("*");

  return { events: events || [], reviews: reviews || [] };
}


loadEvents().then(({ events, reviews }) => {

  events.forEach(event => {

    if (!event.lat || !event.lon) return;

    const marker = L.marker([event.lat, event.lon], {
      icon: customIcon
    }).addTo(map);

    // 🔥 filtrujemy recenzje dla tego eventu
    const eventReviews = reviews.filter(r => r.event_id == event.id);

    let ratingHTML = "";

    if (eventReviews.length > 0) {
      const avg =
        eventReviews.reduce((sum, r) => sum + r.rating, 0) /
        eventReviews.length;

      ratingHTML = `
        <div class="popup-rating">
          <img src="/assets/star.png" class="popup-star">
          <span>${avg.toFixed(1)}</span>
        </div>
      `;
    }
marker.bindPopup(`
  <div class="popup-card" onclick="openEvent('${event.id}')">

    <h3 class="popup-title">${event.title}</h3>

    <div class="popup-content">

      <div class="popup-text">

        ${ratingHTML}

        <p class="popup-place">${event.institution || ""}</p>

        <p class="popup-date">
          do ${formatDate(event.end_date)}
        </p>
      </div>

      ${event.images?.length 
        ? `<img src="${event.images[0]}" class="popup-img">`
        : ""}

    </div>

  </div>
`);

  });

});


function openEvent(id) {
  window.location.href = `/event?id=${id}`;
}



