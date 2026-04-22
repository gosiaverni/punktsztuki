document.getElementById("save-password").onclick = async () => {
  const password = document.getElementById("new-password").value;

  if (!password) {
    alert("Podaj hasło");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({
    password
  });

  if (error) {
    alert("Błąd zmiany hasła");
    console.error(error);
    return;
  }

  alert("Hasło zmienione!");
  window.location.href = "/auth";
};