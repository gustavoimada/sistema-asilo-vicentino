function obterElemento(id)
{
    return document.getElementById(id);
}

function mostrarMensagem(tipo, mensagem)
{
    const caixaMensagem = obterElemento("mensagem-feedback");
    if (!caixaMensagem)
    {
        return;
    }

    caixaMensagem.className = `popup-msg ${tipo}`;
    caixaMensagem.textContent = mensagem;
    caixaMensagem.classList.add("show");

    window.clearTimeout(mostrarMensagem._temporizador);
    mostrarMensagem._temporizador = window.setTimeout(function ()
    {
        caixaMensagem.classList.remove("show");
    }, 3200);
}

function buscarSessao()
{
    return fetch("/login/sessao")
        .then(function (resposta)
        {
            if (!resposta.ok)
            {
                return null;
            }
            return resposta.json();
        })
        .catch(function ()
        {
            return null;
        });
}

function redirecionar(funcionario)
{
    const categoria = String((funcionario && funcionario.categoria) || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    if (categoria === "cuidador")
    {
        window.location.href = "../cuidador.html";
        return;
    }

    if (categoria === "coordenador")
    {
        window.location.href = "../coordenador.html";
        return;
    }

    if (categoria === "nutricionista")
    {
        window.location.href = "../nutricionista.html";
        return;
    }

    window.location.href = "../secretaria.html";
}

function limparContextoLogin()
{
    localStorage.removeItem("idFuncionario");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("funcionarioNome");
    localStorage.removeItem("funcionarioCategoria");
}

function salvarContextoLogin(usuario, funcionario)
{
    limparContextoLogin();

    if (usuario && usuario.idUser)
    {
        localStorage.setItem("usuarioId", String(usuario.idUser));
    }
    if (usuario && usuario.name)
    {
        localStorage.setItem("usuarioNome", String(usuario.name));
    }
    if (funcionario && funcionario.idFuncionario)
    {
        localStorage.setItem("idFuncionario", String(funcionario.idFuncionario));
    }
    if (funcionario && funcionario.nome)
    {
        localStorage.setItem("funcionarioNome", String(funcionario.nome));
    }
    if (funcionario && funcionario.categoria)
    {
        localStorage.setItem("funcionarioCategoria", String(funcionario.categoria));
    }
}

function logar(evento)
{
    evento.preventDefault();
    limparContextoLogin();

    const nomeUsuario = (obterElemento("name")?.value || "").trim();
    const senha = obterElemento("senha")?.value || "";

    if (!nomeUsuario || !senha)
    {
        mostrarMensagem("error", "Preencha usuário e senha para entrar.");
        return;
    }

    const dadosLogin = new URLSearchParams();
    dadosLogin.set("username", nomeUsuario);
    dadosLogin.set("password", senha);

    fetch("/login/entrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: dadosLogin
    })
        .then(function (resposta)
        {
            return resposta.json()
                .catch(function ()
                {
                    return null;
                })
                .then(function (conteudo)
                {
                    if (resposta.ok)
                    {
                        return conteudo;
                    }

                    if (resposta.status === 429)
                    {
                        mostrarMensagem("error", conteudo?.descricao || "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
                    }
                    else if (resposta.status === 401)
                    {
                        mostrarMensagem("error", "Usuário ou senha incorretos.");
                    }
                    else
                    {
                        mostrarMensagem("error", conteudo?.descricao || "Não foi possível entrar. Tente novamente em instantes.");
                    }
                    return null;
                });
        })
        .then(function (usuario)
        {
            if (!usuario)
            {
                return;
            }

            return buscarSessao()
                .then(function (funcionario)
                {
                    if (!funcionario)
                    {
                        mostrarMensagem("error", "Funcionário vinculado ao usuário não encontrado.");
                        return;
                    }
                    salvarContextoLogin(usuario, funcionario);
                    redirecionar(funcionario);
                });
        })
        .catch(function ()
        {
            mostrarMensagem("error", "Erro ao entrar. Tente novamente em instantes.");
        });
}

document.addEventListener("DOMContentLoaded", function ()
{
    const botaoAjuda = document.getElementById("helpBtn");
    const painelAjuda = document.getElementById("helpPanel");
    const campoSenha = document.getElementById("senha");
    const botaoSenha = document.getElementById("toggleSenha");

    if (campoSenha && botaoSenha)
    {
        const iconeSenha = botaoSenha.querySelector(".material-symbols-outlined");

        botaoSenha.addEventListener("click", function ()
        {
            const deveExibir = campoSenha.type === "password";
            campoSenha.type = deveExibir ? "text" : "password";
            botaoSenha.setAttribute("aria-pressed", String(deveExibir));
            botaoSenha.setAttribute("aria-label", deveExibir ? "Ocultar senha" : "Exibir senha");
            botaoSenha.setAttribute("title", deveExibir ? "Ocultar senha" : "Exibir senha");
            if (iconeSenha)
            {
                iconeSenha.textContent = deveExibir ? "visibility_off" : "visibility";
            }
            campoSenha.focus();
        });
    }

    if (!botaoAjuda || !painelAjuda)
    {
        return;
    }

    function abrirAjuda()
    {
        painelAjuda.hidden = false;
        botaoAjuda.setAttribute("aria-expanded", "true");
    }

    function fecharAjuda()
    {
        painelAjuda.hidden = true;
        botaoAjuda.setAttribute("aria-expanded", "false");
    }

    botaoAjuda.addEventListener("mouseenter", abrirAjuda);
    botaoAjuda.addEventListener("focus", abrirAjuda);

    painelAjuda.addEventListener("mouseenter", abrirAjuda);

    painelAjuda.addEventListener("mouseleave", function ()
    {
        if (document.activeElement !== botaoAjuda)
        {
            fecharAjuda();
        }
    });

    botaoAjuda.addEventListener("mouseleave", function ()
    {
        window.setTimeout(function ()
        {
            if (!painelAjuda.matches(":hover") && document.activeElement !== botaoAjuda)
            {
                fecharAjuda();
            }
        }, 120);
    });

    botaoAjuda.addEventListener("blur", function ()
    {
        window.setTimeout(function ()
        {
            if (!painelAjuda.matches(":hover"))
            {
                fecharAjuda();
            }
        }, 120);
    });

    botaoAjuda.addEventListener("click", function (evento)
    {
        evento.stopPropagation();
        if (painelAjuda.hidden)
        {
            abrirAjuda();
        }
        else
        {
            fecharAjuda();
        }
    });

    painelAjuda.addEventListener("click", function (evento)
    {
        evento.stopPropagation();
    });

    document.addEventListener("click", function ()
    {
        fecharAjuda();
    });

    document.addEventListener("keydown", function (evento)
    {
        if (evento.key === "Escape")
        {
            fecharAjuda();
        }
    });
});
