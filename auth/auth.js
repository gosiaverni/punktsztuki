let isLogin = true;

const title = document.getElementById("auth-title");
const btn = document.getElementById("auth-btn");
const toggle = document.getElementById("toggle-auth");

toggle.onclick = () => {
  isLogin = !isLogin;

  if (isLogin) {
    title.textContent = "Logowanie";
    btn.textContent = "zaloguj się";
    toggle.textContent = "Rejestracja";
  } else {
    title.textContent = "Rejestracja";
    btn.textContent = "zarejestruj się";
    toggle.textContent = "Logowanie";
  }
};

document.getElementById("auth-form").onsubmit = async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (isLogin) {
    // 🔐 LOGOWANIE
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Błąd logowania");
      console.error(error);
      return;
    }

  window.location.href = "/map";

  } else {
    // 📝 REJESTRACJA
    const { error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      alert("Błąd rejestracji");
      console.error(error);
      return;
    }

    alert("Konto utworzone! Sprawdź swojego maila.");
  }
};

const forgotBtn = document.getElementById("forgot-password");

if (forgotBtn) {
  forgotBtn.onclick = async () => {
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Podaj email, aby zresetować hasło.");
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });

    if (error) {
      console.error(error);
      alert("Nie udało się wysłać maila.");
      return;
    }

    alert("Sprawdź swojego maila.");
  };
}