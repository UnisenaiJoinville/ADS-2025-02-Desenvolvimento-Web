// ==========================================================
// CONFIGURAÇÃO DA API
// ==========================================================
// Como você está usando o XAMPP, o backend roda pelo Apache dele.
// Isso pressupõe que você colocou a pasta "petisqueira_chicao"
// inteira dentro de C:\xampp\htdocs\ — assim o endereço fica:
// http://localhost/petisqueira_chicao/php-backend
//
// Se você mudar o nome da pasta dentro de htdocs, ajuste aqui também.
//
// Quando for publicar o site de verdade na internet, troque este
// endereço pela URL real do backend, por exemplo:
// const API_URL = "https://seusite.com/php-backend";
// ==========================================================

const API_URL = "http://localhost/petisqueira_chicao/php-backend";

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
