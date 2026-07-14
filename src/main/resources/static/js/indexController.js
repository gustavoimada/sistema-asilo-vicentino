document.addEventListener("DOMContentLoaded", function ()
{
  iniciarEntradaInicial();
  iniciarMenu();
  iniciarRotinaAsilo();
  iniciarNoticias();
  iniciarBotoesFinais();
  iniciarTransparencia();
  iniciarAnimacoesScroll();
  iniciarMetricasAnimadas();
  iniciarEfeitosScroll();
});

function iniciarMenu()
{
  const links = document.querySelectorAll('.topbar-nav a[href^="#"]');
  const topbar = document.querySelector(".topbar");
  if (!links.length)
    return;

  const destinos = Array.from(links)
    .map(function (link) {
      const id = link.getAttribute("href").replace("#", "");
      const el = document.getElementById(id);
      return el ? { id, el } : null;
    })
    .filter(Boolean);

  function marcarAtivo(id)
  {
    for (let i = 0; i < links.length; i += 1)
    {
      const href = links[i].getAttribute("href");
      links[i].classList.toggle("active", href === "#" + id);
    }
  }

  function alturaMenu()
  {
    return topbar ? topbar.getBoundingClientRect().height : 80;
  }

  function rolarPara(secao)
  {
    const margem = alturaMenu() + 12;
    const topo = secao.getBoundingClientRect().top + window.scrollY - margem;
    window.scrollTo({
      top: Math.max(topo, 0),
      behavior: "smooth"
    });
  }

  function atualizarPeloScroll()
  {
    if (!destinos.length)
      return;

    let idAtual = destinos[0].id;
    const linha = window.scrollY + alturaMenu() + Math.max(window.innerHeight * 0.18, 96);
    const chegouNoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;

    if (chegouNoFim)
    {
      marcarAtivo(destinos[destinos.length - 1].id);
      return;
    }

    for (let i = 0; i < destinos.length; i += 1)
    {
      if (destinos[i].el.offsetTop <= linha)
      {
        idAtual = destinos[i].id;
      }
    }

    marcarAtivo(idAtual);
  }

  for (let i = 0; i < links.length; i += 1)
  {
    links[i].addEventListener("click", function (e)
    {
      const id = this.getAttribute("href").replace("#", "");
      const secao = document.getElementById(id);
      if (!secao)
        return;

      e.preventDefault();
      marcarAtivo(id);
      rolarPara(secao);
    });
  }

  window.addEventListener("scroll", atualizarPeloScroll, { passive: true });
  atualizarPeloScroll();
}

function iniciarRotinaAsilo()
{
  const passos = document.querySelectorAll(".dayflow-step");
  const imagem = document.getElementById("dayflowImage");
  const horario = document.getElementById("dayflowTime");
  const titulo = document.getElementById("dayflowTitle");
  const texto = document.getElementById("dayflowText");
  let timerAutomatico = null;
  let indiceAtual = 0;

  if (!passos.length || !imagem)
    return;

  function ativarPasso(passo, reiniciarTimer)
  {
    for (let i = 0; i < passos.length; i += 1)
    {
      passos[i].classList.toggle("is-active", passos[i] === passo);
      if (passos[i] === passo) indiceAtual = i;
    }

    imagem.classList.add("is-changing");
    window.setTimeout(function ()
    {
      imagem.src = passo.getAttribute("data-image") || imagem.src;
      imagem.alt = passo.getAttribute("data-title") || "Rotina do asilo";
      imagem.classList.toggle("is-contain", passo.getAttribute("data-fit") === "contain");
      if (horario) horario.textContent = passo.getAttribute("data-time") || horario.textContent;
      if (titulo) titulo.textContent = passo.getAttribute("data-title") || titulo.textContent;
      if (texto) texto.textContent = passo.getAttribute("data-text") || texto.textContent;
      imagem.classList.remove("is-changing");
    }, 150);

    if (reiniciarTimer) iniciarTimer();
  }

  function avancarAutomatico()
  {
    const proximoIndice = (indiceAtual + 1) % passos.length;
    ativarPasso(passos[proximoIndice], false);
  }

  function iniciarTimer()
  {
    if (timerAutomatico) window.clearInterval(timerAutomatico);
    timerAutomatico = window.setInterval(avancarAutomatico, 5600);
  }

  for (let i = 0; i < passos.length; i += 1)
  {
    passos[i].addEventListener("click", function ()
    {
      ativarPasso(this, true);
    });
  }

  iniciarTimer();
}

