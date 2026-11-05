// Configuracao do Tailwind (Aula 69).
// "export default" porque o projeto usa "type": "module" no package.json.
/** @type {import('tailwindcss').Config} */
export default {
  // ONDE procurar classes: o HTML e tambem o JS, que monta HTML em template strings.
  content: ["./public/**/*.html", "./public/js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [],
};
