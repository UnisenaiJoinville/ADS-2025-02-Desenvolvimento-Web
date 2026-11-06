(() => {
  const saved = localStorage.getItem("estoque-facil:theme");
  document.documentElement.classList.toggle("dark", saved === "dark");
  window.toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    window.dispatchEvent(new Event("themechange"));
    localStorage.setItem("estoque-facil:theme", dark ? "dark" : "light");
  };
})();