function iniciarAmpliaNoticias()
{
  const imagens = document.querySelectorAll(".js-news-zoom");
  const modal = document.getElementById("newsLightbox");
  const corpo = document.getElementById("newsLightboxBody");
  const imgModal = document.getElementById("newsLightboxImage");
  const legenda = document.getElementById("newsLightboxCaption");
  const btnZoom = document.getElementById("toggleNewsZoom");
  const btnFechar = document.getElementById("closeNewsLightbox");

  if (!imagens.length || !modal || !corpo || !imgModal || !legenda || !btnZoom || !btnFechar) return;

  function ajustarZoomNatural(ativo) {
    corpo.classList.toggle("is-natural", ativo);
    btnZoom.textContent = ativo ? "Ajustar na tela" : "Tamanho original";
  }

  function abrir(img) {
    imgModal.src = img.src;
    imgModal.alt = img.alt || "Imagem ampliada";

    let textoLegenda = "Imagem ampliada";
    const card = img.closest("article");
    if (card) {
      const titulo = card.querySelector("h4");
      if (titulo) textoLegenda = titulo.textContent;
    }
    legenda.textContent = textoLegenda;

    modal.hidden = false;
    document.body.classList.add("lightbox-open");
    ajustarZoomNatural(false);
  }

  function fechar() {
    modal.hidden = true;
    document.body.classList.remove("lightbox-open");
    imgModal.src = "";
    legenda.textContent = "";
    ajustarZoomNatural(false);
  }

  for (let i = 0; i < imagens.length; i += 1) {
    imagens[i].addEventListener("click", function () {
      abrir(this);
    });
  }

  btnZoom.addEventListener("click", function (e) {
    e.stopPropagation();
    ajustarZoomNatural(!corpo.classList.contains("is-natural"));
  });

  imgModal.addEventListener("click", function (e) {
    e.stopPropagation();
    ajustarZoomNatural(!corpo.classList.contains("is-natural"));
  });

  btnFechar.addEventListener("click", fechar);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) fechar();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) fechar();
  });
}

function iniciarNoticias() {
  const grid = document.getElementById("newsGrid");
  const btnVoltar = document.querySelector('.news-actions .circle-btn[data-news-dir="prev"]');
  const btnAvancar = document.querySelector('.news-actions .circle-btn[data-news-dir="next"]');

  iniciarAmpliaNoticias();
  if (grid) marcarElementosAnimados(grid.querySelectorAll(".news-card"));
  if (!grid || !btnVoltar || !btnAvancar) return;

  function passo() {
    const card = grid.querySelector(".news-card");
    if (!card) return grid.clientWidth * 0.9;
    const espacamento = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 24;
    return card.getBoundingClientRect().width + espacamento;
  }

  function atualizarBotoes() {
    const max = grid.scrollWidth - grid.clientWidth;
    btnVoltar.disabled = grid.scrollLeft <= 4;
    btnAvancar.disabled = grid.scrollLeft >= max - 4;
  }

  btnVoltar.addEventListener("click", function () {
    grid.scrollBy({ left: -passo(), behavior: "smooth" });
  });

  btnAvancar.addEventListener("click", function () {
    grid.scrollBy({ left: passo(), behavior: "smooth" });
  });

  grid.addEventListener("scroll", atualizarBotoes, { passive: true });
  window.addEventListener("resize", atualizarBotoes);
  new MutationObserver(atualizarBotoes).observe(grid, { childList: true });
  atualizarBotoes();
}

