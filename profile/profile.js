document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("profile-modal");
  const editBtn = document.getElementById("edit-profile");
  const closeBtn = document.getElementById("close-profile");
  const profileBox = document.querySelector(".profile-box");
  const saveBtn = document.getElementById("save-profile");

  // 🔥 OTWIERANIE
  if (editBtn) {
    editBtn.onclick = () => {
      const savedProfile = JSON.parse(localStorage.getItem("profile"));

      if (savedProfile) {
        document.getElementById("name-input").value = savedProfile.name || "";

        let handle = savedProfile.handle || "";
        if (handle.startsWith("@")) {
          handle = handle.slice(1);
        }

        document.getElementById("handle-input").value = handle;
      }

      modal.classList.add("active");
    };
  }

  // ❌ ZAMYKANIE X
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("active");
  }

  // ❌ KLIK POZA
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
    saveBtn.onclick = () => {
      const name = document.getElementById("name-input").value;
      const handle = document.getElementById("handle-input").value;
      const file = document.getElementById("avatar-input").files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
          saveProfile(name, handle, e.target.result);
        };

        reader.readAsDataURL(file);
      } else {
        saveProfile(name, handle);
      }
    };
  }

});