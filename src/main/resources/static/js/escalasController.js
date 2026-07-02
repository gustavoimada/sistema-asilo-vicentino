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
}

document.addEventListener("click", function(e)
{
    var modal = document.getElementById("selectorModal");
    if (modal && e.target === modal)
    {
        fecharSelectorModal();
    }
});
