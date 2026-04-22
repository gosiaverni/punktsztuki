

// jeśli używasz globalnego klienta:
const supabaseClient = window.supabaseClient;

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".event-form");
  if (!form) return;

  // ✅ UI
  initAmenities();
  initAutocomplete();

  // 🔐 AUTH
  await checkAuth();

  // 🚀 SUBMIT
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 Submit start");

    try {
      const title = document.getElementById("title")?.value.trim();
      const description = document.getElementById("description")?.value.trim();
      const startDate = document.getElementById("start-date")?.value;
      const endDate = document.getElementById("end-date")?.value;
      const location = document.getElementById("location")?.value.trim();
      const institution = document.getElementById("institution")?.value.trim();
      const link = document.getElementById("event-link")?.value.trim();
      const imageInput = document.getElementById("images");

      if (!title || !location || !startDate) {
        alert("Uzupełnij wymagane pola.");
        return;
      }

      const amenities = Array.from(
        document.querySelectorAll("#amenities-dropdown input:checked")
      ).map(el => el.value);

      let images = [];

      if (imageInput?.files?.length > 0) {
        const imagePromises = Array.from(imageInput.files).map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        images = await Promise.all(imagePromises);
      }

      // 🌍 GEOCODE
      const res = await fetch(
        `${GEOCODE_URL}?q=${encodeURIComponent(location)}`
      );

      if (!res.ok) {
        throw new Error("Geocode API error");
      }

      const geoData = await res.json();

      if (!Array.isArray(geoData) || !geoData.length) {
        alert("Nie znaleziono lokalizacji.");
        return;
      }

      // 💾 SAVE
      const { error } = await supabaseClient.from("events").insert([{
  title,
  description,
  start_date: startDate,
  end_date: endDate,
  location,
  lat: geoData[0].lat,
  lon: geoData[0].lon,
  institution,
  link,
  images,
  amenities: amenities.length ? amenities : []
}]);

      if (error) {
        console.error(error);
        alert("Błąd zapisu.");
        return;
      }

      window.location.href = "/map";

    } catch (err) {
      console.error(err);
      alert("Coś poszło nie tak.");
    }
  });
});


// 🔐 AUTH
async function checkAuth() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "/auth";
  }
}


function initAmenities() {
  const select = document.getElementById("amenities-select");
  const dropdown = document.getElementById("amenities-dropdown");

  if (!select || !dropdown) return;

  const updateSelectedText = () => {
    const selected = Array.from(
      dropdown.querySelectorAll("input:checked")
    ).map(el => el.value);

    if (selected.length === 0) {
      select.textContent = "Wybierz udogodnienia";
    } else {
      select.textContent = selected.join(", ");
    }
  };

  // otwieranie dropdownu
  select.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });

  // klik poza
  document.addEventListener("click", (e) => {
    if (!select.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

  // 🔥 KLUCZ — reagowanie na klik checkboxów
  dropdown.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", updateSelectedText);
  });

  // inicjalny stan
  updateSelectedText();
}
function formatAddress(place) {
  const addr = place.address || {};

  const street = addr.road || addr.pedestrian || addr.footway || "";
  const house = addr.house_number || "";
  const postcode = addr.postcode || "";
  const city = addr.city || addr.town || addr.village || addr.administrative || "";

  // 🔥 jeśli jest ulica → pełny adres
  if (street) {
    return `${street} ${house}, ${postcode} ${city}`.trim();
  }

  // 🔥 jeśli brak ulicy → tylko miasto
  return city;
}

// 🔍 AUTOCOMPLETE
function initAutocomplete() {
  const input = document.getElementById("location");
  const list = document.getElementById("location-list");

  if (!input || !list) return;

  input.addEventListener("input", async () => {
    const query = input.value.trim();

    if (query.length < 3) {
      list.innerHTML = "";
      list.classList.remove("active");
      return;
    }

    try {
      const res = await fetch(
        `${GEOCODE_URL}?q=${encodeURIComponent(query)}`
      );

      if (!res.ok) {
        throw new Error("Autocomplete API error");
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid data:", data);
        return;
      }

      list.innerHTML = data.map(place => `
        <div class="autocomplete-item">${place.display_name}</div>
      `).join("");

      list.classList.add("active");

      document.querySelectorAll(".autocomplete-item").forEach((el, i) => {
        el.addEventListener("click", () => {
          input.value = data[i].display_name;
          list.innerHTML = "";
          list.classList.remove("active");
        });
      });

    } catch (err) {
      console.error(err);
    }
  });
}