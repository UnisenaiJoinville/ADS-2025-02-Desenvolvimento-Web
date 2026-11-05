// Desenha os icones do Lucide (Aula 60).
//
// O script do Lucide procura todo <i data-lucide="nome"> da pagina e
// troca por um <svg>. Ele so enxerga o que JA existe no HTML: sempre
// que um innerHTML criar icones novos, esta funcao precisa rodar de novo.
export function renderIcons() {
    // "?." -> se o CDN falhar, a tela continua funcionando, so sem icones.
    window.lucide?.createIcons({
      // Icone decorativo nao deve ser lido pelo leitor de tela:
      // o texto ou o aria-label do botao ja dizem o que ele faz.
      attrs: { "aria-hidden": "true" },
    });
  }