function iniciarBotoesFinais() {
  const botaoDoarTopo = document.getElementById("btnDoarTopo");
  const botaoDoacao = document.getElementById("abrirDoacao");
  const painelDoacao = document.getElementById("painelDoacao");
  const inputValorDoacao = document.getElementById("doacaoValor");
  const chipsValorDoacao = document.querySelectorAll(".js-doacao-valor");
  const impactoDoacao = document.getElementById("doacaoImpacto");
  const formDoacaoPublica = document.getElementById("formDoacaoPublica");
  const inputCpfDoacao = document.getElementById("doacaoCpf");

  if (!painelDoacao) return;

  function atualizarImpactoDoacao(valor)
  {
    if (!impactoDoacao) return;

    let dados = {
      icone: "volunteer_activism",
      titulo: "Sua ajuda vira cuidado direto",
      texto: "Escolha um valor para ver uma ideia de como a contribuicao pode apoiar a rotina do asilo."
    };

    if (valor >= 200) {
      dados = {
        icone: "construction",
        titulo: "Ajuda em melhorias do asilo",
        texto: "Pode reforcar reparos, manutencao e melhorias de conforto para os residentes."
      };
    } else if (valor >= 100) {
      dados = {
        icone: "local_hospital",
        titulo: "Fortalece saude e seguranca",
        texto: "Apoia itens de cuidado, higiene e organizacao usados no acompanhamento diario."
      };
    } else if (valor >= 60) {
      dados = {
        icone: "restaurant",
        titulo: "Apoia alimentacao e rotina",
        texto: "Contribui com necessidades do dia a dia, alimentacao e pequenos materiais de cuidado."
      };
    } else if (valor >= 30) {
      dados = {
        icone: "diversity_1",
        titulo: "Cria momentos de convivencia",
        texto: "Ajuda em atividades, encontros e detalhes que deixam a rotina mais leve."
      };
    }

    impactoDoacao.innerHTML = `
      <span class="material-symbols-outlined">${dados.icone}</span>
      <div>
        <strong>${dados.titulo}</strong>
        <p>${dados.texto}</p>
      </div>
    `;
  }

  function prepararPainelDoacao()
  {
    const formPublica = document.getElementById("formDoacaoPublica");
    const sucessoMsg = document.getElementById("doacaoSucessoMsg");
    if (formPublica) formPublica.hidden = false;
    if (sucessoMsg) sucessoMsg.classList.remove("is-visible");
    atualizarImpactoDoacao(Number((inputValorDoacao?.value || "0").replace(",", ".")) || 0);
  }

  function abrirDoacao() {
    const secaoDoacao = document.getElementById("doacao");
    if (secaoDoacao) {
      secaoDoacao.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    painelDoacao.hidden = false;
    prepararPainelDoacao();
  }

  if (botaoDoacao) {
    botaoDoacao.addEventListener("click", abrirDoacao);
  }

  for (let i = 0; i < chipsValorDoacao.length; i += 1) {
    chipsValorDoacao[i].addEventListener("click", function () {
      if (!inputValorDoacao) return;
      const valor = this.getAttribute("data-value");
      if (!valor) return;

      inputValorDoacao.value = valor;
      for (let j = 0; j < chipsValorDoacao.length; j += 1) {
        chipsValorDoacao[j].classList.toggle("is-active", chipsValorDoacao[j] === this);
      }
      atualizarImpactoDoacao(Number(valor));
      inputValorDoacao.focus();
    });
  }

  if (inputValorDoacao) {
    inputValorDoacao.addEventListener("input", function () {
      const valorDigitado = Number((inputValorDoacao.value || "0").replace(",", ".")) || 0;
      atualizarImpactoDoacao(valorDigitado);
      for (let i = 0; i < chipsValorDoacao.length; i += 1) {
        chipsValorDoacao[i].classList.toggle("is-active", Number(chipsValorDoacao[i].getAttribute("data-value")) === valorDigitado);
      }
    });
  }

  if (botaoDoarTopo) {
    botaoDoarTopo.addEventListener("click", abrirDoacao);
  }

  if (formDoacaoPublica) {
    formDoacaoPublica.addEventListener("submit", enviarFormularioDoacaoDoador);
  }

  if (inputCpfDoacao) {
    inputCpfDoacao.addEventListener("input", function (event) {
      event.target.value = formatarCpfDoacao(event.target.value);
    });
  }

  atualizarImpactoDoacao(0);
}

let transparenciaPastas = [];

function eventoTransparenciaPublica(arquivo) {
  const evento = String(arquivo?.evento || "").trim();
  return evento || "Outros";
}

function mesTransparenciaPublica(arquivo) {
  const numero = Number(arquivo?.mes || 0);
  if (Number.isInteger(numero) && numero >= 1 && numero <= 12) {
    return numero;
  }
  return 1;
}

function nomeMesTransparenciaPublica(mes) {
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ];
  return nomes[Number(mes) - 1] || "Mês não informado";
}

function rotuloMesTransparenciaPublica(mes) {
  const numero = mesTransparenciaPublica({ mes });
  return `${String(numero).padStart(2, "0")} - ${nomeMesTransparenciaPublica(numero)}`;
}

function nomeExibicaoArquivoTransparenciaPublica(arquivo) {
  const nome = String(arquivo?.nomeArquivo || "Documento PDF").trim();
  return nome.replace(/^[0-9][a-z0-9]{9,}-/i, "") || "Documento PDF";
}

function formatarDataUploadTransparenciaPublica(valor) {
  if (!valor) return "Data nao informada";

  const texto = String(valor).trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(texto)) {
    const dataComFuso = new Date(texto);
    if (!Number.isNaN(dataComFuso.getTime())) {
      const partesFuso = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(dataComFuso);
      const mapa = {};
      partesFuso.forEach(function (parte) {
        mapa[parte.type] = parte.value;
      });
      const data = `${mapa.day}/${mapa.month}/${mapa.year}`;
      const hora = `${mapa.hour}:${mapa.minute}`;
      if (hora && hora !== "00:00") {
        return `${data} as ${hora}`;
      }
      return data;
    }
  }

  const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (partes) {
    const data = `${partes[3]}/${partes[2]}/${partes[1]}`;
    const hora = partes[4] && partes[5] ? `${partes[4]}:${partes[5]}` : "";
    if (hora && hora !== "00:00") {
      return `${data} as ${hora}`;
    }
    return data;
  }

  return texto.replace("T", " ").replace(/Z$/i, "");
}

