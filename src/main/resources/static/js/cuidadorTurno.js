const estadoCuidadorTurno = {
    idFuncionarioLogado: null,
    idUsuarioLogado: null,
    nomeUsuarioLogado: "",
    nomeFuncionarioLogado: "",
    categoriaFuncionarioLogado: "",
    turnoAtivo: null,
    ultimoTurno: null,
    ultimoTurnoAba: "resumo",
    requisicaoTurnoEmAndamento: false,
    toastTimer: null
};

function carregarContextoUrlTurno()
{
    const params = new URLSearchParams(window.location.search);
    const parametrosContexto = ["idFuncionario", "idUser", "usuarioNome", "funcionarioNome", "categoria"];
    const tinhaContexto = parametrosContexto.some((chave) => params.has(chave));
    const idFuncionarioUrl = Number(params.get("idFuncionario") || 0);
    const idUserUrl = Number(params.get("idUser") || 0);
    const nomeUsuarioUrl = String(params.get("usuarioNome") || "").trim();
    const nomeFuncionarioUrl = String(params.get("funcionarioNome") || "").trim();
    const categoriaUrl = String(params.get("categoria") || "").trim();

    if (Number.isInteger(idFuncionarioUrl) && idFuncionarioUrl > 0)
    {
        estadoCuidadorTurno.idFuncionarioLogado = idFuncionarioUrl;
        localStorage.setItem("idFuncionario", String(idFuncionarioUrl));
    }

    if (Number.isInteger(idUserUrl) && idUserUrl > 0)
    {
        estadoCuidadorTurno.idUsuarioLogado = idUserUrl;
        localStorage.setItem("usuarioId", String(idUserUrl));
    }

    if (nomeUsuarioUrl)
    {
        estadoCuidadorTurno.nomeUsuarioLogado = nomeUsuarioUrl;
        localStorage.setItem("usuarioNome", nomeUsuarioUrl);
    }

    if (nomeFuncionarioUrl)
    {
        estadoCuidadorTurno.nomeFuncionarioLogado = nomeFuncionarioUrl;
        localStorage.setItem("funcionarioNome", nomeFuncionarioUrl);
    }

    if (categoriaUrl)
    {
        estadoCuidadorTurno.categoriaFuncionarioLogado = categoriaUrl;
        localStorage.setItem("funcionarioCategoria", categoriaUrl);
    }

    if (!tinhaContexto || !window.history || typeof window.history.replaceState !== "function")
    {
        return;
    }

    parametrosContexto.forEach((chave) => params.delete(chave));
    const queryRestante = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (queryRestante ? `?${queryRestante}` : "") + window.location.hash);
}

