// Configuracao do Tailwind (Aula 69).
// "export default" porque o projeto usa "type": "module" no package.json.

/** @type {import('tailwindcss').Config} */
export default {
  // ONDE procurar classes. Nao basta o HTML: varias telas montam
  // HTML dentro do JavaScript (template strings e :class do Vue).
  content: ["./public/**/*.html", "./public/js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [],
};