function prepararArquivoTransparenciaPublica(arquivo) {
  const idArquivo = Number(arquivo?.idTransparencia || arquivo?.id || 0);
  const mes = mesTransparenciaPublica(arquivo);
  return {
    ...arquivo,
    idTransparencia: idArquivo,
    evento: eventoTransparenciaPublica(arquivo),
    mes,
    mesNome: nomeMesTransparenciaPublica(mes),
    mesRotulo: rotuloMesTransparenciaPublica(mes),
    nomeExibicao: nomeExibicaoArquivoTransparenciaPublica(arquivo),
    dataUploadFormatada: formatarDataUploadTransparenciaPublica(arquivo?.dataUpload),
    url: `/transparencia/download/${idArquivo}`
  };
}

function agruparTransparenciaPublicaPorAnoMesEEvento(arquivos) {
  const pastas = [];

  arquivos.forEach(function (item) {
    const arquivo = prepararArquivoTransparenciaPublica(item);
    if (!arquivo.idTransparencia) return;

    const ano = String(arquivo.ano || "Sem ano");
    let pasta = pastas.find(function (p) {
      return p.ano === ano;
    });
    if (!pasta) {
      pasta = { ano, meses: [], arquivos: [] };
      pastas.push(pasta);
    }

    pasta.arquivos.push(arquivo);

    let mes = pasta.meses.find(function (p) {
      return Number(p.mes) === Number(arquivo.mes);
    });
    if (!mes) {
      mes = { mes: arquivo.mes, nome: arquivo.mesNome, rotulo: arquivo.mesRotulo, eventos: [], arquivos: [] };
      pasta.meses.push(mes);
      pasta.meses.sort(function (a, b) {
        return Number(b.mes) - Number(a.mes);
      });
    }

    mes.arquivos.push(arquivo);

    let evento = mes.eventos.find(function (p) {
      return p.evento.toLowerCase() === arquivo.evento.toLowerCase();
    });
    if (!evento) {
      evento = { evento: arquivo.evento, arquivos: [] };
      mes.eventos.push(evento);
    }

    evento.arquivos.push(arquivo);
  });

  return pastas;
}

function renderizarTransparenciaLegado(filtro = "") {
  const lista = document.getElementById("listaTransparencia");
  if (!lista) return;

  const termo = filtro
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const pastasFiltradas = transparenciaPastas
    .map(function (pasta) {
      const eventosOriginais = Array.isArray(pasta.eventos) && pasta.eventos.length
        ? pasta.eventos
        : [{ evento: "Outros", arquivos: pasta.arquivos || [] }];
      const eventos = eventosOriginais
        .map(function (evento) {
          const arquivos = (evento.arquivos || []).filter(function (arquivo) {
            const alvo = `${pasta.ano} ${evento.evento || ""} ${arquivo.nomeArquivo || ""} ${arquivo.nomeExibicao || ""} ${arquivo.caminhoArquivo || ""}`
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            return !termo || alvo.includes(termo);
          });
          return { evento: evento.evento || "Outros", arquivos };
        })
        .filter(function (evento) {
          return evento.arquivos.length > 0;
        });
      return { ano: pasta.ano, eventos };
    })
    .filter(function (pasta) {
      return pasta.eventos.length > 0;
    });

  if (!pastasFiltradas.length) {
    lista.innerHTML = '<p class="transparencia-empty">Nenhum documento de transparência encontrado.</p>';
    return;
  }

  lista.innerHTML = pastasFiltradas.map(function (pasta, index) {
    const eventos = pasta.eventos.map(function (evento) {
      const arquivos = evento.arquivos.map(function (arquivo) {
        return `
          <a class="transparencia-file" href="${arquivo.url}" download>
            <span class="material-symbols-outlined">picture_as_pdf</span>
            <span class="transparencia-file-info">
              <strong>${arquivo.nomeExibicao || "Documento PDF"}</strong>
              <span>${arquivo.dataUploadFormatada || "Data nao informada"}</span>
            </span>
            <span class="material-symbols-outlined">download</span>
          </a>
        `;
      }).join("");

      return `
        <section class="transparencia-event">
          <h4>${evento.evento || "Outros"}</h4>
          <div class="transparencia-files">${arquivos}</div>
        </section>
      `;
    }).join("");

    return `
      <details class="transparencia-year">
        <summary>
          <span class="material-symbols-outlined">folder</span>
          <span>${pasta.ano}</span>
          <span class="material-symbols-outlined expand">expand_more</span>
        </summary>
        <div class="transparencia-events">${eventos}</div>
      </details>
    `;
  }).join("");
}

