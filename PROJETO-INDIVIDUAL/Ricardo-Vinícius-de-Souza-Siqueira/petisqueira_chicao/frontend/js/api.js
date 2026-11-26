// ==========================================================
// CONFIGURAÇÃO DA API
// ==========================================================
// O frontend e o backend ficam lado a lado no pacote original.
// A URL relativa evita depender do nome da pasta no XAMPP.
// Em uma hospedagem com estrutura diferente, defina
// window.PETISQUEIRA_API_URL antes deste arquivo.
// ==========================================================

const API_URL = window.PETISQUEIRA_API_URL || new URL("../php-backend", document.baseURI).href.replace(/\/$/, "");

// ==========================================================
// CONTROLE DE SESSÃO (mostra se o usuário está logado)
// ==========================================================
// Em toda página que tiver um link com id="link-conta"
// (o ícone de pessoa no topo): se o usuário já estiver logado,
// o ícone leva para a página "Minha conta" (minhaconta.html),
// onde ele vê os próprios dados e pode sair da conta.
// Se ninguém estiver logado, o link continua indo para login.html.
document.addEventListener("DOMContentLoaded", () => {
    const linkConta = document.getElementById("link-conta");
    if (!linkConta) return;

    const usuarioSalvo = localStorage.getItem("usuario");
    if (!usuarioSalvo) return; // ninguém logado, mantém o link normal (vai pra login.html)

    try {
        const usuario = JSON.parse(usuarioSalvo);
        linkConta.setAttribute("title", `Minha conta — ${usuario.nome}`);
        linkConta.href = "minhaconta.html";
        // Nas páginas com menu de texto (index, jantar, reserva) o link
        // diz "Entrar" e passa a dizer "Minha conta" quando há login.
        if (linkConta.dataset.textoLogado) linkConta.textContent = linkConta.dataset.textoLogado;
    } catch (erro) {
        console.error("Erro ao ler dados do usuário salvo:", erro);
    }
});


// ==========================================================
// CARRINHO DE COMPRAS (fica só no navegador, em localStorage)
// ==========================================================
// Formato guardado: [{ produto_id: 1, quantidade: 2 }, ...]
// O PREÇO nunca é guardado aqui: o servidor consulta o valor real
// de cada produto quando o pedido é criado.
const Carrinho = {
    ler() {
        try {
            const lista = JSON.parse(localStorage.getItem("carrinho") || "[]");
            return Array.isArray(lista) ? lista.filter(i => i && i.produto_id > 0 && i.quantidade > 0) : [];
        } catch (e) {
            return [];
        }
    },
    salvar(lista) {
        try { localStorage.setItem("carrinho", JSON.stringify(lista)); } catch (e) { /* ignora */ }
        Carrinho.atualizarBadge();
    },
    adicionar(produtoId, quantidade) {
        const lista = Carrinho.ler();
        const existente = lista.find(i => i.produto_id === Number(produtoId));
        if (existente) {
            existente.quantidade = Math.min(50, existente.quantidade + Number(quantidade));
        } else {
            lista.push({ produto_id: Number(produtoId), quantidade: Math.min(50, Number(quantidade)) });
        }
        Carrinho.salvar(lista);
    },
    alterar(produtoId, quantidade) {
        const lista = Carrinho.ler()
            .map(i => i.produto_id === Number(produtoId) ? { ...i, quantidade: Math.min(50, Number(quantidade)) } : i)
            .filter(i => i.quantidade > 0);
        Carrinho.salvar(lista);
    },
    remover(produtoId) {
        Carrinho.salvar(Carrinho.ler().filter(i => i.produto_id !== Number(produtoId)));
    },
    limpar() {
        Carrinho.salvar([]);
    },
    totalItens() {
        return Carrinho.ler().reduce((soma, i) => soma + i.quantidade, 0);
    },
    // Mostra a quantidade de itens no ícone da sacola, em todas as páginas
    atualizarBadge() {
        const badge = document.getElementById("carrinho-badge");
        if (!badge) return;
        const total = Carrinho.totalItens();
        badge.textContent = total;
        badge.style.display = total > 0 ? "inline-block" : "none";
    }
};

document.addEventListener("DOMContentLoaded", () => Carrinho.atualizarBadge());
