// 🔥 AUTOCOMPLETE + SEARCH
const input = document.getElementById("address-input");
const autocompleteList = document.getElementById("autocomplete-list");

if (input) {
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      const address = input.value.trim();
      if (address) {
        window.location.href = `/map?address=${encodeURIComponent(address)}`;
      }
    }
  });

  input.addEventListener("input", function () {
    const query = input.value.trim();

    if (query.length < 3) {
      autocompleteList.innerHTML = "";
      autocompleteList.classList.remove("active");
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      .then(res => res.json())
      .then(data => {
        autocompleteList.innerHTML = "";

        if (data.length > 0) {
          autocompleteList.classList.add("active");
        }

        data.slice(0, 5).forEach(place => {
          const item = document.createElement("div");
          item.classList.add("autocomplete-item");
          item.textContent = place.display_name;

          item.addEventListener("click", () => {
            window.location.href = `/map?address=${encodeURIComponent(place.display_name)}`;
          });

          autocompleteList.appendChild(item);
        });
      });
  });

  document.addEventListener("click", (e) => {
    if (!autocompleteList.contains(e.target) && e.target !== input) {
      autocompleteList.classList.remove("active");
    }
  });
}


// 🔥 NAVBAR (AUTH)
async function renderNavbar() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session?.user;

  const container = document.getElementById("auth-section");
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="dropdown">
        <button class="nav-btn">TWOJE KONTO</button>
        <div class="dropdown-content">
          <div onclick="location.href='/profile'">Profil</div>
          <div>Ustawienia</div>
          <div id="logout-btn">Wyloguj się</div>
        </div>
      </div>
    `;

    document.getElementById("logout-btn").onclick = async () => {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error(error);
        alert("Nie udało się wylogować");
        return;
      }

      window.location.href = "/";
    };

  } else {
    container.innerHTML = `
      <button class="nav-btn" onclick="location.href='/auth'">
        ZALOGUJ SIĘ
      </button>
    `;
  }
}


// 🔥 DROPDOWN (1 SYSTEM — FINALNY)
document.addEventListener("click", (e) => {

  const button = e.target.closest(".nav-btn");

  if (button && button.parentElement.classList.contains("dropdown")) {
    const dropdown = button.parentElement;

    document.querySelectorAll(".dropdown").forEach(d => {
      if (d !== dropdown) d.classList.remove("active");
    });

    dropdown.classList.toggle("active");
    e.stopPropagation();
    return;
  }

  document.querySelectorAll(".dropdown").forEach(d => {
    d.classList.remove("active");
  });
});


// 🔥 AUTH GUARD
async function requireAuth(redirectTo) {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    localStorage.setItem("redirectAfterLogin", redirectTo);
    window.location.href = "/auth";
    return false;
  }

  window.location.href = redirectTo;
}


// 🔥 INIT
renderNavbar();