function renderizarTransparencia(filtro = "") {
  const lista = document.getElementById("listaTransparencia");
  if (!lista) return;

  const termo = filtro
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const pastasFiltradas = transparenciaPastas
    .map(function (pasta) {
      const mesesOriginais = Array.isArray(pasta.meses) && pasta.meses.length
        ? pasta.meses
        : [{ mes: 1, nome: "Janeiro", rotulo: "01 - Janeiro", eventos: [{ evento: "Outros", arquivos: pasta.arquivos || [] }], arquivos: pasta.arquivos || [] }];

      const meses = mesesOriginais
        .map(function (mes) {
          const eventosOriginais = Array.isArray(mes.eventos) && mes.eventos.length
            ? mes.eventos
            : [{ evento: "Outros", arquivos: mes.arquivos || [] }];

          const eventos = eventosOriginais
            .map(function (evento) {
              const arquivos = (evento.arquivos || []).filter(function (arquivo) {
                const alvo = `${pasta.ano} ${mes.rotulo || ""} ${mes.nome || ""} ${evento.evento || ""} ${arquivo.nomeArquivo || ""} ${arquivo.nomeExibicao || ""} ${arquivo.caminhoArquivo || ""}`
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase();
                return !termo || alvo.includes(termo);
              });
              return { evento: evento.evento || "Outros", arquivos };
            })
            .filter(function (evento) {
              return evento.arquivos.length > 0;
            });

          return { ...mes, eventos };
        })
        .filter(function (mes) {
          return mes.eventos.length > 0;
        });

      return { ano: pasta.ano, meses, arquivos: pasta.arquivos || [] };
    })
    .filter(function (pasta) {
      return pasta.meses.length > 0;
    });

  if (!pastasFiltradas.length) {
    lista.innerHTML = '<p class="transparencia-empty">Nenhum documento de transparencia encontrado.</p>';
    return;
  }

  lista.innerHTML = pastasFiltradas.map(function (pasta, index) {
    const meses = pasta.meses.map(function (mes) {
      const eventos = mes.eventos.map(function (evento) {
        const arquivos = evento.arquivos.map(function (arquivo) {
          return `
            <a class="transparencia-file" href="${arquivo.url}" download>
              <span class="material-symbols-outlined">picture_as_pdf</span>
              <span class="transparencia-file-info">
                <strong>${arquivo.nomeExibicao || "Documento PDF"}</strong>
                <span>${arquivo.dataUploadFormatada || "Data nao informada"}</span>
              </span>
              <span class="material-symbols-outlined transparencia-file-action">download</span>
            </a>
          `;
        }).join("");

        return `
          <section class="transparencia-event">
            <h4>${evento.evento || "Outros"}</h4>
            <div class="transparencia-files">${arquivos}</div>
          </section>
        `;
      }).join("");

      const totalMes = mes.eventos.reduce(function (total, evento) {
        return total + (evento.arquivos || []).length;
      }, 0);

      return `
        <section class="transparencia-month">
          <div class="transparencia-month-head">
            <span class="material-symbols-outlined">calendar_month</span>
            <div>
              <strong>${mes.rotulo || rotuloMesTransparenciaPublica(mes.mes)}</strong>
              <span>Documentos de ${mes.nome || nomeMesTransparenciaPublica(mes.mes)}</span>
            </div>
            <small>${totalMes} PDF(s)</small>
          </div>
          <div class="transparencia-events">${eventos}</div>
        </section>
      `;
    }).join("");

    return `
      <details class="transparencia-year">
        <summary>
          <span class="material-symbols-outlined">folder</span>
          <span>${pasta.ano}</span>
          <small class="year-meta">${(pasta.arquivos || []).length} documento(s)</small>
          <span class="material-symbols-outlined expand">expand_more</span>
        </summary>
        <div class="transparencia-months">${meses}</div>
      </details>
    `;
  }).join("");
}

