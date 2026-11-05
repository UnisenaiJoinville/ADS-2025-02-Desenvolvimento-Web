import { api } from "./api.js";
import { HOME_PAGE, redirectIfAuthenticated, saveSession } from "./auth.js";
import { renderIcons } from "./icons.js";

const { createApp } = Vue;

redirectIfAuthenticated();

// Os icones viram <svg> ANTES de o Vue ler o HTML, assim os dois
// nunca brigam pelo mesmo elemento.
renderIcons();

createApp({
  data() {
    return {
      form: { email: "", password: "" },
      showPassword: false,
      capsLockOn: false,
      loading: false,
      errorMessage: "",
      successMessage: "",
    };
  },
  computed: {
    canSubmit() {
      return this.form.email.trim() !== "" && this.form.password !== "" && !this.loading;
    },
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cadastro") === "ok") {
      this.successMessage = "Conta criada com sucesso! Agora e so entrar.";
      this.form.email = params.get("email") ?? "";
    }
  },
  methods: {
    checkCapsLock(event) {
      this.capsLockOn = event.getModifierState?.("CapsLock") ?? false;
    },
    fillDemo() {
      this.form.email = "professor@estoquefacil.com";
      this.form.password = "123456";
      this.errorMessage = "";
    },
    async handleSubmit() {
      this.errorMessage = "";
      this.successMessage = "";
      this.loading = true;
      try {
        const { user, token } = await api.login({
          email: this.form.email,
          password: this.form.password,
        });
        saveSession({ user, token });
        window.location.replace(HOME_PAGE);
      } catch (error) {
        this.errorMessage = error.message;
        this.form.password = "";
      } finally {
        this.loading = false;
      }
    },
  },
}).mount("#app");
