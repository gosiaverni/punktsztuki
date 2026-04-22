

document.addEventListener("DOMContentLoaded", () => {

  const loader = document.getElementById("map-loader");
  const mapEl = document.getElementById("map");

  function hideLoader() {
    if (!loader || !mapEl) return;

    loader.style.opacity = "0";

    setTimeout(() => {
      loader.style.display = "none";
      mapEl.classList.add("visible");
    }, 300);
  }

  // 📍 MAPA
  const map = L.map('map').setView([52.2297, 21.0122], 6);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CartoDB'
  }).addTo(map);

  // 📍 PARAMS
  const params = new URLSearchParams(window.location.search);
  const address = params.get("address");

  async function geocodeAddress(address) {
    try {
      const res = await fetch(`${GEOCODE_URL}?q=${encodeURIComponent(address)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;

      map.setView([data[0].lat, data[0].lon], 14);

    } catch (err) {
      console.error("Geocode error:", err);
    }
  }

  // 🎨 IKONA
  const customIcon = L.icon({
    iconUrl: '/assets/pin.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
  });

  // 📦 LOAD DATA
  async function loadEvents() {
    try {
      const { data: events, error: e1 } = await supabaseClient.from("events").select("*");
      const { data: reviews, error: e2 } = await supabaseClient.from("reviews").select("*");

      if (e1) console.error(e1);
      if (e2) console.error(e2);

      return {
        events: events || [],
        reviews: reviews || []
      };

    } catch (err) {
      console.error("Supabase error:", err);
      return { events: [], reviews: [] };
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  }

  function openEvent(id) {
    window.location.href = `/event?id=${id}`;
  }

  // 🚀 START
  (async () => {
    try {
      if (address) {
        await geocodeAddress(address);
      }

      const { events, reviews } = await loadEvents();

      events.forEach(event => {
        if (!event.lat || !event.lon) return;

        const marker = L.marker([event.lat, event.lon], {
          icon: customIcon
        }).addTo(map);

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

    } catch (err) {
      console.error("Map init error:", err);
    } finally {
      // 🔥 ZAWSZE chowamy loader
      hideLoader();
    }
  })();

});