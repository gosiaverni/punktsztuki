const form = document.querySelector(".event-form");

// 🔐 auth guard
const checkAuth = async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "/auth";
  }
};

await checkAuth(); // 🔥 ważne

// 🚀 SUBMIT
form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const location = document.getElementById("location").value;

  const amenities = Array.from(
    document.querySelectorAll("#amenities-dropdown input:checked")
  ).map(el => el.value);

  const institution = document.getElementById("institution").value;
  const link = document.getElementById("event-link").value;
  const imageFiles = document.getElementById("images").files;

  // 📸 images
  const imagePromises = Array.from(imageFiles).map(file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  });

  const images = await Promise.all(imagePromises);

  try {
    const res = await fetch(
      `https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      alert("Nie znaleziono lokalizacji.");
      document.getElementById("location").focus();
      return;
    }

    const lat = data[0].lat;
    const lon = data[0].lon;

    const { error } = await supabaseClient.from("events").insert([{
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
    }]);

    if (error) {
      console.error(error);
      alert("Nie udało się zapisać wydarzenia.");
      return;
    }

    window.location.href = "/map";

  } catch (err) {
    console.error(err);
    alert("Błąd lokalizacji.");
  }
});