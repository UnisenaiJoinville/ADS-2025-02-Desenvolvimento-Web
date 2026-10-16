import { api, isAuthenticated, setSession } from "./api.js";

// Ja logado? Manda direto para o dashboard.
if (isAuthenticated()) {
  window.location.href = "/index.html";
}

const form = document.querySelector("[data-form]");
const errorBox = document.querySelector("[data-error]");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorBox.classList.add("hidden");

  const data = new FormData(form);

  try {
    const { token, user } = await api.login({
      email: data.get("email"),
      password: data.get("password"),
    });

    setSession(token, user);
    window.location.href = "/index.html";
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove("hidden");
  }
});