function iniciarTransparencia() {
  const lista = document.getElementById("listaTransparencia");
  const busca = document.getElementById("buscaTransparencia");
  if (!lista) return;

  fetch("/transparencia/listar")
    .then(function (resposta) {
      if (!resposta.ok) throw new Error("Falha ao listar transparencia");
      return resposta.json();
    })
    .then(function (arquivos) {
      transparenciaPastas = Array.isArray(arquivos) ? agruparTransparenciaPublicaPorAnoMesEEvento(arquivos) : [];
      renderizarTransparencia(busca?.value || "");
    })
    .catch(function () {
      lista.innerHTML = '<p class="transparencia-empty">Não foi possível carregar os documentos agora.</p>';
    });

  busca?.addEventListener("input", function () {
    renderizarTransparencia(busca.value || "");
  });
}

function iniciarMetricasAnimadas() {
  const numeros = document.querySelectorAll(".js-countup");
  const metaDoacao = document.querySelector(".donation-goal");

  function formatarNumero(valor) {
    return new Intl.NumberFormat("pt-BR").format(Math.round(valor));
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(valor);
  }

  function animarValor(inicial, final, duracao, callback) {
    const inicio = performance.now();
    function frame(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const eased = 1 - Math.pow(1 - progresso, 3);
      const valor = inicial + (final - inicial) * eased;
      callback(valor, progresso);
      if (progresso < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function animarNumero(el) {
    if (el.dataset.animated === "1") return;
    el.dataset.animated = "1";
    const alvo = Number(el.getAttribute("data-count") || "0");
    const prefixo = el.getAttribute("data-prefix") || "";
    const sufixo = el.getAttribute("data-suffix") || "";
    animarValor(0, alvo, 2400, function (valor) {
      el.textContent = prefixo + formatarNumero(valor) + sufixo;
    });
  }

  function animarMetaDoacao(el) {
    if (!el || el.dataset.animated === "1") return;
    el.dataset.animated = "1";

    const atual = Number(el.getAttribute("data-current") || "0");
    const meta = Number(el.getAttribute("data-goal") || "1");
    const porcentagem = Math.max(0, Math.min((atual / meta) * 100, 100));
    const valorAtual = el.querySelector(".js-donation-current");
    const valorMeta = el.querySelector(".js-donation-goal");
    const barra = el.querySelector(".js-donation-fill");
    const faltante = el.querySelector(".js-donation-left");
    const progresso = el.querySelector(".donation-goal-bar");

    if (valorMeta) valorMeta.textContent = formatarMoeda(meta);

    animarValor(0, atual, 2600, function (valor, perc) {
      if (valorAtual) valorAtual.textContent = formatarMoeda(valor);
      if (barra) barra.style.width = (porcentagem * perc).toFixed(1) + "%";
      if (progresso) progresso.setAttribute("aria-valuenow", (porcentagem * perc).toFixed(0));
    });

    if (faltante) {
      const restante = Math.max(meta - atual, 0);
      faltante.textContent = "Faltam " + formatarMoeda(restante) + " para bater a meta.";
    }
  }

  // Mantém os indicadores em zero até a seção entrar na tela.
  for (let i = 0; i < numeros.length; i += 1) {
    const prefixo = numeros[i].getAttribute("data-prefix") || "";
    const sufixo = numeros[i].getAttribute("data-suffix") || "";
    numeros[i].textContent = prefixo + formatarNumero(0) + sufixo;
  }

  if (!("IntersectionObserver" in window)) {
    for (let i = 0; i < numeros.length; i += 1) animarNumero(numeros[i]);
    animarMetaDoacao(metaDoacao);
    return;
  }

  const observer = new IntersectionObserver(function (entradas) {
    for (let i = 0; i < entradas.length; i += 1) {
      if (!entradas[i].isIntersecting) continue;
      if (entradas[i].target.classList.contains("js-countup")) animarNumero(entradas[i].target);
      if (entradas[i].target.classList.contains("donation-goal")) animarMetaDoacao(entradas[i].target);
      observer.unobserve(entradas[i].target);
    }
  }, { threshold: 0.25 });

  for (let i = 0; i < numeros.length; i += 1) observer.observe(numeros[i]);
  if (metaDoacao) observer.observe(metaDoacao);
}

function marcarElementosAnimados(elementos) {
  if (!elementos.length) return;

  for (let i = 0; i < elementos.length; i += 1) {
    elementos[i].classList.add("reveal-on-scroll");
    const possuiAtrasoMobile = elementos[i].matches(".history-mobile-summary, .history-mobile-metrics span, #btnEnviarDoacao");
    if (!elementos[i].style.getPropertyValue("--reveal-delay") && !possuiAtrasoMobile) {
      elementos[i].style.setProperty("--reveal-delay", ((i % 3) * 80) + "ms");
    }
  }
}

function iniciarAnimacoesScroll() {
  const elementos = document.querySelectorAll(".section-head-left, .section-head-center, .dayflow, .testimonial-card, .cta-box, .history-photo, .history-stat-card, .history-blue-card, .history-mobile-summary, .history-mobile-metrics span, .cta-impact-card, .cta-panel, #btnEnviarDoacao");
  marcarElementosAnimados(elementos);

  function atualizarVisibilidade() {
    const animados = document.querySelectorAll(".reveal-on-scroll");
    for (let i = 0; i < animados.length; i += 1) {
      const rect = animados[i].getBoundingClientRect();
      const alturaTela = window.innerHeight || document.documentElement.clientHeight;
      const entrouNaArea = rect.top <= alturaTela * 0.88 && rect.bottom >= alturaTela * 0.12;
      if (entrouNaArea) {
        animados[i].classList.add("is-visible");
      }
    }
  }

  let agendado = false;
  function agendarAtualizacao() {
    if (agendado) return;
    agendado = true;
    window.requestAnimationFrame(function () {
      agendado = false;
      atualizarVisibilidade();
    });
  }

  window.addEventListener("scroll", agendarAtualizacao, { passive: true });
  window.addEventListener("resize", agendarAtualizacao);
  agendarAtualizacao();
}

function iniciarEfeitosScroll() {
  const barra = document.getElementById("scrollProgress");
  const heroFoto = document.querySelector(".hero-photo");
  const cardFlutuante = document.querySelector(".hero-floating-card");

  function atualizar() {
    const alturaDocumento = document.documentElement.scrollHeight - window.innerHeight;
    const progresso = alturaDocumento > 0 ? (window.scrollY / alturaDocumento) * 100 : 0;
    if (barra) barra.style.width = progresso.toFixed(2) + "%";

    const deslocamento = Math.min(window.scrollY, 520);
    if (heroFoto) {
      heroFoto.style.transform = `rotate(2deg) translate(18px, ${deslocamento * 0.025}px)`;
    }
    if (cardFlutuante) {
      cardFlutuante.style.transform = `translateY(${-deslocamento * 0.045}px)`;
    }
  }

  let agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    window.requestAnimationFrame(function () {
      agendado = false;
      atualizar();
    });
  }

  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  atualizar();
}

function iniciarEntradaInicial() {
  const alvos = [];
  const menuBrand = document.querySelector(".topbar-brand");
  const menuNav = document.querySelector(".topbar-nav");
  const menuActions = document.querySelector(".topbar-actions");
  const heroEyebrow = document.querySelector(".hero-copy .eyebrow");
  const heroTitulo = document.querySelector(".hero-copy h1");
  const heroTexto = document.querySelector(".hero-copy p");
  const heroDoacao = document.getElementById("btnDoarTopo");
  const heroVisual = document.querySelector(".hero-visual");
  const heroFloatCard = document.querySelector(".hero-floating-card");

  if (menuBrand) alvos.push(menuBrand);
  if (menuNav) alvos.push(menuNav);
  if (menuActions) alvos.push(menuActions);
  if (heroEyebrow) alvos.push(heroEyebrow);
  if (heroTitulo) alvos.push(heroTitulo);
  if (heroTexto) alvos.push(heroTexto);
  if (heroDoacao) alvos.push(heroDoacao);
  if (heroVisual) alvos.push(heroVisual);
  if (heroFloatCard) alvos.push(heroFloatCard);

  for (let i = 0; i < alvos.length; i += 1) {
    alvos[i].classList.add("intro-reveal");
    alvos[i].style.setProperty("--intro-delay", (i * 90) + "ms");
  }

  window.setTimeout(function () {
    for (let i = 0; i < alvos.length; i += 1) {
      alvos[i].classList.remove("intro-reveal");
      alvos[i].style.removeProperty("--intro-delay");
    }

    const hero = document.querySelector(".hero");
    if (hero) hero.classList.add("hero-motion-ready");
  }, 1550);
}

function validarCpfDoacao(cpf) {
  if (!cpf || cpf.trim() === "") return true; // CPF é opcional
  const valor = cpf.replace(/\D/g, "");
  if (valor.length !== 11 || /(\d)\1{10}/.test(valor)) return false;
  let soma = 0;
  let peso = 10;
  for (let i = 0; i < 9; i += 1) soma += Number(valor[i]) * peso--;
  let digito1 = 11 - (soma % 11);
  if (digito1 >= 10) digito1 = 0;
  soma = 0;
  peso = 11;
  for (let i = 0; i < 10; i += 1) soma += Number(valor[i]) * peso--;
  let digito2 = 11 - (soma % 11);
  if (digito2 >= 10) digito2 = 0;
  return digito1 === Number(valor[9]) && digito2 === Number(valor[10]);
}

function formatarCpfDoacao(cpf) {
  const numeros = cpf.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mostrarNotificacaoDoacaoDoador(tipo, mensagem) {
  const toast = document.createElement("div");
  toast.className = `popup-msg ${tipo} show`;
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function enviarFormularioDoacaoDoador(event) {
  event.preventDefault();

  const inputNome = document.getElementById("doacaoNome");
  const inputEmail = document.getElementById("doacaoEmail");
  const inputCpf = document.getElementById("doacaoCpf");
  const inputValor = document.getElementById("doacaoValor");
  const inputMsg = document.getElementById("doacaoMsg");
  const botaoEnviar = document.getElementById("btnEnviarDoacao");

  // Validações
  const nome = (inputNome?.value || "").trim();
  const email = (inputEmail?.value || "").trim();
  const cpf = (inputCpf?.value || "").trim();
  const valor = parseFloat(String(inputValor?.value || "0").replace(",", "."));
  const observacoes = (inputMsg?.value || "").trim();

  if (!nome) {
    mostrarNotificacaoDoacaoDoador("error", "Nome é obrigatório.");
    inputNome?.focus();
    return;
  }

  if (nome.length > 45) {
    mostrarNotificacaoDoacaoDoador("error", "Nome deve ter até 45 caracteres.");
    inputNome?.focus();
    return;
  }

  if (!email) {
    mostrarNotificacaoDoacaoDoador("error", "E-mail é obrigatório.");
    inputEmail?.focus();
    return;
  }

  if (!valor || valor <= 0) {
    mostrarNotificacaoDoacaoDoador("error", "Valor deve ser maior que zero.");
    inputValor?.focus();
    return;
  }

  if (cpf && !validarCpfDoacao(cpf)) {
    mostrarNotificacaoDoacaoDoador("error", "CPF inválido.");
    inputCpf?.focus();
    return;
  }

  if (observacoes.length > 45) {
    mostrarNotificacaoDoacaoDoador("error", "Mensagem deve ter até 45 caracteres.");
    inputMsg?.focus();
    return;
  }

  if (botaoEnviar) {
    botaoEnviar.disabled = true;
    botaoEnviar.dataset.originalText = botaoEnviar.innerHTML;
    botaoEnviar.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>Enviando...';
  }

  // Monta os dados
  const agora = new Date();
  const dataAtual = agora.getFullYear() + "-"
    + String(agora.getMonth() + 1).padStart(2, "0") + "-"
    + String(agora.getDate()).padStart(2, "0") + " "
    + String(agora.getHours()).padStart(2, "0") + ":"
    + String(agora.getMinutes()).padStart(2, "0") + ":"
    + String(agora.getSeconds()).padStart(2, "0");

  const params = new URLSearchParams({
    valor: valor,
    tipo: "Financeiro",
    cpfDoador: cpf,
    nomeDoador: nome,
    dtDoacao: dataAtual,
    observacoes: observacoes,
    pagEmail: email
  });

  fetch("/doacao/cadastrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: params.toString()
  })
    .then(function (response) {
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        return response.json().then(data => {
          return { ok: response.ok, status: response.status, data: data };
        });
      } else {
        return response.text().then(text => {
          return { ok: response.ok, status: response.status, data: text };
        });
      }
    })
    .then(function (resultado) {
      if (!resultado.ok) {
        const errorMsg = resultado.data?.descricao || resultado.data?.title || (typeof resultado.data === 'string' ? resultado.data : "Erro desconhecido");
        mostrarNotificacaoDoacaoDoador("error", "Erro: " + errorMsg);
        return;
      }

      mostrarNotificacaoDoacaoDoador("success", "Doação registrada. Obrigado pelo apoio!");

      // Limpa o formulário
      inputNome.value = "";
      inputEmail.value = "";
      inputCpf.value = "";
      inputValor.value = "";
      inputMsg.value = "";

      // Esconde o formulário e exibe o bloco de sucesso
      var formPublica = document.getElementById("formDoacaoPublica");
      var sucessoMsg = document.getElementById("doacaoSucessoMsg");
      if (formPublica) formPublica.hidden = true;
      if (sucessoMsg) sucessoMsg.classList.add("is-visible");
    })
    .catch(function (erro) {
      console.error("Erro na doação:", erro);
      mostrarNotificacaoDoacaoDoador("error", "Não foi possível processar a doação. Tente novamente.");
    })
    .finally(function () {
      if (botaoEnviar) {
        botaoEnviar.disabled = false;
        botaoEnviar.innerHTML = botaoEnviar.dataset.originalText || '<span class="material-symbols-outlined">volunteer_activism</span>Fazer doação';
      }
    });
}
