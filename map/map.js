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
  if (!mapEl) return;

  const map = L.map(mapEl).setView([52.2297, 21.0122], 6);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CartoDB'
  }).addTo(map);

  // 📍 PARAMS
  const params = new URLSearchParams(window.location.search);
  const address = params.get("address");

  async function geocodeAddress(address) {
    try {
      const res = await fetch(`${window.GEOCODE_URL}?q=${encodeURIComponent(address)}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;

      map.setView([Number(data[0].lat), Number(data[0].lon)], 14);

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
      if (!window.supabaseClient) {
        console.error("Supabase not initialized");
        return { events: [], ratingsByEvent: {} };
      }

      // 1️⃣ EVENTS
      const { data: events, error: e1 } = await supabaseClient
        .from("events")
        .select("id, title, lat, lon, institution, end_date, images")
        .limit(100);

      if (e1) {
        console.error("Events error:", e1);
        return { events: [], ratingsByEvent: {} };
      }

      if (!events || events.length === 0) {
        return { events: [], ratingsByEvent: {} };
      }

      // 2️⃣ RATINGS (VIEW)
      const eventIds = events.map(e => e.id);

      const { data: ratings, error: e2 } = await supabaseClient
        .from("reviews_avg")
        .select("*")
        .in("event_id", eventIds);

      if (e2) {
        console.error("Ratings error:", e2);
      }

      // 3️⃣ MAPA ratingów
      const ratingsByEvent = {};

      (ratings || []).forEach(r => {
        ratingsByEvent[r.event_id] = r;
      });

      return {
        events,
        ratingsByEvent
      };

    } catch (err) {
      console.error("Supabase error:", err);
      return { events: [], ratingsByEvent: {} };
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  }

  window.openEvent = function (id) {
    window.location.href = `/event?id=${id}`;
  };

  // 🚀 START
  (async () => {
    try {
      if (address) {
        await geocodeAddress(address);
      }

      const { events, ratingsByEvent } = await loadEvents();

      events.forEach(event => {
        if (event.lat == null || event.lon == null) return;

        const marker = L.marker(
          [Number(event.lat), Number(event.lon)],
          { icon: customIcon }
        ).addTo(map);

        // ⭐ RATING
        let ratingHTML = "";

        const rating = ratingsByEvent[event.id];

        if (rating) {
          const avg = rating.avg_rating;

          ratingHTML = `
            <div class="popup-rating">
              <img src="/assets/star.png" class="popup-star">
              <span>${Number(avg || 0).toFixed(1)}</span>
            </div>
          `;
        }

        // 📦 POPUP
        marker.bindPopup(`
          <div class="popup-card" data-id="${event.id}">

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

        // 🔥 KLIK POPUPA
        marker.on("popupopen", (e) => {
          const popupEl = e.popup.getElement();
          if (!popupEl) return;

          const card = popupEl.querySelector(".popup-card");
          if (!card) return;

          card.style.cursor = "pointer";

          card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            window.openEvent(id);
          });
        });

      });

    } catch (err) {
      console.error("Map init error:", err);
    } finally {
      hideLoader();
    }
  })();

});