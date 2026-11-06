import { api } from "./api.js";
import { setButtonLoading } from "./layout.js";
const token = new URLSearchParams(location.search).get("token"),
  forgot = document.querySelector("[data-forgot]"),
  reset = document.querySelector("[data-reset]"),
  message = document.querySelector("[data-message]");
if (token) {
  forgot.classList.add("hidden");
  reset.classList.remove("hidden");
}
for (const form of [forgot, reset])
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const b = form.querySelector("button");
    if (b.disabled) return;
    setButtonLoading(b, true);
    try {
      if (form === forgot) {
        const result = await api.forgotPassword({
          email: form.elements.email.value,
        });
        message.textContent = result.message;
      } else {
        await api.resetPassword({
          token,
          newPassword: form.elements.newPassword.value,
        });
        message.textContent = "Senha alterada. Entre novamente.";
        reset.reset();
        reset.classList.add("hidden");
        history.replaceState(null, "", "/recuperar.html");
      }
    } catch (e) {
      message.textContent = e.message;
    } finally {
      setButtonLoading(b, false);
    }
  });