function obterIdFuncionarioLogadoTurno()
{
    if (Number.isInteger(estadoCuidadorTurno.idFuncionarioLogado) && estadoCuidadorTurno.idFuncionarioLogado > 0)
    {
        return estadoCuidadorTurno.idFuncionarioLogado;
    }

    const valor = (localStorage.getItem("idFuncionario") || "").trim();
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function obterIdUsuarioLogadoTurno()
{
    if (Number.isInteger(estadoCuidadorTurno.idUsuarioLogado) && estadoCuidadorTurno.idUsuarioLogado > 0)
    {
        return estadoCuidadorTurno.idUsuarioLogado;
    }

    const valor = (localStorage.getItem("usuarioId") || "").trim();
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function obterNomeUsuarioLogadoTurno()
{
    if (estadoCuidadorTurno.nomeUsuarioLogado && estadoCuidadorTurno.nomeUsuarioLogado.trim() !== "")
    {
        return estadoCuidadorTurno.nomeUsuarioLogado.trim();
    }
    return (localStorage.getItem("usuarioNome") || "").trim();
}

function obterNomeFuncionarioLogadoTurno()
{
    if (estadoCuidadorTurno.nomeFuncionarioLogado && estadoCuidadorTurno.nomeFuncionarioLogado.trim() !== "")
    {
        return estadoCuidadorTurno.nomeFuncionarioLogado.trim();
    }
    return (localStorage.getItem("funcionarioNome") || "").trim();
}

function obterNomePerfilTurno()
{
    const nomeFuncionario = obterNomeFuncionarioLogadoTurno();
    return nomeFuncionario || estadoCuidadorTurno.nomeUsuarioLogado || "Usuário";
}

function obterCategoriaPerfilTurno()
{
    const categoria = estadoCuidadorTurno.categoriaFuncionarioLogado || (localStorage.getItem("funcionarioCategoria") || "").trim();
    if (!categoria) return "Cuidador(a)";
    return formatarCargoInclusivoTurno(categoria);
}

function formatarCargoInclusivoTurno(categoria)
{
    const valor = String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretária";
    const texto = String(categoria || "").trim();
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : "Acesso";
}

async function parseJsonSeguraTurno(response)
{
    try
    {
        return await response.json();
    }
    catch (e)
    {
        return {};
    }
}

async function carregarFuncionarioSessaoTurno()
{
    const response = await fetch("/login/sessao");
    const data = await parseJsonSeguraTurno(response);
    if (response.ok)
    {
        persistirFuncionarioTurno(data);
    }
}

function escaparHtmlTurno(valor)
{
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatarDataHoraTurno(valor)
{
    if (!valor) return "-";
    const data = valor instanceof Date ? valor : new Date(String(valor).replace(" ", "T"));
    if (Number.isNaN(data.getTime()))
    {
        return String(valor);
    }
    return data.toLocaleString("pt-BR",
    {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function obterMinutosHoraTurno(hora)
{
    const match = String(hora || "").trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

function formatarDataHoraRealTurno(dataEscala, hora, horaInicioReferencia)
{
    if (!dataEscala || !hora) return "-";

    const horaTexto = String(hora).trim();
    const horaNormalizada = horaTexto.length === 5 ? `${horaTexto}:00` : horaTexto;
    const data = new Date(`${dataEscala}T${horaNormalizada}`);
    if (Number.isNaN(data.getTime())) return formatarDataHoraTurno(`${dataEscala} ${hora}`);

    const minutosInicio = obterMinutosHoraTurno(horaInicioReferencia);
    const minutosAtual = obterMinutosHoraTurno(hora);
    if (minutosInicio !== null && minutosAtual !== null && minutosAtual <= minutosInicio)
    {
        data.setDate(data.getDate() + 1);
    }

    return formatarDataHoraTurno(data);
}

function formatarDataTurno(valor)
{
    if (!valor) return "-";
    const data = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(data.getTime())) return String(valor);
    return data.toLocaleDateString("pt-BR");
}

function textoTurnoNome(idTurno)
{
    return Number(idTurno) === 1 ? "Manhã" : "Noite";
}

function textoStatusTurno(status)
{
    const valor = String(status || "").toLowerCase();
    if (valor === "ativo") return "Ativo";
    if (valor === "finalizado") return "Finalizado";
    if (valor === "pendente") return "Pendente";
    return status || "-";
}

function turnoPendenteVencidoSemInicio(turno)
{
    const status = String(turno?.status || "").toLowerCase();
    if (status !== "pendente" || turno?.horaInicio) return false;

    const dataEscala = turno?.dataEscala;
    if (!dataEscala) return false;

    const fim = new Date(`${dataEscala}T00:00:00`);
    if (Number.isNaN(fim.getTime())) return false;

    if (obterIdTurnoEscala(turno) === 2)
    {
        fim.setDate(fim.getDate() + 1);
        fim.setHours(7, 0, 0, 0);
    }
    else
    {
        fim.setHours(19, 0, 0, 0);
    }

    return fim.getTime() < Date.now();
}

function textoStatusExibicaoTurno(turno)
{
    if (turnoPendenteVencidoSemInicio(turno))
    {
        return "Finalizado sem inicio";
    }
    return textoStatusTurno(turno?.status);
}

function persistirFuncionarioTurno(funcionario)
{
    if (!funcionario) return;

    if (funcionario.idFuncionario != null && Number(funcionario.idFuncionario) > 0)
    {
        estadoCuidadorTurno.idFuncionarioLogado = Number(funcionario.idFuncionario);
    }

    if (funcionario.nome != null && String(funcionario.nome).trim() !== "")
    {
        estadoCuidadorTurno.nomeFuncionarioLogado = String(funcionario.nome).trim();
    }

    if (funcionario.categoria != null && String(funcionario.categoria).trim() !== "")
    {
        estadoCuidadorTurno.categoriaFuncionarioLogado = String(funcionario.categoria).trim();
    }
}

function formatarHoraCurtaTurno(hora)
{
    const texto = String(hora || "").trim();
    if (!texto) return "--:--";
    if (/^\d{2}:\d{2}/.test(texto)) return texto.slice(0, 5);
    return texto;
}

function faixaPadraoDoMomento()
{
    const horaAtual = new Date().getHours();
    return horaAtual >= 7 && horaAtual < 19 ? "07:00 as 19:00" : "19:00 as 07:00";
}

function faixaPorHoraFim(horaFim)
{
    const fim = formatarHoraCurtaTurno(horaFim);
    if (fim === "19:00") return "07:00 as 19:00";
    if (fim === "07:00") return "19:00 as 07:00";
    return "";
}

function obterFaixaExibicaoTurno(turnoAtivo)
{
    return faixaPorHoraFim(turnoAtivo?.horaFim) || faixaPadraoDoMomento();
}

function formatarHoraInicioReal(turnoAtivo)
{
    if (turnoAtivo?.data)
    {
        const dataInicio = new Date(turnoAtivo.data);
        if (!Number.isNaN(dataInicio.getTime()))
        {
            return dataInicio.toLocaleTimeString("pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    }
    return formatarHoraCurtaTurno(turnoAtivo?.horaIni);
}

function montarParamsFuncionarioTurno()
{
    return new URLSearchParams();
}

function atualizarPerfilLogadoTurno()
{
    const nomeEl = document.getElementById("perfilNome");
    const cargoEl = document.getElementById("perfilCargo");
    if (nomeEl) nomeEl.textContent = obterNomePerfilTurno();
    if (cargoEl) cargoEl.textContent = obterCategoriaPerfilTurno();
}

function obterTurnoAtivoDaResposta(data)
{
    if (!data || typeof data !== "object")
    {
        return null;
    }
    if (data.turnoAtivo && typeof data.turnoAtivo === "object")
    {
        return data.turnoAtivo;
    }
    if (data.idTurnos != null)
    {
        return data;
    }
    return null;
}

function obterFuncionarioDaResposta(data)
{
    if (!data || typeof data !== "object")
    {
        return null;
    }
    if (data.funcionario && typeof data.funcionario === "object")
    {
        return data.funcionario;
    }
    return null;
}

function obterIdTurnoEscala(turno)
{
    return Number(turno?.idTurno || turno?.turno?.idTurnos || 0);
}

function obterNomeFuncionarioEscala(turno, fallback = "-")
{
    return turno?.funcionario?.nome || turno?.funcionarioNome || fallback;
}

async function carregarRegistrosEscalaTurno(turno)
{
    if (!turno?.idFuncionarioTurnos)
    {
        return turno;
    }

    const idFuncionarioTurnos = Number(turno.idFuncionarioTurnos);
    const [ocorrenciasResponse, medicacoesResponse] = await Promise.all([
        fetch(`/ocorrencia/turno?idFuncionarioTurnos=${idFuncionarioTurnos}`),
        fetch(`/registrarusomedicacao/turno?idFuncionarioTurnos=${idFuncionarioTurnos}`)
    ]);

    const ocorrencias = await parseJsonSeguraTurno(ocorrenciasResponse);
    const medicacoes = await parseJsonSeguraTurno(medicacoesResponse);

    turno.ocorrencias = ocorrenciasResponse.ok && Array.isArray(ocorrencias) ? ocorrencias : [];
    turno.medicacoes = medicacoesResponse.ok && Array.isArray(medicacoes) ? medicacoes : [];
    return turno;
}

function atualizarLinkCadastroOcorrenciaTurno()
{
    const link = document.querySelector('.sidebar-nav a.sidebar-link[href*="ocorrencia.html"]');
    if (!link)
    {
        return;
    }

    link.setAttribute("href", "ocorrencia.html");
}

function montarResumoUltimoTurno(turno)
{
    return `
        <div class="turno-resumo-grid">
            <div><span>Cuidador(a)</span><strong>${escaparHtmlTurno(obterNomeFuncionarioEscala(turno, obterNomePerfilTurno()))}</strong></div>
            <div><span>Turno</span><strong>${textoTurnoNome(obterIdTurnoEscala(turno))} - ${formatarDataTurno(turno.dataEscala)}</strong></div>
            <div><span>Início</span><strong>${formatarDataHoraRealTurno(turno.dataEscala, turno.horaInicio)}</strong></div>
            <div><span>Fim</span><strong>${formatarDataHoraRealTurno(turno.dataEscala, turno.horaFim, turno.horaInicio)}</strong></div>
            <div><span>Status</span><strong>${textoStatusExibicaoTurno(turno)}</strong></div>
            <div><span>Ocorrências</span><strong>${(turno.ocorrencias || []).length}</strong></div>
        </div>
        <div class="turno-descricao-box">
            <span>Descrição de encerramento</span>
            <p>${escaparHtmlTurno(turno.descricao || "Nenhuma descrição informada no fechamento.")}</p>
        </div>
    `;
}

function montarOcorrenciasTurno(turno)
{
    const ocorrencias = turno.ocorrencias || [];
    if (!ocorrencias.length)
    {
        return '<p class="turno-empty">Nenhuma ocorrência registrada nesse turno.</p>';
    }

    return `<div class="turno-eventos-lista">${ocorrencias.map((ocorrencia) => `
        <article class="turno-evento">
            <div>
                <strong>${escaparHtmlTurno(ocorrencia.tipoOcorrencia?.descricao || "Ocorrência")}</strong>
                <span>${formatarDataHoraTurno(ocorrencia.dtOcorrencia)} - Gravidade ${escaparHtmlTurno(ocorrencia.tipoOcorrencia?.gravidade || "-")}</span>
            </div>
            <p>${escaparHtmlTurno(ocorrencia.observacoes || "Sem observações.")}</p>
            ${Array.isArray(ocorrencia.moradores) && ocorrencia.moradores.length ? `<small>Moradores: ${escaparHtmlTurno(ocorrencia.moradores.map((morador) => morador.nome).filter(Boolean).join(", "))}</small>` : ""}
        </article>
    `).join("")}</div>`;
}

function montarMedicacoesTurno(turno)
{
    const medicacoes = turno.medicacoes || [];
    if (!medicacoes.length)
    {
        return '<p class="turno-empty">Nenhum uso de medicação registrado nesse turno.</p>';
    }

    return `<div class="turno-eventos-lista">${medicacoes.map((medicacao) => `
        <article class="turno-evento">
            <div>
                <strong>${escaparHtmlTurno(medicacao.prescricaoDose?.prescricao?.medicamento?.nome || "Medicação")}</strong>
                <span>${formatarDataHoraTurno(medicacao.dataRegistro)}</span>
            </div>
            <p>${escaparHtmlTurno(medicacao.prescricaoDose?.prescricao?.morador?.nome || "Morador não informado")}</p>
        </article>
    `).join("")}</div>`;
}

function renderizarUltimoTurno()
{
    const container = document.getElementById("ultimoTurnoDetalhes");
    if (!container) return;

    const turno = estadoCuidadorTurno.ultimoTurno;
    document.querySelectorAll("[data-turno-tab]").forEach((botao) =>
    {
        botao.classList.toggle("active", botao.dataset.turnoTab === estadoCuidadorTurno.ultimoTurnoAba);
    });

    if (!turno)
    {
        container.innerHTML = '<p class="turno-empty">Nenhum turno finalizado encontrado.</p>';
        return;
    }

    if (estadoCuidadorTurno.ultimoTurnoAba === "ocorrencias")
    {
        container.innerHTML = montarOcorrenciasTurno(turno);
        return;
    }

    if (estadoCuidadorTurno.ultimoTurnoAba === "medicacoes")
    {
        container.innerHTML = montarMedicacoesTurno(turno);
        return;
    }

    container.innerHTML = montarResumoUltimoTurno(turno);
}

async function carregarUltimoTurnoFinalizado()
{
    const container = document.getElementById("ultimoTurnoDetalhes");
    if (container)
    {
        container.innerHTML = '<p class="turno-empty">Carregando ultimo turno...</p>';
    }

    try
    {
        const response = await fetch("/turno/ultimo-finalizado?anteriorAtual=true");
        const data = await parseJsonSeguraTurno(response);
        estadoCuidadorTurno.ultimoTurno = response.ok ? await carregarRegistrosEscalaTurno(data) : null;
        renderizarUltimoTurno();
    }
    catch (error)
    {
        console.error("Erro ao carregar ultimo turno:", error);
        estadoCuidadorTurno.ultimoTurno = null;
        renderizarUltimoTurno();
    }
}

function mostrarMensagemTurno(mensagem, tipo = "info")
{
    const toast = document.getElementById("mensagem-feedback");
    if (!toast)
    {
        window.alert(mensagem);
        return;
    }

    toast.className = `popup-msg ${tipo}`;
    toast.textContent = mensagem;
    toast.classList.add("show");

    window.clearTimeout(estadoCuidadorTurno.toastTimer);
    estadoCuidadorTurno.toastTimer = window.setTimeout(() =>
    {
        toast.classList.remove("show");
    }, 3200);
}

function atualizarUITurnoAtivo(data)
{
    const
    {
        turnoAtivo,
        totalOcorrencias,
        totalUsosMedicacao
    } = data;
    const nomeFuncionario = data.funcionario?.nome || obterNomePerfilTurno();
    const horaInicioReal = formatarHoraInicioReal(turnoAtivo);
    const faixa = obterFaixaExibicaoTurno(turnoAtivo);
    const subtitulo = horaInicioReal !== "--:--" ? `Iniciado as ${horaInicioReal}` : "Turno em andamento";

    document.getElementById("turnoCardTitulo").textContent = faixa;
    document.getElementById("turnoCardSubtitulo").textContent = subtitulo;
    document.getElementById("turnoFuncionario").textContent = nomeFuncionario;
    document.getElementById("turnoStatus").textContent = "Ativo";
    document.getElementById("turnoStatus").style.color = "#16a34a";
    document.getElementById("turnoInicio").textContent = horaInicioReal !== "--:--" ? horaInicioReal : "-";
    document.getElementById("qtdOcorrenciasTurno").textContent = String(totalOcorrencias || 0);
    document.getElementById("qtdMedicacoesTurno").textContent = String(totalUsosMedicacao || 0);
    document.getElementById("iniciarTurnoCardBtn").disabled = true;
    document.getElementById("iniciarTurnoCardBtn").style.opacity = "0.5";
    document.getElementById("fecharTurnoCardBtn").disabled = false;
    document.getElementById("fecharTurnoCardBtn").style.opacity = "1";
}

function fecharPainelFechamentoTurno()
{
    const painel = document.getElementById("encerramentoTurnoPanel");
    const descricao = document.getElementById("descricaoFechamentoTurno");
    if (painel) painel.hidden = true;
    if (descricao) descricao.value = "";
}

function atualizarUISemTurno(funcionario = null)
{
    document.getElementById("turnoCardTitulo").textContent = faixaPadraoDoMomento();
    document.getElementById("turnoCardSubtitulo").textContent = "Inicie o turno para liberar os registros.";
    document.getElementById("turnoFuncionario").textContent = funcionario?.nome || obterNomePerfilTurno();
    document.getElementById("turnoStatus").textContent = "Sem turno ativo";
    document.getElementById("turnoStatus").style.color = "#64748b";
    document.getElementById("turnoInicio").textContent = "-";
    document.getElementById("qtdOcorrenciasTurno").textContent = "0";
    document.getElementById("qtdMedicacoesTurno").textContent = "0";
    document.getElementById("iniciarTurnoCardBtn").disabled = false;
    document.getElementById("iniciarTurnoCardBtn").style.opacity = "1";
    document.getElementById("fecharTurnoCardBtn").disabled = true;
    document.getElementById("fecharTurnoCardBtn").style.opacity = "0.5";
    fecharPainelFechamentoTurno();
}

async function carregarTurnoAtivoFallbackTurno(params)
{
    try
    {
        const responseFuncionario = await fetch("/ocorrencia/funcionario-contexto");
        const dataFuncionario = await parseJsonSeguraTurno(responseFuncionario);
        if (responseFuncionario.ok)
        {
            persistirFuncionarioTurno(dataFuncionario || null);
        }

        const responseTurno = await fetch("/ocorrencia/turno-ativo");
        const dataTurno = await parseJsonSeguraTurno(responseTurno);
        const turnoResposta = responseTurno.ok ? obterTurnoAtivoDaResposta(dataTurno) : null;
        atualizarPerfilLogadoTurno();
        atualizarLinkCadastroOcorrenciaTurno();

        if (turnoResposta)
        {
            estadoCuidadorTurno.turnoAtivo = turnoResposta;
            atualizarUITurnoAtivo(
            {
                funcionario: responseFuncionario.ok ? dataFuncionario : null,
                turnoAtivo: turnoResposta,
                totalOcorrencias: 0,
                totalUsosMedicacao: 0
            });
        }
        else
        {
            estadoCuidadorTurno.turnoAtivo = null;
            atualizarUISemTurno(responseFuncionario.ok ? dataFuncionario : null);
        }
        return responseFuncionario.ok || responseTurno.ok;
    }
    catch (e)
    {
        return false;
    }
}

async function carregarTurnoAtivoTurno()
{
    try
    {
        const response = await fetch("/turno/resumo-ativo");
        const data = await parseJsonSeguraTurno(response);
        const funcionarioResposta = obterFuncionarioDaResposta(data);
        const turnoResposta = obterTurnoAtivoDaResposta(data);

        if (!response.ok)
        {
            const fallbackOk = await carregarTurnoAtivoFallbackTurno();
            if (!fallbackOk)
            {
                atualizarUISemTurno();
            }
            return;
        }

        persistirFuncionarioTurno(funcionarioResposta || null);
        atualizarPerfilLogadoTurno();
        atualizarLinkCadastroOcorrenciaTurno();

        if (turnoResposta)
        {
            estadoCuidadorTurno.turnoAtivo = turnoResposta;
            atualizarUITurnoAtivo(
            {
                funcionario: funcionarioResposta || null,
                turnoAtivo: turnoResposta,
                totalOcorrencias: Number(data?.totalOcorrencias || 0),
                totalUsosMedicacao: Number(data?.totalUsosMedicacao || 0)
            });
        }
        else
        {
            estadoCuidadorTurno.turnoAtivo = null;
            atualizarUISemTurno(funcionarioResposta || null);
        }
    }
    catch (error)
    {
        console.error("Erro ao carregar turno ativo:", error);
        const fallbackOk = await carregarTurnoAtivoFallbackTurno();
        if (!fallbackOk)
        {
            atualizarUISemTurno();
        }
    }
}

function abrirFechamentoTurno()
{
    if (!estadoCuidadorTurno.turnoAtivo)
    {
        mostrarMensagemTurno("Nenhum turno ativo para fechar.", "error");
        return;
    }
    const painel = document.getElementById("encerramentoTurnoPanel");
    if (painel) painel.hidden = false;
}

async function iniciarTurnoCuidador()
{
    if (estadoCuidadorTurno.requisicaoTurnoEmAndamento) return;

    if (estadoCuidadorTurno.turnoAtivo)
    {
        mostrarMensagemTurno("Já existe um turno ativo para este funcionário.", "error");
        return;
    }

    const params = new URLSearchParams();
    params.append("descricao", "Turno cuidador");

    try
    {
        estadoCuidadorTurno.requisicaoTurnoEmAndamento = true;
        const response = await fetch(`/turno/iniciar?${params.toString()}`,
        {
            method: "POST"
        });
        const data = await parseJsonSeguraTurno(response);
        const funcionarioResposta = obterFuncionarioDaResposta(data);
        const turnoResposta = obterTurnoAtivoDaResposta(data);

        if (!response.ok)
        {
            const motivo = data.descricao || data.mensagem || data.message || "Não foi possível iniciar o turno.";
            mostrarMensagemTurno(motivo, "error");
            return;
        }

        persistirFuncionarioTurno(funcionarioResposta || null);
        atualizarPerfilLogadoTurno();
        atualizarLinkCadastroOcorrenciaTurno();
        estadoCuidadorTurno.turnoAtivo = turnoResposta || null;

        if (!estadoCuidadorTurno.turnoAtivo)
        {
            await carregarTurnoAtivoTurno();
        }
        else
        {
            atualizarUITurnoAtivo(
            {
                funcionario: funcionarioResposta || null,
                turnoAtivo: estadoCuidadorTurno.turnoAtivo,
                totalOcorrencias: 0,
                totalUsosMedicacao: 0
            });
        }

        mostrarMensagemTurno("Turno iniciado com sucesso!", "success");
    }
    catch (error)
    {
        console.error("Erro ao iniciar turno:", error);
        mostrarMensagemTurno("Erro de conexão ao iniciar turno.", "error");
    }
    finally
    {
        estadoCuidadorTurno.requisicaoTurnoEmAndamento = false;
    }
}

async function fecharTurnoCuidador()
{
    const params = new URLSearchParams();
    const descricao = document.getElementById("descricaoFechamentoTurno")?.value || "";
    if (descricao.trim())
    {
        params.append("descricao", descricao.trim());
    }

    try
    {
        const response = await fetch(`/turno/fechar?${params.toString()}`,
        {
            method: "POST"
        });
        const data = await parseJsonSeguraTurno(response);

        if (response.ok)
        {
            estadoCuidadorTurno.turnoAtivo = null;
            fecharPainelFechamentoTurno();
            atualizarUISemTurno();
            await carregarUltimoTurnoFinalizado();
            mostrarMensagemTurno("Turno fechado com sucesso!", "success");
        }
        else
        {
            const motivo = data.descricao || data.mensagem || data.message || "Não foi possível fechar o turno.";
            mostrarMensagemTurno(motivo, "error");
        }
    }
    catch (error)
    {
        console.error("Erro ao fechar turno:", error);
        mostrarMensagemTurno("Erro de conexão ao fechar turno.", "error");
    }
}

function adicionarEventListenersTurno()
{
    document.getElementById("iniciarTurnoCardBtn")?.addEventListener("click", iniciarTurnoCuidador);
    document.getElementById("fecharTurnoCardBtn")?.addEventListener("click", abrirFechamentoTurno);
    document.getElementById("cancelarFecharTurnoBtn")?.addEventListener("click", fecharPainelFechamentoTurno);
    document.getElementById("confirmarFecharTurnoBtn")?.addEventListener("click", fecharTurnoCuidador);
    document.querySelectorAll("[data-turno-tab]").forEach((botao) =>
    {
        botao.addEventListener("click", () =>
        {
            estadoCuidadorTurno.ultimoTurnoAba = botao.dataset.turnoTab || "resumo";
            renderizarUltimoTurno();
        });
    });
}

async function inicializarCuidadorTurno()
{
    carregarContextoUrlTurno();
    await carregarFuncionarioSessaoTurno();
    atualizarPerfilLogadoTurno();
    atualizarLinkCadastroOcorrenciaTurno();
    atualizarUISemTurno();
    adicionarEventListenersTurno();
    carregarTurnoAtivoTurno();
    carregarUltimoTurnoFinalizado();
    setInterval(carregarTurnoAtivoTurno, 30000);
}

document.addEventListener("DOMContentLoaded", inicializarCuidadorTurno);
