// Desenha os icones do Lucide (Aula 60).
// O Lucide so enxerga o que JA existe no HTML: sempre que um innerHTML
// criar icones novos, esta funcao precisa rodar de novo.
export function renderIcons() {
  // "?." -> se o CDN falhar, a tela continua funcionando, so sem icones.
  window.lucide?.createIcons({
    attrs: { "aria-hidden": "true" },
  });
}
