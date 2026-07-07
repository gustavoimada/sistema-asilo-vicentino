var semanaAtual = new Date();
var escalasController = {}; // chave: dia_turno_idFuncionario
var cuidadores = [];
var diaAtual = null;
var turnoAtual = null;
var diasSemana = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
var escalasOriginais = {};
var escalasRemovidas = {};
var datasSemana = {};
var escalasConflitoExternas = [];
var STORAGE_MODELO_ESCALA_LEGADO = "sgav.modeloEscalaSemanal.v1";
var STORAGE_MODELOS_ESCALA = "sgav.modelosEscalaSemanal.v2";
var planoPreviewAtual = null;
var modeloEscalaPendenteExclusao = null;

function preencherPerfilTopo()
{
    var nome = (localStorage.getItem("funcionarioNome") || localStorage.getItem("usuarioNome") || "Usuário").trim();
    var categoria = (localStorage.getItem("funcionarioCategoria") || "").trim();
    var cargoTexto = "Acesso";

    if (categoria) cargoTexto = formatarCargoInclusivo(categoria);

    var nomeEl = document.getElementById("perfilNome");
    var cargoEl = document.getElementById("perfilCargo");
    if (nomeEl) nomeEl.textContent = nome || "Usuário";
    if (cargoEl) cargoEl.textContent = cargoTexto;
}

function formatarCargoInclusivo(categoria)
{
    var valor = String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    if (valor === "coordenador") return "Coordenador(a)";
    if (valor === "cuidador") return "Cuidador(a)";
    if (valor === "secretaria") return "Secretária(o)";
    return String(categoria || "").trim();
}

window.addEventListener("DOMContentLoaded", function()
{
    preencherPerfilTopo();
    setupEventListeners();
    carregarCuidadores().then(function()
    {
        atualizarDatasInterface();
        carregarEscalasSemana();
    });
});

function showToast(tipo, mensagem)
{
    var toast = document.getElementById("mensagem-feedback");
    if (!toast) return;
    toast.className = "popup-msg " + tipo;
    toast.textContent = mensagem;
    toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function()
    {
        toast.classList.remove("show");
    }, 3200);
}

