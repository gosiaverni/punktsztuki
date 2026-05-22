document.addEventListener("DOMContentLoaded", () => {

  const loader = document.getElementById("map-loader");
  const mapEl = document.getElementById("map");

  if (!mapEl) return;

  const map = L.map(mapEl).setView([52.2297, 21.0122], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);



function hideLoader() {
  if (!loader) return;

  loader.style.display = "none";

  mapEl.classList.add("visible");
}

  const customIcon = L.icon({
    iconUrl: '/assets/pin.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  function formatDate(dateString) {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    return `${d}.${m}.${y}`;
  }

  window.openEvent = function (id) {
    window.location.href = `/event?id=${id}`;
  };

  async function loadEvents() {
    try {
      const { data: events, error } = await supabaseClient
        .from("events")
        .select("id, title, lat, lon, institution, end_date, cover_image")
        .order("end_date", { ascending: true })
        .limit(30); // 🔥 MAŁY LIMIT = brak timeoutów

      if (error) {
        console.error("Events error:", error);
        return;
      }

      events.forEach(event => {

  if (event.lat == null || event.lon == null) return;

  const lat = Number(event.lat);
  const lon = Number(event.lon);

  if (isNaN(lat) || isNaN(lon)) return;

  const marker = L.marker(
    [lat, lon],
    { icon: customIcon }
  ).addTo(map);

        marker.bindPopup(`
          <div class="popup-card" onclick="openEvent('${event.id}')">
            <h3>${event.title}</h3>
            <p>${event.institution || ""}</p>
            <p>do ${formatDate(event.end_date)}</p>
          </div>
        `);
      });

    } catch (err) {
      console.error("Load error:", err);
    } finally {
      hideLoader();
    }
  }

  map.whenReady(loadEvents);

});