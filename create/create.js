document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".event-form");

  if (!form) {
    console.error("❌ Nie znaleziono formularza (.event-form)");
    return;
  }

  // 🔐 AUTH GUARD
  const checkAuth = async () => {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error("Auth error:", error);
        return;
      }

      if (!data.session) {
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        window.location.href = "/auth";
      }
    } catch (err) {
      console.error("Auth crash:", err);
    }
  };

  await checkAuth();

  // 🚀 SUBMIT
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 Submit start");

    try {
      // 📥 INPUTY
      const title = document.getElementById("title")?.value.trim();
      const description = document.getElementById("description")?.value.trim();
      const startDate = document.getElementById("start-date")?.value;
      const endDate = document.getElementById("end-date")?.value;
      const location = document.getElementById("location")?.value.trim();
      const institution = document.getElementById("institution")?.value.trim();
      const link = document.getElementById("event-link")?.value.trim();
      const imageInput = document.getElementById("images");

      // 🧠 WALIDACJA
      if (!title || !location || !startDate) {
        alert("Uzupełnij wymagane pola (tytuł, lokalizacja, data).");
        return;
      }

      // 🧩 AMENITIES
      const amenities = Array.from(
        document.querySelectorAll("#amenities-dropdown input:checked")
      ).map(el => el.value);

      // 📸 IMAGES → base64
      let images = [];

      if (imageInput?.files?.length > 0) {
        const imagePromises = Array.from(imageInput.files).map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = e => resolve(e.target.result);
            reader.onerror = err => reject(err);

            reader.readAsDataURL(file);
          });
        });

        images = await Promise.all(imagePromises);
      }

      console.log("📸 Images processed:", images.length);

      // 🌍 GEOLOC
      const res = await fetch(
        `https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );

      const geoData = await res.json();

      if (!geoData || geoData.length === 0) {
        alert("Nie znaleziono lokalizacji.");
        document.getElementById("location")?.focus();
        return;
      }

      const lat = geoData[0].lat;
      const lon = geoData[0].lon;

      console.log("📍 Coordinates:", lat, lon);

      // 💾 INSERT DO SUPABASE
      const { error } = await supabaseClient
        .from("events")
        .insert([
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
        console.error("❌ DB error:", error);
        alert("Nie udało się zapisać wydarzenia.");
        return;
      }

      console.log("✅ Event zapisany");

      // 🔁 REDIRECT
      window.location.href = "/map";

    } catch (err) {
      console.error("💥 Submit crash:", err);
      alert("Coś poszło nie tak.");
    }
  });
});