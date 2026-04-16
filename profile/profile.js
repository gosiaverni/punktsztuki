const modal = document.getElementById("profile-modal");
const editBtn = document.getElementById("edit-profile");
const closeBtn = document.getElementById("close-profile");

editBtn.onclick = () => {
  const savedProfile = JSON.parse(localStorage.getItem("profile"));

  if (savedProfile) {
    document.getElementById("name-input").value = savedProfile.name || "";

    // 🔥 usuń @ w input (lepiej się edytuje)
    let handle = savedProfile.handle || "";
    if (handle.startsWith("@")) {
      handle = handle.slice(1);
    }

    document.getElementById("handle-input").value = handle;
  }

  modal.classList.add("active");
};
closeBtn.onclick = () => modal.classList.remove("active");

async function loadProfile() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .limit(1)
    .single();

  if (data) {
    document.getElementById("profile-name").textContent = data.name;
    document.getElementById("profile-handle").textContent = data.handle;

    if (data.avatar_url) {
      document.getElementById("profile-image").src = data.avatar_url;
    }
  }
}

loadProfile();



// 🔥 zapis
document.getElementById("save-profile").onclick = () => {
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

async function saveProfile(name, handle, image = null) {

  if (handle && !handle.startsWith("@")) {
    handle = "@" + handle;
  }

  await supabaseClient.from("profiles").insert([
    {
      name,
      handle,
      avatar_url: image
    }
  ]);

  location.reload();
}
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});