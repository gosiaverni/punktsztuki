const form = document.querySelector(".event-form");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const location = document.getElementById("location").value;
  const checked = document.querySelectorAll("#amenities-dropdown input:checked");

const amenities = Array.from(checked).map(el => el.value);

  // 🔥 PRZENIESIONE TUTAJ
  const institution = document.getElementById("institution").value;
  const link = document.getElementById("event-link").value;

  const imageFiles = document.getElementById("images").files;

  const imagePromises = [];

  for (let file of imageFiles) {
    const reader = new FileReader();

    const promise = new Promise((resolve) => {
      reader.onload = function(e) {
        resolve(e.target.result);
      };
    });

    reader.readAsDataURL(file);
    imagePromises.push(promise);
  }

Promise.all(imagePromises).then(async (images) => {

  try {
    const res = await fetch(
      `https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );

    const data = await res.json();

   
if (!data || data.length === 0) {
  alert("Nie znaleziono lokalizacji.");

  document.getElementById("location").focus(); // 🔥 wraca do pola
  return;
}
    const lat = data[0].lat;
    const lon = data[0].lon;
const { error } = await supabaseClient.from("events").insert([
  {
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    location,
    lat,
    lon,
    institution,
    link,
    images,
    amenities
  }
]);

if (error) {
  console.error("SUPABASE ERROR:", error);
  alert("Nie udało się zapisać wydarzenia.");
  return;
}

    window.location.href = "../map/map.html";

  } catch (err) {
  console.error("Błąd lokalizacji:", err);

  alert("Wystąpił błąd przy wyszukiwaniu lokalizacji. Spróbuj ponownie.");

  const locationInput = document.getElementById("location");

  locationInput.focus(); // 🔥 wraca do pola
  locationInput.classList.add("input-error"); // 🔥 podświetlenie
}
});
});

const select = document.getElementById("amenities-select");
const dropdown = document.getElementById("amenities-dropdown");

if (select && dropdown) {

  select.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!select.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

}

const form = document.querySelector(".event-form");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const location = document.getElementById("location").value;
  const checked = document.querySelectorAll("#amenities-dropdown input:checked");

const amenities = Array.from(checked).map(el => el.value);

  // 🔥 PRZENIESIONE TUTAJ
  const institution = document.getElementById("institution").value;
  const link = document.getElementById("event-link").value;

  const imageFiles = document.getElementById("images").files;

  const imagePromises = [];

  for (let file of imageFiles) {
    const reader = new FileReader();

    const promise = new Promise((resolve) => {
      reader.onload = function(e) {
        resolve(e.target.result);
      };
    });

    reader.readAsDataURL(file);
    imagePromises.push(promise);
  }

Promise.all(imagePromises).then(async (images) => {

  try {
    const res = await fetch(
      `https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );

    const data = await res.json();

   
if (!data || data.length === 0) {
  alert("Nie znaleziono lokalizacji.");

  document.getElementById("location").focus(); // 🔥 wraca do pola
  return;
}
    const lat = data[0].lat;
    const lon = data[0].lon;
const { error } = await supabaseClient.from("events").insert([
  {
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    location,
    lat,
    lon,
    institution,
    link,
    images,
    amenities
  }
]);

if (error) {
  console.error("SUPABASE ERROR:", error);
  alert("Nie udało się zapisać wydarzenia.");
  return;
}

    window.location.href = "../map/map.html";

  } catch (err) {
  console.error("Błąd lokalizacji:", err);

  alert("Wystąpił błąd przy wyszukiwaniu lokalizacji. Spróbuj ponownie.");

  const locationInput = document.getElementById("location");

  locationInput.focus(); // 🔥 wraca do pola
  locationInput.classList.add("input-error"); // 🔥 podświetlenie
}
});
});

const select = document.getElementById("amenities-select");
const dropdown = document.getElementById("amenities-dropdown");

if (select && dropdown) {

  select.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!select.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

}



const fileInput = document.getElementById("images");
const fileLabel = document.getElementById("file-label");

if (fileInput && fileLabel) {
  fileInput.addEventListener("change", () => {
    const files = fileInput.files;

    if (files.length === 0) {
      fileLabel.textContent = "wybierz zdjęcia";
    } else if (files.length === 1) {
      fileLabel.textContent = files[0].name;
    } else {
      fileLabel.textContent = `${files.length} plików`;
    }
  });
}

const locationInput = document.getElementById("location");
const locationList = document.getElementById("location-list");

if (locationInput) {

  locationInput.addEventListener("input", function () {
    const query = locationInput.value.trim();

    if (query.length < 3) {
      locationList.innerHTML = "";
      locationList.classList.remove("active");
      return;
    }

    fetch(`https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {

        locationList.innerHTML = "";

        if (data.length > 0) {
          locationList.classList.add("active");
        }

        data.slice(0, 5).forEach(place => {
          const item = document.createElement("div");
          item.classList.add("autocomplete-item");
          item.textContent = place.display_name;

          item.addEventListener("click", () => {
            locationInput.value = place.display_name;
            locationList.classList.remove("active");
          });

          locationList.appendChild(item);
        });

      })
      .catch(err => {
        console.error("Autocomplete error:", err);
        locationList.classList.remove("active");
      });

  });

} // 🔥 zamknięcie if

document.addEventListener("click", (e) => {
  if (
    locationList &&
    locationInput &&
    !locationList.contains(e.target) &&
    e.target !== locationInput
  ) {
    locationList.classList.remove("active");
  }
});

const fileInput = document.getElementById("images");
const fileLabel = document.getElementById("file-label");

if (fileInput && fileLabel) {
  fileInput.addEventListener("change", () => {
    const files = fileInput.files;

    if (files.length === 0) {
      fileLabel.textContent = "wybierz zdjęcia";
    } else if (files.length === 1) {
      fileLabel.textContent = files[0].name;
    } else {
      fileLabel.textContent = `${files.length} plików`;
    }
  });
}

const locationInput = document.getElementById("location");
const locationList = document.getElementById("location-list");

if (locationInput) {

  locationInput.addEventListener("input", function () {
    const query = locationInput.value.trim();

    if (query.length < 3) {
      locationList.innerHTML = "";
      locationList.classList.remove("active");
      return;
    }

    fetch(`https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {

        locationList.innerHTML = "";

        if (data.length > 0) {
          locationList.classList.add("active");
        }

        data.slice(0, 5).forEach(place => {
          const item = document.createElement("div");
          item.classList.add("autocomplete-item");
          item.textContent = place.display_name;

          item.addEventListener("click", () => {
            locationInput.value = place.display_name;
            locationList.classList.remove("active");
          });

          locationList.appendChild(item);
        });

      })
      .catch(err => {
        console.error("Autocomplete error:", err);
        locationList.classList.remove("active");
      });

  });

} // 🔥 zamknięcie if

document.addEventListener("click", (e) => {
  if (
    locationList &&
    locationInput &&
    !locationList.contains(e.target) &&
    e.target !== locationInput
  ) {
    locationList.classList.remove("active");
  }
});