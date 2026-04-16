const dropdowns = document.querySelectorAll(".dropdown");
fetch(`https://corsproxy.io/?https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
dropdowns.forEach(dropdown => {
  const button = dropdown.querySelector(".nav-btn");

  button.addEventListener("click", (e) => {
    e.stopPropagation();

    dropdowns.forEach(drop => {
      if (drop !== dropdown) {
        drop.classList.remove("active");
      }
    });

    dropdown.classList.toggle("active");
  });
});

document.addEventListener("click", (e) => {
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

  // 🔥 reset pogrubienia
  navButtons.forEach(btn => btn.classList.remove("active"));
});

const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {
  button.addEventListener("click", () => {


    // dodaj do klikniętego
    button.classList.add("active");
  });
    navButtons.forEach(btn => btn.classList.remove("active"));
});
const input = document.getElementById("address-input");

if (input) {
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      const address = input.value.trim();

      if (address) {
        window.location.href = `../map/map.html?address=${encodeURIComponent(address)}`;
      }
    }
  });
}
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    // 🔥 przykładowe wylogowanie
    localStorage.removeItem("user");

    // przekierowanie
    window.location.href = "../start/start.html";
  });
}
const autocompleteList = document.getElementById("autocomplete-list");

if (input) {

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

          // 🔥 kliknięcie = natychmiastowe przejście
          item.addEventListener("click", () => {
            window.location.href = `../map/map.html?address=${encodeURIComponent(place.display_name)}`;
          });

          autocompleteList.appendChild(item);
        });
      });
  });

  // zamykanie
  document.addEventListener("click", (e) => {
    if (!autocompleteList.contains(e.target) && e.target !== input) {
      autocompleteList.classList.remove("active");
    }
  });
}