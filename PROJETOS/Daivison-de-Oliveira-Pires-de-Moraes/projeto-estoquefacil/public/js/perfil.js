import { api } from "./api.js";
import { requireAuth, saveSession, clearSession } from "./auth.js";
import { mountLayout, toast, setButtonLoading } from "./layout.js";
mountLayout("/perfil.html");
const profile = document.querySelector("[data-profile]"),
  password = document.querySelector("[data-password]");
if (requireAuth())
  api
    .me()
    .then((user) => {
      profile.elements.name.value = user.name;
      document.querySelector("[data-user]").textContent =
        `${user.email} · ${user.role}`;
    })
    .catch((e) => toast(e.message, "error"));
profile.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = profile.querySelector("button");
  if (b.disabled) return;
  setButtonLoading(b, true);
  try {
    const user = await api.updateProfile({ name: profile.elements.name.value });
    localStorage.setItem("estoque-facil:user", JSON.stringify(user));
    mountLayout("/perfil.html");
    toast("Nome atualizado");
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setButtonLoading(b, false);
  }
});
password.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = password.querySelector("button");
  if (b.disabled) return;
  setButtonLoading(b, true);
  try {
    await api.changePassword(Object.fromEntries(new FormData(password)));
    clearSession();
    location.replace("/login.html");
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setButtonLoading(b, false);
  }
});
document.querySelector("[data-renew]").addEventListener("click", async (e) => {
  const b = e.currentTarget;
  setButtonLoading(b, true);
  try {
    const session = await api.refresh(
      localStorage.getItem("estoque-facil:refresh"),
    );
    saveSession(session);
    toast("Sessao renovada");
  } catch (e) {
    toast(e.message, "error");
  } finally {
    setButtonLoading(b, false);
  }
});