function formatDateIso(data)
{
    var y = data.getFullYear();
    var m = String(data.getMonth() + 1).padStart(2, "0");
    var d = String(data.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
}

function padronizarData(data)
{
    var d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
}

function dataPassada(data)
{
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return padronizarData(data).getTime() < hoje.getTime();
}

function diaPassado(dia)
{
    var iso = datasSemana[dia];
    if (!iso) return false;
    return dataPassada(new Date(iso + "T00:00:00"));
}

function diferencaDiasIso(dataA, dataB)
{
    var a = new Date(dataA + "T00:00:00");
    var b = new Date(dataB + "T00:00:00");
    return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function obterInicioEscala(dataEscala, turnoId)
{
    if (Number(turnoId) === 2)
    {
        return new Date(dataEscala + "T19:00:00");
    }
    return new Date(dataEscala + "T07:00:00");
}

function obterFimEscala(dataEscala, turnoId)
{
    if (Number(turnoId) === 2)
    {
        var fimNoite = new Date(dataEscala + "T07:00:00");
        fimNoite.setDate(fimNoite.getDate() + 1);
        return fimNoite;
    }
    return new Date(dataEscala + "T19:00:00");
}

function obterMensagemConflitoDescanso(escalaAtual, escalaComparada, mesmoTurno)
{
    var inicioAtual = obterInicioEscala(escalaAtual.dataEscala, escalaAtual.turnoId);
    var fimAtual = obterFimEscala(escalaAtual.dataEscala, escalaAtual.turnoId);
    var inicioComparada = obterInicioEscala(escalaComparada.dataEscala, escalaComparada.turnoId);
    var fimComparada = obterFimEscala(escalaComparada.dataEscala, escalaComparada.turnoId);

    if (Number.isNaN(inicioAtual.getTime()) || Number.isNaN(fimAtual.getTime()) ||
        Number.isNaN(inicioComparada.getTime()) || Number.isNaN(fimComparada.getTime()))
    {
        return "";
    }

    if (mesmoTurno)
    {
        return "Esse(a) cuidador(a) ja esta escalado(a) neste turno.";
    }

    if (inicioAtual < fimComparada && inicioComparada < fimAtual)
    {
        return "Esse(a) cuidador(a) ja esta escalado(a) em horario que conflita com esse turno.";
    }

    var intervaloHoras;
    if (inicioAtual >= fimComparada)
    {
        intervaloHoras = (inicioAtual.getTime() - fimComparada.getTime()) / 3600000;
    }
    else
    {
        intervaloHoras = (inicioComparada.getTime() - fimAtual.getTime()) / 3600000;
    }

    if (intervaloHoras < 36)
    {
        return "Esse(a) cuidador(a) precisa completar 36h de descanso antes de outro turno 12x36.";
    }

    return "";
}

function encontrarConflitoEscala(cuidadorId, dia, turnoId, dataEscala)
{
    var escalaAtual = {
        dia: dia,
        turnoId: Number(turnoId),
        dataEscala: dataEscala
    };

    var keys = Object.keys(escalasController);
    for (var i = 0; i < keys.length; i++)
    {
        var escala = escalasController[keys[i]];
        if (!escala || Number(escala.cuidadorId) !== Number(cuidadorId))
        {
            continue;
        }

        var mesmoTurno = Number(escala.turnoId) === Number(turnoId) && escala.dia === dia;
        var conflito = obterMensagemConflitoDescanso(escalaAtual, escala, mesmoTurno);
        if (conflito)
        {
            return conflito;
        }
    }

    for (var j = 0; j < escalasConflitoExternas.length; j++)
    {
        var escalaExterna = escalasConflitoExternas[j];
        if (!escalaExterna || Number(escalaExterna.cuidadorId) !== Number(cuidadorId))
        {
            continue;
        }

        var conflitoExterno = obterMensagemConflitoDescanso(escalaAtual, escalaExterna, false);
        if (conflitoExterno)
        {
            return conflitoExterno;
        }
    }

    return "";
}

function validarRegrasEscalasAtuais()
{
    var keys = Object.keys(escalasController);
    for (var i = 0; i < keys.length; i++)
    {
        var escala = escalasController[keys[i]];
        if (!escala) continue;

        delete escalasController[keys[i]];
        var conflito = encontrarConflitoEscala(escala.cuidadorId, escala.dia, escala.turnoId, escala.dataEscala);
        escalasController[keys[i]] = escala;

        if (conflito)
        {
            return conflito;
        }
    }

    return "";
}

function obterCuidadorPorId(idFuncionario)
{
    for (var i = 0; i < cuidadores.length; i++)
    {
        if (Number(cuidadores[i].idFuncionario) === Number(idFuncionario))
        {
            return cuidadores[i];
        }
    }
    return null;
}

function obterNomeCuidador(idFuncionario)
{
    var cuidador = obterCuidadorPorId(idFuncionario);
    return cuidador ? cuidador.nome || "Sem nome" : "Cuidador(a) nao encontrado(a)";
}

function escapeHtml(valor)
{
    return String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function obterNomeDia(dia)
{
    var nomes = {
        dom: "Domingo",
        seg: "Segunda-feira",
        ter: "Terca-feira",
        qua: "Quarta-feira",
        qui: "Quinta-feira",
        sex: "Sexta-feira",
        sab: "Sabado"
    };
    return nomes[dia] || dia;
}

function obterDetalhesTurno(turnoId)
{
    return Number(turnoId) === 2
        ? { nome: "Noite", horario: "19:00 - 07:00" }
        : { nome: "Manhã", horario: "07:00 - 19:00" };
}

function obterNomeTurno(turnoId)
{
    var turno = obterDetalhesTurno(turnoId);
    return turno.nome + " (" + turno.horario + ")";
}

function montarItemPlano(dia, turnoId, cuidadorId, origem)
{
    return {
        dia: dia,
        turnoId: Number(turnoId),
        cuidadorId: Number(cuidadorId),
        dataEscala: datasSemana[dia],
        origem: origem || ""
    };
}

function validarPlanoEscala(plano)
{
    var itensValidados = [];
    var itensComparacao = [];
    var alertas = [];

    for (var i = 0; i < plano.length; i++)
    {
        var item = Object.assign({}, plano[i]);
        item.conflito = "";

        if (!item.dataEscala)
        {
            item.conflito = "Data da escala nao encontrada.";
        }
        else if (diaPassado(item.dia))
        {
            item.conflito = "Este dia ja passou.";
        }
        else if (!obterCuidadorPorId(item.cuidadorId))
        {
            item.conflito = "Cuidador(a) nao encontrado(a).";
        }

        for (var j = 0; !item.conflito && j < itensComparacao.length; j++)
        {
            var comparada = itensComparacao[j];
            if (Number(comparada.cuidadorId) !== Number(item.cuidadorId))
            {
                continue;
            }

            var mesmoTurno = comparada.dia === item.dia && Number(comparada.turnoId) === Number(item.turnoId);
            item.conflito = obterMensagemConflitoDescanso(item, comparada, mesmoTurno);
        }

        for (var e = 0; !item.conflito && e < escalasConflitoExternas.length; e++)
        {
            var externa = escalasConflitoExternas[e];
            if (Number(externa.cuidadorId) !== Number(item.cuidadorId))
            {
                continue;
            }
            item.conflito = obterMensagemConflitoDescanso(item, externa, false);
        }

        if (item.conflito)
        {
            alertas.push(obterNomeDia(item.dia) + " - " + obterNomeTurno(item.turnoId) + ": " + item.conflito);
        }
        else
        {
            itensComparacao.push(item);
        }

        itensValidados.push(item);
    }

    return {
        itens: itensValidados,
        alertas: alertas,
        temConflitos: alertas.length > 0
    };
}

function fecharPreviewEscala()
{
    planoPreviewAtual = null;
    var modal = document.getElementById("previewEscalaModal");
    if (modal) modal.style.display = "none";
}

function mostrarPreviewEscala(titulo, plano)
{
    var modal = document.getElementById("previewEscalaModal");
    var tituloEl = document.getElementById("previewEscalaTitulo");
    var resumoEl = document.getElementById("previewEscalaResumo");
    var listaEl = document.getElementById("previewEscalaLista");
    var alertasEl = document.getElementById("previewEscalaAlertas");
    var confirmarBtn = document.getElementById("confirmarPreviewEscalaBtn");

    if (!modal || !tituloEl || !resumoEl || !listaEl || !alertasEl || !confirmarBtn)
    {
        return;
    }

    if (!plano.length)
    {
        showToast("error", "Nao ha escalas para aplicar nesta semana.");
        return;
    }

    var resultado = validarPlanoEscala(plano);
    planoPreviewAtual = resultado.temConflitos ? null : resultado.itens;

    tituloEl.textContent = titulo;
    resumoEl.textContent = resultado.itens.length + " escala(s) para preencher na semana atual.";
    confirmarBtn.disabled = resultado.temConflitos;

    alertasEl.innerHTML = resultado.alertas.map(function(alerta)
    {
        return '<div class="preview-alert">' + escapeHtml(alerta) + "</div>";
    }).join("");

    var linhasPreview = resultado.itens.map(function(item)
    {
        var classe = item.conflito ? "preview-item is-conflict" : "preview-item";
        var turno = obterDetalhesTurno(item.turnoId);
        var statusClasse = item.conflito ? "preview-status is-conflict" : "preview-status";
        var statusTexto = item.conflito || "Pronto para aplicar";

        return '' +
            '<div class="' + classe + '">' +
                '<div class="preview-cell preview-day">' +
                    '<span class="preview-label">Dia da semana</span>' +
                    "<strong>" + escapeHtml(obterNomeDia(item.dia)) + "</strong>" +
                "</div>" +
                '<div class="preview-cell preview-shift">' +
                    '<span class="preview-label">Turno</span>' +
                    "<strong>" + escapeHtml(turno.nome) + "</strong>" +
                    "<small>" + escapeHtml(turno.horario) + "</small>" +
                "</div>" +
                '<div class="preview-cell preview-worker">' +
                    '<span class="preview-label">Funcionario</span>' +
                    "<span>" + escapeHtml(obterNomeCuidador(item.cuidadorId)) + "</span>" +
                "</div>" +
                '<div class="preview-cell">' +
                    '<span class="preview-label">Status</span>' +
                    '<span class="' + statusClasse + '">' + escapeHtml(statusTexto) + "</span>" +
                "</div>" +
            "</div>";
    }).join("");

    listaEl.innerHTML = '' +
        '<div class="preview-grid-header">' +
            "<span>Dia da semana</span>" +
            "<span>Turno</span>" +
            "<span>Funcionario</span>" +
            "<span>Status</span>" +
        "</div>" +
        linhasPreview;

    modal.style.display = "flex";
}

function removerEscalasEditaveisDaSemana()
{
    var atuais = Object.keys(escalasController).map(function(key)
    {
        return escalasController[key];
    });

    for (var i = 0; i < atuais.length; i++)
    {
        var escala = atuais[i];
        if (!escala || diaPassado(escala.dia))
        {
            continue;
        }
        removerCuidador(escala.dia, escala.turnoId, escala.cuidadorId, escala.dataEscala);
    }
}

function adicionarItemPlanoNaTela(item)
{
    var cuidador = obterCuidadorPorId(item.cuidadorId);
    if (!cuidador || !item.dataEscala || diaPassado(item.dia))
    {
        return false;
    }

    var turnoNome = Number(item.turnoId) === 1 ? "manha" : "noite";
    var elem = document.getElementById(item.dia + "-" + turnoNome);
    if (!elem)
    {
        return false;
    }

    var key = item.dia + "_" + item.turnoId + "_" + item.cuidadorId;
    if (escalasController[key])
    {
        return false;
    }

    var conflito = encontrarConflitoEscala(item.cuidadorId, item.dia, item.turnoId, item.dataEscala);
    if (conflito)
    {
        return false;
    }

    var chip = montarChip(cuidador, item.dia, item.turnoId, item.dataEscala, false);
    elem.appendChild(chip);
    escalasController[key] = {
        dia: item.dia,
        turnoId: item.turnoId,
        cuidadorId: item.cuidadorId,
        dataEscala: item.dataEscala
    };

    if (escalasRemovidas[key])
    {
        delete escalasRemovidas[key];
    }

    return true;
}

function aplicarPlanoPreview()
{
    if (!planoPreviewAtual || !planoPreviewAtual.length)
    {
        showToast("error", "Revise os conflitos antes de aplicar.");
        return;
    }

    removerEscalasEditaveisDaSemana();

    var aplicadas = 0;
    for (var i = 0; i < planoPreviewAtual.length; i++)
    {
        if (adicionarItemPlanoNaTela(planoPreviewAtual[i]))
        {
            aplicadas++;
        }
    }

    fecharPreviewEscala();
    showToast("success", aplicadas + " escala(s) aplicada(s) na tela. Clique em salvar para gravar.");
}

function obterModeloAtualDaTela()
{
    return Object.keys(escalasController)
        .map(function(key)
        {
            var escala = escalasController[key];
            return {
                dia: escala.dia,
                turnoId: Number(escala.turnoId),
                cuidadorId: Number(escala.cuidadorId)
            };
        })
        .sort(function(a, b)
        {
            var diaA = diasSemana.indexOf(a.dia);
            var diaB = diasSemana.indexOf(b.dia);
            if (diaA !== diaB) return diaA - diaB;
            if (a.turnoId !== b.turnoId) return a.turnoId - b.turnoId;
            return a.cuidadorId - b.cuidadorId;
        });
}

function gerarIdModeloEscala()
{
    return "modelo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function salvarModelosEscala(modelos)
{
    localStorage.setItem(STORAGE_MODELOS_ESCALA, JSON.stringify(modelos));
}

function normalizarModelosEscala(modelos)
{
    if (!Array.isArray(modelos))
    {
        return [];
    }

    return modelos
        .filter(function(modelo)
        {
            return modelo && Array.isArray(modelo.itens) && modelo.itens.length > 0;
        })
        .map(function(modelo, index)
        {
            return {
                id: modelo.id || gerarIdModeloEscala(),
                nome: modelo.nome || "Modelo " + (index + 1),
                criadoEm: modelo.criadoEm || new Date().toISOString(),
                itens: modelo.itens
            };
        });
}

function carregarModelosEscala()
{
    var modelos = [];
    var salvos = localStorage.getItem(STORAGE_MODELOS_ESCALA);

    if (salvos)
    {
        try
        {
            modelos = normalizarModelosEscala(JSON.parse(salvos));
        }
        catch (e)
        {
            modelos = [];
        }
    }

    if (!salvos)
    {
        var legado = localStorage.getItem(STORAGE_MODELO_ESCALA_LEGADO);
        if (legado)
        {
            try
            {
                var modeloLegado = JSON.parse(legado);
                var itensLegado = Array.isArray(modeloLegado.itens) ? modeloLegado.itens : [];
                if (itensLegado.length)
                {
                    modelos.push({
                        id: gerarIdModeloEscala(),
                        nome: "Modelo 1",
                        criadoEm: modeloLegado.criadoEm || new Date().toISOString(),
                        itens: itensLegado
                    });
                    salvarModelosEscala(modelos);
                }
            }
            catch (e)
            {
                modelos = [];
            }
        }
    }

    return modelos;
}

function obterNomeProximoModelo(modelos)
{
    var numero = 1;
    while (modelos.some(function(modelo)
    {
        return modelo.nome === "Modelo " + numero;
    }))
    {
        numero++;
    }
    return "Modelo " + numero;
}

function salvarModeloSemanal()
{
    var modelo = obterModeloAtualDaTela();
    if (!modelo.length)
    {
        showToast("error", "Monte uma semana antes de salvar como modelo.");
        return;
    }

    var modelos = carregarModelosEscala();
    var novoModelo = {
        id: gerarIdModeloEscala(),
        nome: obterNomeProximoModelo(modelos),
        criadoEm: new Date().toISOString(),
        itens: modelo
    };

    modelos.push(novoModelo);
    salvarModelosEscala(modelos);
    showToast("success", novoModelo.nome + " salvo com " + modelo.length + " escala(s).");
}

function aplicarModeloSemanal()
{
    abrirModelosEscala();
}

function fecharModelosEscala()
{
    var modal = document.getElementById("modelosEscalaModal");
    if (modal) modal.style.display = "none";
}

function obterResumoModeloEscala(itens)
{
    var resumo = itens.slice(0, 3).map(function(item)
    {
        return obterNomeDia(item.dia) + " " + obterNomeTurno(item.turnoId);
    }).join(", ");

    if (itens.length > 3)
    {
        resumo += " +" + (itens.length - 3);
    }

    return resumo || "Sem escalas";
}

function renderizarModelosEscala()
{
    var listaEl = document.getElementById("modelosEscalaLista");
    if (!listaEl) return;

    var modelos = carregarModelosEscala();
    if (!modelos.length)
    {
        listaEl.innerHTML = '<div class="modelos-empty">Nenhum modelo semanal salvo ainda.</div>';
        return;
    }

    listaEl.innerHTML = modelos.map(function(modelo, index)
    {
        var itens = Array.isArray(modelo.itens) ? modelo.itens : [];
        var criadoEm = modelo.criadoEm ? new Date(modelo.criadoEm) : null;
        var criadoTexto = criadoEm && !Number.isNaN(criadoEm.getTime()) ? criadoEm.toLocaleDateString("pt-BR") : "sem data";

        return '' +
            '<article class="modelo-card">' +
                '<div class="modelo-card-main">' +
                    '<span class="modelo-kicker">Modelo ' + (index + 1) + "</span>" +
                    "<h3>" + escapeHtml(modelo.nome || ("Modelo " + (index + 1))) + "</h3>" +
                    "<p>" + itens.length + " escala(s) - " + escapeHtml(obterResumoModeloEscala(itens)) + "</p>" +
                "</div>" +
                '<div class="modelo-card-meta">' +
                    '<span class="modelo-date">Salvo em ' + escapeHtml(criadoTexto) + "</span>" +
                    '<div class="modelo-card-actions">' +
                        '<button type="button" class="secondary-btn modelo-delete-btn" data-acao="excluir" data-modelo-id="' + escapeHtml(modelo.id) + '">' +
                            '<span class="material-symbols-outlined">delete</span>' +
                            "Excluir" +
                        "</button>" +
                        '<button type="button" class="primary-btn modelo-apply-btn" data-acao="aplicar" data-modelo-id="' + escapeHtml(modelo.id) + '">' +
                            '<span class="material-symbols-outlined">event_repeat</span>' +
                            "Aplicar" +
                        "</button>" +
                    "</div>" +
                "</div>" +
            "</article>";
    }).join("");
}

function abrirModelosEscala()
{
    var modal = document.getElementById("modelosEscalaModal");
    if (!modal)
    {
        showToast("error", "Nao foi possivel abrir os modelos semanais.");
        return;
    }

    renderizarModelosEscala();
    modal.style.display = "flex";
}

function aplicarModeloEscala(modeloId)
{
    var modelos = carregarModelosEscala();
    var modelo = modelos.find(function(item)
    {
        return item.id === modeloId;
    });

    if (!modelo)
    {
        showToast("error", "Modelo semanal nao encontrado.");
        renderizarModelosEscala();
        return;
    }

    var plano = modelo.itens.map(function(item)
    {
        return montarItemPlano(item.dia, item.turnoId, item.cuidadorId, "modelo");
    });

    fecharModelosEscala();
    mostrarPreviewEscala("Aplicar " + (modelo.nome || "modelo semanal"), plano);
}

function excluirModeloEscala(modeloId)
{
    var modelos = carregarModelosEscala();
    var modelo = modelos.find(function(item)
    {
        return item.id === modeloId;
    });

    if (!modelo) return;

    modeloEscalaPendenteExclusao = {
        id: modelo.id,
        nome: modelo.nome || "Modelo semanal"
    };

    var texto = document.getElementById("confirmarExclusaoModeloTexto");
    var modal = document.getElementById("confirmarExclusaoModeloModal");

    if (texto)
        texto.textContent = 'Deseja realmente excluir "' + modeloEscalaPendenteExclusao.nome + '"?';

    if (modal)
        modal.style.display = "flex";
}

function fecharConfirmacaoExclusaoModelo()
{
    modeloEscalaPendenteExclusao = null;

    var modal = document.getElementById("confirmarExclusaoModeloModal");
    if (modal)
        modal.style.display = "none";
}

function confirmarExclusaoModeloEscala()
{
    if (!modeloEscalaPendenteExclusao)
    {
        fecharConfirmacaoExclusaoModelo();
        return;
    }

    var modelo = modeloEscalaPendenteExclusao;
    var modelos = carregarModelosEscala();
    modelos = modelos.filter(function(item)
    {
        return item.id !== modelo.id;
    });

    salvarModelosEscala(modelos);
    renderizarModelosEscala();
    fecharConfirmacaoExclusaoModelo();
    showToast("success", modelo.nome + " excluido.");
}

function buscarEscalasPeriodo(inicio, fim)
{
    return fetch("/funcionarioTurnos/listarPeriodo?inicio=" + inicio + "&fim=" + fim)
        .then(function(response)
        {
            return response.json();
        })
        .then(function(body)
        {
            if (Array.isArray(body)) return body;
            if (body && Array.isArray(body.escalas)) return body.escalas;
            return [];
        });
}

function copiarSemanaAnterior()
{
    var semana = obterSemana(semanaAtual);
    var inicioAnterior = new Date(semana.inicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - 7);
    var fimAnterior = new Date(semana.fim);
    fimAnterior.setDate(fimAnterior.getDate() - 7);

    buscarEscalasPeriodo(formatDateIso(inicioAnterior), formatDateIso(fimAnterior))
        .then(function(lista)
        {
            var plano = [];
            for (var i = 0; i < lista.length; i++)
            {
                var item = lista[i];
                if (!item.dataEscala) continue;
                var dataRef = new Date(item.dataEscala + "T00:00:00");
                var dia = diasSemana[dataRef.getDay()];
                plano.push(montarItemPlano(dia, Number(item.idTurno), Number(item.idFuncionario), "semana-anterior"));
            }
            mostrarPreviewEscala("Copiar semana anterior", plano);
        })
        .catch(function()
        {
            showToast("error", "Nao foi possivel carregar a semana anterior.");
        });
}

function aplicarEstadoDiasPassados()
{
    for (var i = 0; i < diasSemana.length; i++)
    {
        var dia = diasSemana[i];
        var spanData = document.getElementById(dia + "-data");
        if (!spanData) continue;

        var card = spanData.closest(".dia-card");
        if (!card) continue;

        var passado = diaPassado(dia);
        card.classList.toggle("past-day", passado);

        var botoes = card.querySelectorAll(".add-btn");
        for (var j = 0; j < botoes.length; j++)
        {
            botoes[j].disabled = passado;
            botoes[j].title = passado ? "Nao e possivel escalar dias passados." : "";
        }
    }
}

function obterSemana(data)
{
    var d = new Date(data);
    var day = d.getDay();
    var diff = day === 0 ? 0 : -day;
    var inicio = new Date(d);
    inicio.setDate(d.getDate() + diff);
    inicio.setHours(0, 0, 0, 0);
    var fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    return {
        inicio: inicio,
        fim: fim
    };
}

function atualizarDatasInterface()
{
    var semana = obterSemana(semanaAtual);
    var inicio = semana.inicio.toLocaleDateString("pt-BR");
    var fim = semana.fim.toLocaleDateString("pt-BR");
    document.getElementById("weekInfo").innerText = "Semana de " + inicio + " a " + fim;

    for (var i = 0; i < diasSemana.length; i++)
    {
        var data = new Date(semana.inicio);
        data.setDate(data.getDate() + i);
        data.setHours(0, 0, 0, 0);
        var dia = diasSemana[i];
        datasSemana[dia] = formatDateIso(data);
        var span = document.getElementById(dia + "-data");
        if (span)
        {
            var diaMes = String(data.getDate()).padStart(2, "0") + "/" + String(data.getMonth() + 1).padStart(2, "0");
            span.innerText = "(" + diaMes + ")";
        }
    }

    aplicarEstadoDiasPassados();
}

function limparEscalas()
{
    escalasController = {};
    escalasOriginais = {};
    escalasRemovidas = {};
    escalasConflitoExternas = [];
    for (var i = 0; i < diasSemana.length; i++)
    {
        var dia = diasSemana[i];
        var elem1 = document.getElementById(dia + "-manha");
        var elem2 = document.getElementById(dia + "-noite");
        if (elem1) elem1.innerHTML = "";
        if (elem2) elem2.innerHTML = "";
    }
}

function carregarCuidadores()
{
    return fetch("/funcionario/listarCuidadores")
        .then(function(response)
        {
            return response.json();
        })
        .then(function(data)
        {
            if (Array.isArray(data))
            {
                cuidadores = data;
            }
            else
            {
                cuidadores = [];
            }
        })
        .catch(function()
        {
            cuidadores = [];
            showToast("error", "Erro ao carregar cuidadores.");
        });
}

function renderizarCuidadores()
{
    var lista = document.getElementById("cuidadoresList");
    if (!lista) return;
    lista.innerHTML = "";

    if (cuidadores.length === 0)
    {
        lista.innerHTML = '<p class="turno-list-empty">Nenhum cuidador cadastrado.</p>';
        return;
    }

    for (var i = 0; i < cuidadores.length; i++)
    {
        var cuidador = cuidadores[i];
        var dataEscala = diaAtual ? datasSemana[diaAtual] : "";
        var conflito = dataEscala ? encontrarConflitoEscala(cuidador.idFuncionario, diaAtual, turnoAtual, dataEscala) : "";
        var option = document.createElement("div");
        option.className = "cuidador-option" + (conflito ? " disabled" : "");
        if (conflito)
        {
            option.title = conflito;
        }
        option.innerHTML =
            '<div class="cuidador-option-avatar">' + (cuidador.nome ? cuidador.nome.charAt(0).toUpperCase() : "?") + "</div>" +
            '<div class="cuidador-option-info">' +
            "<h4>" + (cuidador.nome || "Sem nome") + "</h4>" +
            "<p>" + (conflito || formatarCargoInclusivo(cuidador.categoria || "Cuidador")) + "</p>" +
            "</div>" +
            '<button class="cuidador-option-select" type="button">' +
            '<span class="material-symbols-outlined">' + (conflito ? "block" : "check_circle") + "</span>" +
            "</button>";

        (function(idFuncionario, mensagemConflito)
        {
            option.addEventListener("click", function()
            {
                if (mensagemConflito)
                {
                    showToast("error", mensagemConflito);
                    return;
                }
                adicionarCuidadorClick(idFuncionario);
            });
        })(cuidador.idFuncionario, conflito);

        lista.appendChild(option);
    }
}

function abrirSelectorCuidador(dia, turno)
{
    if (diaPassado(dia))
    {
        showToast("error", "Nao e possivel escalar um dia que ja passou.");
        return;
    }

    diaAtual = dia;
    turnoAtual = turno;
    renderizarCuidadores();
    document.getElementById("selectorModal").style.display = "flex";
}

function fecharSelectorModal()
{
    document.getElementById("selectorModal").style.display = "none";
}

function montarChip(cuidador, dia, turnoId, dataEscala, bloqueado)
{
    var chip = document.createElement("div");
    chip.className = "cuidador-chip";
    chip.setAttribute("data-id-funcionario", String(cuidador.idFuncionario));
    chip.setAttribute("data-turno", String(turnoId));
    chip.setAttribute("data-dia", dia);
    chip.setAttribute("data-data-escala", dataEscala);

    chip.innerHTML =
        '<div class="cuidador-chip-info">' +
        '<div class="cuidador-chip-avatar">' + (cuidador.nome ? cuidador.nome.charAt(0).toUpperCase() : "?") + "</div>" +
        "<span>" + (cuidador.nome || "Sem nome") + "</span>" +
        "</div>" +
        '<button class="cuidador-chip-remove" type="button">' +
        '<span class="material-symbols-outlined">close</span>' +
        "</button>";

    var botaoRemover = chip.querySelector(".cuidador-chip-remove");
    if (bloqueado)
    {
        chip.classList.add("locked");
        botaoRemover.title = "Excluir escala de dia passado.";
    }

    botaoRemover.addEventListener("click", function()
    {
        removerCuidador(dia, turnoId, cuidador.idFuncionario, dataEscala);
    });

    return chip;
}

function adicionarCuidadorClick(cuidadorId)
{
    if (diaPassado(diaAtual))
    {
        showToast("error", "Nao e possivel escalar um dia que ja passou.");
        return;
    }

    var cuidador = null;
    for (var i = 0; i < cuidadores.length; i++)
    {
        if (Number(cuidadores[i].idFuncionario) === Number(cuidadorId))
        {
            cuidador = cuidadores[i];
            break;
        }
    }
    if (!cuidador)
    {
        showToast("error", "Cuidador(a) não encontrado(a).");
        return;
    }

    var semana = obterSemana(semanaAtual);
    var diaIndex = diasSemana.indexOf(diaAtual);
    var dataEscalaDate = new Date(semana.inicio);
    dataEscalaDate.setDate(dataEscalaDate.getDate() + diaIndex);
    var dataEscala = formatDateIso(dataEscalaDate);

    var turnoNome = turnoAtual === 1 ? "manha" : "noite";
    var elemId = diaAtual + "-" + turnoNome;
    var elem = document.getElementById(elemId);
    if (!elem) return;

    var key = diaAtual + "_" + turnoAtual + "_" + cuidador.idFuncionario;
    if (escalasController[key])
    {
        showToast("error", "Esse(a) cuidador(a) já está escalado(a) neste turno.");
        return;
    }

    var conflitoEscala = encontrarConflitoEscala(cuidador.idFuncionario, diaAtual, turnoAtual, dataEscala);
    if (conflitoEscala)
    {
        showToast("error", conflitoEscala);
        return;
    }

    var chip = montarChip(cuidador, diaAtual, turnoAtual, dataEscala, false);
    elem.appendChild(chip);
    escalasController[key] = {
        dia: diaAtual,
        turnoId: turnoAtual,
        cuidadorId: cuidador.idFuncionario,
        dataEscala: dataEscala
    };
    if (escalasRemovidas[key])
    {
        delete escalasRemovidas[key];
    }

    fecharSelectorModal();
}

function removerCuidador(dia, turnoId, cuidadorId, dataEscala)
{
    var key = dia + "_" + turnoId + "_" + cuidadorId;
    var turnoNome = turnoId === 1 ? "manha" : "noite";
    var elem = document.getElementById(dia + "-" + turnoNome);
    if (elem)
    {
        var selector = '.cuidador-chip[data-id-funcionario="' + cuidadorId + '"]';
        var chip = elem.querySelector(selector);
        if (chip) chip.remove();
    }
    if (escalasOriginais[key])
    {
        var idEscala = Number(escalasOriginais[key].idFuncionarioTurnos);
        escalasRemovidas[key] = {
            idFuncionarioTurnos: Number.isNaN(idEscala) ? 0 : idEscala,
            dataEscala: dataEscala || escalasOriginais[key].dataEscala
        };
    }
    delete escalasController[key];
}

function carregarEscalasSemana()
{
    limparEscalas();
    var semana = obterSemana(semanaAtual);
    var inicio = formatDateIso(semana.inicio);
    var fim = formatDateIso(semana.fim);
    var inicioConsultaDate = new Date(semana.inicio);
    inicioConsultaDate.setDate(inicioConsultaDate.getDate() - 1);
    var fimConsultaDate = new Date(semana.fim);
    fimConsultaDate.setDate(fimConsultaDate.getDate() + 1);
    var inicioConsulta = formatDateIso(inicioConsultaDate);
    var fimConsulta = formatDateIso(fimConsultaDate);

    return fetch("/funcionarioTurnos/listarPeriodo?inicio=" + inicioConsulta + "&fim=" + fimConsulta)
        .then(function(response)
        {
            return response.json();
        })
        .then(function(body)
        {
            var lista = [];
            if (Array.isArray(body))
            {
                lista = body;
            }
            else if (body && Array.isArray(body.escalas))
            {
                lista = body.escalas;
            }

            for (var i = 0; i < lista.length; i++)
            {
                var item = lista[i];
                if (!item.dataEscala) continue;
                if (item.dataEscala < inicio || item.dataEscala > fim)
                {
                    escalasConflitoExternas.push({
                        cuidadorId: Number(item.idFuncionario),
                        dataEscala: item.dataEscala,
                        turnoId: Number(item.idTurno)
                    });
                    continue;
                }
                var dataRef = new Date(item.dataEscala + "T00:00:00");
                var dia = diasSemana[dataRef.getDay()];
                var turnoId = Number(item.idTurno);
                var turnoNome = turnoId === 1 ? "manha" : "noite";
                var elem = document.getElementById(dia + "-" + turnoNome);
                if (!elem) continue;

                var cuidador = null;
                for (var j = 0; j < cuidadores.length; j++)
                {
                    if (Number(cuidadores[j].idFuncionario) === Number(item.idFuncionario))
                    {
                        cuidador = cuidadores[j];
                        break;
                    }
                }
                if (!cuidador) continue;

                var key = dia + "_" + turnoId + "_" + item.idFuncionario;
                if (escalasController[key]) continue;

                var bloqueado = dataPassada(dataRef);
                var chip = montarChip(cuidador, dia, turnoId, item.dataEscala, bloqueado);
                elem.appendChild(chip);
                escalasController[key] = {
                    dia: dia,
                    turnoId: turnoId,
                    cuidadorId: Number(item.idFuncionario),
                    dataEscala: item.dataEscala,
                    idFuncionarioTurnos: Number(item.idFuncionarioTurnos) || 0
                };
                escalasOriginais[key] = {
                    dia: dia,
                    turnoId: turnoId,
                    cuidadorId: Number(item.idFuncionario),
                    dataEscala: item.dataEscala,
                    idFuncionarioTurnos: Number(item.idFuncionarioTurnos) || 0
                };
            }
        })
        .catch(function()
        {
            showToast("error", "Erro ao carregar escalasController da semana.");
        });
}

function salvarEscalas()
{
    var keys = Object.keys(escalasController);
    var keysRemover = Object.keys(escalasRemovidas);
    if (keys.length === 0 && keysRemover.length === 0)
    {
        showToast("error", "Nenhuma escala foi adicionada.");
        return;
    }

    var conflitoEscala = validarRegrasEscalasAtuais();
    if (conflitoEscala)
    {
        showToast("error", conflitoEscala);
        return;
    }

    var requestsCriar = [];
    var requestsRemover = [];
    for (var i = 0; i < keys.length; i++)
    {
        var data = escalasController[keys[i]];
        if (escalasOriginais[keys[i]])
        {
            continue;
        }

        var url =
            "/funcionarioTurnos/criar?idFuncionario=" + data.cuidadorId +
            "&idTurno=" + data.turnoId +
            "&dataEscala=" + encodeURIComponent(data.dataEscala);

        requestsCriar.push(
            fetch(url,
            {
                method: "POST"
            })
            .then(function(response)
            {
                return response.ok;
            })
            .catch(function()
            {
                return false;
            })
        );
    }

    for (var r = 0; r < keysRemover.length; r++)
    {
        var rem = escalasRemovidas[keysRemover[r]];
        if (!rem || !rem.idFuncionarioTurnos)
        {
            continue;
        }
        var urlDelete =
            "/funcionarioTurnos/deletar?idFuncionarioTurnos=" + rem.idFuncionarioTurnos;

        requestsRemover.push(
            fetch(urlDelete,
            {
                method: "DELETE"
            })
            .then(function(response)
            {
                return response.ok;
            })
            .catch(function()
            {
                return false;
            })
        );
    }

    if (requestsCriar.length === 0 && requestsRemover.length === 0)
    {
        showToast("success", "Nenhuma alteração para salvar.");
        return;
    }

    Promise.all(requestsRemover).then(function(resultadosRemover)
    {
        return Promise.all(requestsCriar).then(function(resultadosCriar)
        {
            return resultadosRemover.concat(resultadosCriar);
        });
    }).then(function(results)
    {
        var sucesso = 0;
        for (var i = 0; i < results.length; i++)
        {
            if (results[i]) sucesso++;
        }

        if (sucesso === results.length)
        {
            showToast("success", "Escalas atualizadas com sucesso.");
        }
        else if (sucesso > 0)
        {
            showToast("error", "Algumas escalasController já existiam ou falharam ao salvar.");
        }
        else
        {
            showToast("error", "Não foi possível salvar as escalasController.");
        }

        carregarEscalasSemana();
    });
}

function setupEventListeners()
{
    document.getElementById("prevWeekBtn").addEventListener("click", function()
    {
        semanaAtual.setDate(semanaAtual.getDate() - 7);
        atualizarDatasInterface();
        carregarEscalasSemana();
    });

    document.getElementById("nextWeekBtn").addEventListener("click", function()
    {
        semanaAtual.setDate(semanaAtual.getDate() + 7);
        atualizarDatasInterface();
        carregarEscalasSemana();
    });

    document.getElementById("salvarEscalasBtn").addEventListener("click", salvarEscalas);

    var copiarBtn = document.getElementById("copiarSemanaBtn");
    var salvarModeloBtn = document.getElementById("salvarModeloBtn");
    var aplicarModeloBtn = document.getElementById("aplicarModeloBtn");
    var cancelarPreviewBtn = document.getElementById("cancelarPreviewEscalaBtn");
    var confirmarPreviewBtn = document.getElementById("confirmarPreviewEscalaBtn");
    var cancelarExclusaoModeloBtn = document.getElementById("cancelarExclusaoModeloBtn");
    var confirmarExclusaoModeloBtn = document.getElementById("confirmarExclusaoModeloBtn");
    var listaModelos = document.getElementById("modelosEscalaLista");

    if (copiarBtn) copiarBtn.addEventListener("click", copiarSemanaAnterior);
    if (salvarModeloBtn) salvarModeloBtn.addEventListener("click", salvarModeloSemanal);
    if (aplicarModeloBtn) aplicarModeloBtn.addEventListener("click", aplicarModeloSemanal);
    if (cancelarPreviewBtn) cancelarPreviewBtn.addEventListener("click", fecharPreviewEscala);
    if (confirmarPreviewBtn) confirmarPreviewBtn.addEventListener("click", aplicarPlanoPreview);
    if (cancelarExclusaoModeloBtn) cancelarExclusaoModeloBtn.addEventListener("click", fecharConfirmacaoExclusaoModelo);
    if (confirmarExclusaoModeloBtn) confirmarExclusaoModeloBtn.addEventListener("click", confirmarExclusaoModeloEscala);
    if (listaModelos)
    {
        listaModelos.addEventListener("click", function(e)
        {
            var botao = e.target.closest("button[data-acao]");
            if (!botao) return;

            var acao = botao.getAttribute("data-acao");
            var modeloId = botao.getAttribute("data-modelo-id");

            if (acao === "aplicar")
            {
                aplicarModeloEscala(modeloId);
            }

            if (acao === "excluir")
            {
                excluirModeloEscala(modeloId);
            }
        });
    }
}

document.addEventListener("click", function(e)
{
    var modal = document.getElementById("selectorModal");
    if (modal && e.target === modal)
    {
        fecharSelectorModal();
    }

    var previewModal = document.getElementById("previewEscalaModal");
    if (previewModal && e.target === previewModal)
    {
        fecharPreviewEscala();
    }

    var modelosModal = document.getElementById("modelosEscalaModal");
    if (modelosModal && e.target === modelosModal)
    {
        fecharModelosEscala();
    }

    var confirmarExclusaoModeloModal = document.getElementById("confirmarExclusaoModeloModal");
    if (confirmarExclusaoModeloModal && e.target === confirmarExclusaoModeloModal)
    {
        fecharConfirmacaoExclusaoModelo();
    }
});
