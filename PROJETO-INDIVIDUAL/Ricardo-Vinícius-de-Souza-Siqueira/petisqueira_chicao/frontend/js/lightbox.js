// Clique numa imagem (galerias, jantar, costela) para abri-la em tela cheia.
(function () {
    var seletor = '.imagens img, .jantar-imagem img, .costela-imagem img, .galeria img';
    var overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<button class="lb-fechar" aria-label="Fechar">&times;</button><img alt="">';
    document.body.appendChild(overlay);
    var grande = overlay.querySelector('img');

    function abrir(img) {
        grande.src = img.currentSrc || img.src;
        grande.alt = img.alt || '';
        overlay.classList.add('aberto');
        document.body.style.overflow = 'hidden';
    }
    function fechar() {
        overlay.classList.remove('aberto');
        document.body.style.overflow = '';
        grande.removeAttribute('src');
    }
    document.querySelectorAll(seletor).forEach(function (img) {
        img.addEventListener('click', function () { abrir(img); });
    });
    overlay.addEventListener('click', function (e) { if (e.target !== grande) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
})();
