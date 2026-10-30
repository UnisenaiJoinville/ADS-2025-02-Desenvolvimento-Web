import { api } from "./api.js";
import { HOME_PAGE, redirectIfAuthenticated, saveSession } from "./auth.js";
import { renderIcons } from "./icons.js";

// O CDN do Vue publica tudo dentro da variavel global "Vue".
const { createApp } = Vue;

// Quem ja tem sessao nao precisa ver esta tela.
redirectIfAuthenticated();

// Os icones viram <svg> ANTES de o Vue ler o HTML. Assim o Vue
// enxerga o desenho pronto e nunca briga com o Lucide pelo DOM.
renderIcons();

createApp({
  // data() devolve o ESTADO da tela. Tudo que esta aqui e reativo:
  // mudou o valor, o HTML se redesenha sozinho.
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
      showPassword: false,
      capsLockOn: false,
      loading: false,
      errorMessage: "",
      successMessage: "",
    };
  },

  // computed: valores DERIVADOS do estado. O Vue recalcula
  // automaticamente quando alguma peca usada aqui muda.
  computed: {
    canSubmit() {
      return (
        this.form.email.trim() !== "" &&
        this.form.password !== "" &&
        !this.loading
      );
    },
  },

  // mounted() roda uma vez, logo depois que a tela aparece.
  mounted() {
    // A tela de cadastro nos manda para ca com ?cadastro=ok
    const params = new URLSearchParams(window.location.search);

    if (params.get("cadastro") === "ok") {
      this.successMessage = "Conta criada com sucesso! Agora e so entrar.";
      this.form.email = params.get("email") ?? "";
    }
  },

  methods: {
    // getModifierState pergunta ao navegador como estao as teclas
    // especiais NO MOMENTO deste evento de teclado.
    checkCapsLock(event) {
      this.capsLockOn = event.getModifierState?.("CapsLock") ?? false;
    },

    fillDemo() {

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

        // replace() troca a pagina SEM deixar o login no historico:
        // o botao "voltar" nao devolve o usuario para ca.
        window.location.replace(HOME_PAGE);
      } catch (error) {
        this.errorMessage = error.message;
        this.form.password = "";
      } finally {
        // finally roda deu certo ou deu errado - o botao sempre destrava.
        this.loading = false;
      }
    },
  },
}).mount("#app");