const init = async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "/auth";
    return;
  }

  setupUI();
  loadProfile();
  loadSavedEvents(); // 🔥 TU
};

init();


// 🎯 UI + EVENTY
function setupUI() {
 

    const modal = document.getElementById("profile-modal");
    const editBtn = document.getElementById("edit-profile");
    const closeBtn = document.getElementById("close-profile");
    const profileBox = document.querySelector(".profile-box");
    const saveBtn = document.getElementById("save-profile");

    // 🔥 OTWIERANIE MODALA
    if (editBtn) {
      editBtn.onclick = () => {
        if (modal) {
  modal.classList.add("active");
}

        // focus UX
        document.getElementById("name-input").focus();
      };
    }

    // ❌ ZAMYKANIE X
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.remove("active");
    }

    // ❌ KLIK POZA MODAL
    if (modal && profileBox) {
      modal.addEventListener("click", (e) => {
        if (!profileBox.contains(e.target)) {
          modal.classList.remove("active");
        }
      });

      profileBox.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    // 💾 ZAPIS
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const name = document.getElementById("name-input").value.trim();
        let handle = document.getElementById("handle-input").value.trim();
        const file = document.getElementById("avatar-input").files[0];

        // 🔥 sanitizacja @
        handle = handle.replace(/^@+/, "");
        if (handle) handle = "@" + handle;

        let imageBase64 = null;

        if (file) {
          imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        await saveProfile(name, handle, imageBase64);

        modal.classList.remove("active");

        // reset inputa pliku
        document.getElementById("avatar-input").value = "";

        loadProfile(); // 🔥 odśwież UI
      };
    }

  
}


// 📥 LOAD PROFILE (z Supabase)
async function loadProfile() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Błąd pobierania profilu:", error);
    return;
  }
  if (!data) {
  document.getElementById("profile-name").textContent = "Uzupełnij profil";
  document.getElementById("profile-handle").textContent = "";
  return;
}
  if (data) {
    document.getElementById("profile-name").textContent = data.name || "Brak nazwy";
    document.getElementById("profile-handle").textContent = data.handle || "";

    if (data.avatar_url) {
      document.getElementById("profile-image").src = data.avatar_url;
    }

    // 🔥 uzupełnij formularz
    document.getElementById("name-input").value = data.name || "";

    let handle = data.handle || "";
    if (handle.startsWith("@")) handle = handle.slice(1);
    document.getElementById("handle-input").value = handle;
  }
}


// 💾 SAVE PROFILE (UPSERT)
async function saveProfile(name, handle, image = null) {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { error } = await supabaseClient
    .from("profiles")
    .upsert([
      {
        user_id: user.id,
        name,
        handle,
        avatar_url: image
      }
    ], { onConflict: ["user_id"] });

  if (error) {
    console.error("Błąd zapisu:", error);
    alert("Nie udało się zapisać profilu");
    return;
  }


}

async function loadSavedEvents() {
  const container = document.getElementById("saved-events");
  if (!container) return;

  container.innerHTML = "Ładowanie...";

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

 const { data: saved, error: savedError } = await supabaseClient
  .from("saved_events")
  .select("event_id")
  .eq("user_id", user.id);

if (savedError) {
  console.error("Błąd saved_events:", savedError);
  container.innerHTML = "<p>Błąd ładowania zapisanych wydarzeń</p>";
  return;
}

  if (!saved || saved.length === 0) {
    container.innerHTML = "<p>Brak zapisanych wydarzeń</p>";
    return;
  }

  const ids = saved.map(s => s.event_id);

  // 🔥 pobierz wydarzenia
  const { data: events } = await supabaseClient
    .from("events")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  renderSavedEvents(events);
}

function renderSavedEvents(events) {
  const container = document.getElementById("saved-events");
  container.innerHTML = "";

  if (!events || events.length === 0) {
    container.innerHTML = "<p>Brak zapisanych wydarzeń</p>";
    return;
  }

  events.forEach(event => {
    const card = document.createElement("div");
    card.classList.add("event-card");

    const formatDate = (d) => {
      if (!d) return "";
      const [y, m, day] = d.split("-");
      return `${day}.${m}.${y}`;
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

    card.onclick = () => {
      window.location.href = `/event?id=${event.id}`;
    };

    container.appendChild(card);
  });
}

