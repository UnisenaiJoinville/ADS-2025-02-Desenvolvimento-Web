// Executar antes do mount do Vue, ou so em conteudo fora dele.
export function renderIcons(root = document) {
  if (!window.lucide) {
    root.querySelectorAll("i[data-lucide]").forEach((icon) => {
      icon.textContent =
        {
          eye: "Ver",
          "eye-off": "Ocultar",
          pencil: "Editar",
          "trash-2": "Excluir",
          x: "X",
          "chevron-left": "<",
          "chevron-right": ">",
        }[icon.dataset.lucide] ?? "";
      icon.setAttribute("aria-hidden", "true");
    });
    return;
  }
  try {
    window.lucide.createIcons({ root, attrs: { "aria-hidden": "true" } });
  } catch {
    /* Icones sao opcionais. */
  }
}
