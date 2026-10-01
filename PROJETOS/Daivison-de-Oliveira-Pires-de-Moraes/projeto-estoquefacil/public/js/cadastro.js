import { api } from "./api.js";
import { LOGIN_PAGE, redirectIfAuthenticated } from "./auth.js";

const { createApp } = Vue;

// A MESMA regra do back-end (src/modules/auth/user-validator.js).
// Validar aqui e so conforto: quem manda e sempre o servidor.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

redirectIfAuthenticated();

createApp({
  data() {
    return {
      form: {
        name: "",
        email: "",
        password: "",
        passwordConfirmation: "",
      },
      // Guarda quais campos o usuario ja visitou, para so
      // cobrar o preenchimento depois que ele sair do campo.
      touched: {
        name: false,
        email: false,
        password: false,
        passwordConfirmation: false,
      },
      showPassword: false,
      loading: false,
      errorMessage: "",
    };
  },

  computed: {
    // Todos os erros do formulario, sempre atualizados.
    errors() {
      const errors = {};
      const { name, email, password, passwordConfirmation } = this.form;

      if (!name) {
        errors.name = "Informe seu nome";
      } else if (name.length < 3) {
        errors.name = "O nome deve ter pelo menos 3 caracteres";
      }

      if (!email) {
        errors.email = "Informe seu e-mail";
      } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = "Esse e-mail nao parece valido";
      }

      if (!password) {
        errors.password = "Informe uma senha";
      } else if (password.length < 6) {
        errors.password = "A senha deve ter pelo menos 6 caracteres";
      }

      if (!passwordConfirmation) {
        errors.passwordConfirmation = "Repita a senha";
      } else if (password !== passwordConfirmation) {
        errors.passwordConfirmation = "As senhas nao conferem";
      }

      return errors;
    },

    // Os erros que a tela pode EXIBIR agora: so dos campos ja visitados.
    visibleErrors() {
      const visible = {};

      for (const field of Object.keys(this.errors)) {
        if (this.touched[field]) {
          visible[field] = this.errors[field];
        }
      }

      return visible;
    },

    strength() {
      const { password } = this.form;

      // Um ponto para cada criterio atendido.
      let score = 0;

      if (password.length >= 6) score += 1;
      if (password.length >= 10) score += 1;
      if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      if (score <= 2) {
        return { label: "fraca", width: "33%", color: "bg-rose-500" };
      }

      if (score <= 3) {
        return { label: "media", width: "66%", color: "bg-amber-500" };
      }

      return { label: "forte", width: "100%", color: "bg-emerald-500" };
    },

    canSubmit() {
      // Object.keys({}).length === 0 significa "nenhum erro".
      return Object.keys(this.errors).length === 0 && !this.loading;
    },
  },

  methods: {
    markAllTouched() {
      for (const field of Object.keys(this.touched)) {
        this.touched[field] = true;
      }
    },

    async handleSubmit() {
      this.markAllTouched();
      this.errorMessage = "";

      if (Object.keys(this.errors).length > 0) {
        return;
      }

      this.loading = true;

      try {
        await api.register({
          name: this.form.name,
          email: this.form.email,
          password: this.form.password,
          passwordConfirmation: this.form.passwordConfirmation,
        });

        // Manda para o login com um recado e o e-mail ja preenchido.
        const email = encodeURIComponent(this.form.email);

        window.location.replace(`${LOGIN_PAGE}?cadastro=ok&email=${email}`);
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
}).mount("#app");
