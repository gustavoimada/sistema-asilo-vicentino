// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
let _lightboxEl = null;
let _lightboxImg = null;
let _lightboxCaption = null;

function _criarLightbox() {
    if (_lightboxEl) return;

    _lightboxEl = document.createElement("div");
    _lightboxEl.className = "news-lightbox";
    _lightboxEl.setAttribute("hidden", "");
    _lightboxEl.setAttribute("role", "dialog");
    _lightboxEl.setAttribute("aria-modal", "true");

    _lightboxEl.innerHTML = `
        <div class="news-lightbox-toolbar">
            <button class="news-lightbox-close" id="newsLightboxClose" aria-label="Fechar">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <div class="news-lightbox-body" id="newsLightboxBody">
            <img id="newsLightboxImg" src="" alt="" />
        </div>
        <div class="news-lightbox-caption" id="newsLightboxCaption">
            <strong id="newsLightboxTitle"></strong>
            <span id="newsLightboxCategoria"></span>
        </div>
    `;

    document.body.appendChild(_lightboxEl);

    _lightboxImg     = _lightboxEl.querySelector("#newsLightboxImg");
    _lightboxCaption = _lightboxEl.querySelector("#newsLightboxCaption");

    // Fechar ao clicar no fundo
    _lightboxEl.addEventListener("click", (e) => {
        if (e.target === _lightboxEl) _fecharLightbox();
    });

    // Fechar no X
    _lightboxEl.querySelector("#newsLightboxClose").addEventListener("click", _fecharLightbox);

    // ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") _fecharLightbox();
    });

    // Zoom ao clicar na imagem
    const body = _lightboxEl.querySelector("#newsLightboxBody");
    _lightboxImg.addEventListener("click", () => {
        body.classList.toggle("is-natural");
    });
}

function _abrirLightbox(src, titulo, categoria) {
    _criarLightbox();
    _lightboxImg.src = src;
    _lightboxImg.alt = titulo || "";
    _lightboxEl.querySelector("#newsLightboxTitle").textContent = titulo || "";
    _lightboxEl.querySelector("#newsLightboxCategoria").textContent = categoria || "";
    _lightboxEl.querySelector("#newsLightboxBody").classList.remove("is-natural");
    _lightboxEl.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
}

function _fecharLightbox() {
    if (!_lightboxEl) return;
    _lightboxEl.setAttribute("hidden", "");
    _lightboxImg.src = "";
    document.body.style.overflow = "";
}

function formatarDataNoticiaIndex(valor) {
    if (!valor) return "";

    const texto = String(valor).trim();
    const partesIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (partesIso) {
        return `${partesIso[3]}/${partesIso[2]}/${partesIso[1]}`;
    }

    const data = new Date(texto);
    if (!Number.isNaN(data.getTime())) {
        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(data);
    }

    return texto;
}

function atualizarUltimaAtualizacaoNoticias(noticias, erro = false) {
    const el = document.getElementById("newsLastUpdate");
    if (!el) return;

    if (erro) {
        el.textContent = "Última atualização: não foi possível verificar";
        return;
    }

    if (!Array.isArray(noticias) || noticias.length === 0) {
        el.textContent = "Última atualização: aguardando publicações";
        return;
    }

    const datas = noticias
        .map(noticia => noticia.dataUpload)
        .filter(Boolean)
        .sort()
        .reverse();

    const dataFormatada = formatarDataNoticiaIndex(datas[0]);
    el.textContent = dataFormatada
        ? `Última atualização: ${dataFormatada}`
        : "Última atualização: notícias em revisão";
}

// ── CARDS ─────────────────────────────────────────────────────────────────────
async function carregarNoticiasIndex() {
    const newsGrid = document.getElementById("newsGrid");
    if (!newsGrid) return;

    try {
        const response = await fetch("/noticia/listar");
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
            throw new Error("Falha ao carregar");
        }

        atualizarUltimaAtualizacaoNoticias(data);

        if (data.length === 0) {
            newsGrid.innerHTML = '<p style="padding: 2rem; color: var(--text-muted);">Nenhuma notícia publicada no momento.</p>';
            return;
        }

        const ultimas = data.slice(0, 9);

        newsGrid.innerHTML = ultimas.map(noticia => {
            const id        = noticia.idNoticia || noticia.id;
            const src       = `/noticia/download/${id}`;
            const titulo    = (noticia.titulo    || "").replace(/"/g, "&quot;");
            const categoria = (noticia.categoria || "Geral").replace(/"/g, "&quot;");
            const descricao = noticia.descricao  || "";

            return `
            <article class="news-card reveal-on-scroll"
                     data-src="${src}"
                     data-titulo="${titulo}"
                     data-categoria="${categoria}"
                     tabindex="0"
                     role="button"
                     aria-label="Ver notícia: ${titulo}">
              <div class="news-card-thumb">
                <img src="${src}" alt="${titulo}" loading="lazy" />
                <div class="news-card-thumb-overlay">
                  <span class="tag">${categoria}</span>
                </div>
              </div>
              <div class="news-card-body">
                <h4>${titulo}</h4>
                <p>${descricao}</p>
              </div>
            </article>`;
        }).join("");

        // Delegar clique nos cards para abrir lightbox
        newsGrid.querySelectorAll(".news-card").forEach(card => {
            const abrir = () => _abrirLightbox(
                card.dataset.src,
                card.dataset.titulo,
                card.dataset.categoria
            );
            card.addEventListener("click", abrir);
            card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") abrir(); });
        });

        // Animação de entrada
        if (typeof window.inicializarZoomNoticias === "function") {
            window.inicializarZoomNoticias();
        }

    } catch (error) {
        atualizarUltimaAtualizacaoNoticias([], true);
        console.error("Erro ao carregar notícias no index:", error);
        newsGrid.innerHTML = '<p style="padding: 2rem; color: var(--text-muted);">Não foi possível carregar as notícias mais recentes.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarNoticiasIndex();
});
