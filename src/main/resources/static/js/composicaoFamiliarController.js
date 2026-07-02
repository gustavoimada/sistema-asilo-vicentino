const URL = '/composicaoFamiliar';
let moradoresCarregados = [];
let pessoasCadastradas = [];
let vinculosCarregados = [];
let ordenacaoVinculos = '';
let direcaoOrdenacaoVinculos = 'asc';
let ordenacaoPessoas = '';
let direcaoOrdenacaoPessoas = 'asc';

function carregarContextoUrl() {
    const params = new URLSearchParams(window.location.search);
    const idFuncionario = Number(params.get('idFuncionario') || 0);
    const idUser = Number(params.get('idUser') || 0);
    const usuarioNome = String(params.get('usuarioNome') || '').trim();
    const funcionarioNome = String(params.get('funcionarioNome') || '').trim();
    const categoria = String(params.get('categoria') || '').trim();

    if (Number.isInteger(idFuncionario) && idFuncionario > 0)
        localStorage.setItem('idFuncionario', String(idFuncionario));

    if (Number.isInteger(idUser) && idUser > 0)
        localStorage.setItem('usuarioId', String(idUser));

    if (usuarioNome !== '')
        localStorage.setItem('usuarioNome', usuarioNome);

    if (funcionarioNome !== '')
        localStorage.setItem('funcionarioNome', funcionarioNome);

    if (categoria !== '')
        localStorage.setItem('funcionarioCategoria', categoria);
}

function formatarCargoInclusivo(categoria) {
    const valor = String(categoria || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    if (valor === 'coordenador')
        return 'Coordenador(a)';
    else if (valor === 'cuidador')
        return 'Cuidador(a)';
    else if (valor === 'secretaria')
        return 'Secretária(o)';
    else
        return String(categoria || '').trim();
}

async function preencherPerfilTopo() {
    let nome = (localStorage.getItem('funcionarioNome') || localStorage.getItem('usuarioNome') || 'Usuario').trim();
    let categoria = (localStorage.getItem('funcionarioCategoria') || '').trim();
    let cargoTexto = 'Acesso';

    try {
        const resposta = await fetch('/login/sessao', { credentials: 'include' });

        if (resposta.ok) {
            const funcionario = await resposta.json();

            if (String(funcionario.nome || '').trim() !== '')
                nome = String(funcionario.nome || '').trim();

            if (String(funcionario.categoria || '').trim() !== '')
                categoria = String(funcionario.categoria || '').trim();
        }
    } catch (erro) {
    }

    if (document.getElementById('perfilNome'))
        document.getElementById('perfilNome').textContent = nome || 'Usuario';

    if (categoria !== '')
        cargoTexto = formatarCargoInclusivo(categoria);

    if (document.getElementById('perfilCargo'))
        document.getElementById('perfilCargo').textContent = cargoTexto;
}

function textoSeguro(valor) {
    if (valor == null)
        return '';
    else
        return String(valor);
}

function exibirMensagem(tipo, mensagem) {
    const classe = document.getElementById('mensagem-feedback');

    if (classe) {

        classe.className = `popup-msg ${tipo}`;
        classe.textContent = mensagem;
        classe.classList.add('show');

        window.clearTimeout(exibirMensagem._timer);
        exibirMensagem._timer = window.setTimeout(() => {
            classe.classList.remove('show');
        }, 3200);

    }
}

function somenteDigitos(valor) {
    return String(valor || '').replace(/\D/g, '');
}

function formatarCpf(valor) {
    const numeros = somenteDigitos(valor).slice(0, 11);

    return numeros.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarTelefone(valor) {
    const numeros = somenteDigitos(valor).slice(0, 11);

    if (numeros.length <= 10)
        return numeros.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    else
        return numeros.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function carregarMoradores() {
    fetch('/morador/listar')
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar moradores.');

            return response.json();
        })
        .then(lista => {
            moradoresCarregados = [];

            if (Array.isArray(lista))
                moradoresCarregados = lista;
            carregarSelectMoradores();
        })
        .catch(error => console.error('Erro ao carregar moradores:', error));
}

function carregarVinculos() {
    let url = `${URL}/listarVinculos`;

    if (ordenacaoVinculos !== '')
        url += `?ordenacao=${encodeURIComponent(ordenacaoVinculos)}&direcao=${encodeURIComponent(direcaoOrdenacaoVinculos)}`;

    fetch(url)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar vinculos.');

            return response.json();
        })
        .then(lista => {
            vinculosCarregados = [];

            if (Array.isArray(lista))
                vinculosCarregados = lista;
            aplicarFiltroVinculos();
        })
        .catch(error => console.error('Erro ao listar vinculos:', error));
}

function carregarPessoasCadastradas() {
    let url = `${URL}/listarTodos`;

    if (ordenacaoPessoas !== '')
        url += `?ordenacao=${encodeURIComponent(ordenacaoPessoas)}&direcao=${encodeURIComponent(direcaoOrdenacaoPessoas)}`;

    fetch(url)
        .then(response => {
            if (!response.ok)
                throw new Error('Nao foi possivel carregar pessoas cadastradas.');

            return response.json();
        })
        .then(lista => {
            pessoasCadastradas = [];

            if (Array.isArray(lista))
                pessoasCadastradas = lista;
            aplicarFiltroExternos();
        })
        .catch(error => console.error('Erro ao carregar pessoas:', error));
}

function carregarSelectMoradores() {
    const select = document.getElementById('vinculoMoradorSelect');

    if (!select)
        return;

    select.innerHTML = '';

    if (moradoresCarregados.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhum morador cadastrado';
        select.appendChild(opt);
    }
    else {
        const optPlaceholder = document.createElement('option');
        optPlaceholder.value = '';
        optPlaceholder.textContent = 'Selecione um morador...';
        select.appendChild(optPlaceholder);

        moradoresCarregados.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.idMorador;
            opt.textContent = m.nome;
            select.appendChild(opt);
        });
    }
}


function aplicarFiltroVinculos() {
    const filtroMorador = document.getElementById('filtroVinculoMorador').value.trim().toLowerCase();
    const filtroFamiliar = document.getElementById('filtroVinculoFamiliar').value.trim().toLowerCase();
    const filtroVinculo = document.getElementById('filtroVinculoTipo').value.trim().toLowerCase();
    const filtroTelefone = document.getElementById('filtroVinculoTelefone').value.trim().toLowerCase();
    const filtroCpf = document.getElementById('filtroVinculoCpf').value.trim().toLowerCase();

    const filtrados = vinculosCarregados.filter(function (v) {
        const nomeMorador = textoSeguro(v.morador && v.morador.nome).toLowerCase();
        const nomeFamiliar = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.nome).toLowerCase();
        const vinculoTipo = textoSeguro(v.vinculo).toLowerCase();
        const telefoneFamiliar = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.telefone).toLowerCase();
        const cpfFamiliar = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.cpf).toLowerCase();
        let incluir = true;

        if (filtroMorador !== '' && !nomeMorador.includes(filtroMorador))
            incluir = false;
        else if (filtroFamiliar !== '' && !nomeFamiliar.includes(filtroFamiliar))
            incluir = false;
        else if (filtroVinculo !== '' && !vinculoTipo.includes(filtroVinculo))
            incluir = false;
        else if (filtroTelefone !== '' && !telefoneFamiliar.includes(filtroTelefone))
            incluir = false;
        else if (filtroCpf !== '' && !cpfFamiliar.includes(filtroCpf))
            incluir = false;

        return incluir;
    });

    renderizarVinculos(filtrados);
}

function abrirFiltrosVinculos() {
    const painel = document.getElementById('filtroVinculos');

    if (painel)
        painel.hidden = false;
}

function fecharFiltrosVinculos() {
    const painel = document.getElementById('filtroVinculos');

    if (painel)
        painel.hidden = true;
}

function limparFiltrosVinculos() {
    document.getElementById('filtroVinculoMorador').value = '';
    document.getElementById('filtroVinculoFamiliar').value = '';
    document.getElementById('filtroVinculoTipo').value = '';
    document.getElementById('filtroVinculoTelefone').value = '';
    document.getElementById('filtroVinculoCpf').value = '';

    aplicarFiltroVinculos();
}

function aplicarFiltroExternos() {
    const filtroNome = document.getElementById('filtroExternoNome').value.trim().toLowerCase();
    const filtroTelefone = document.getElementById('filtroExternoTelefone').value.trim().toLowerCase();
    const filtroCpf = document.getElementById('filtroExternoCpf').value.trim().toLowerCase();

    const filtradas = pessoasCadastradas.filter(function (p) {
        const nomePessoa = textoSeguro(p.nome).toLowerCase();
        const telefonePessoa = textoSeguro(p.telefone).toLowerCase();
        const cpfPessoa = textoSeguro(p.cpf).toLowerCase();
        let incluir = true;

        if (filtroNome !== '' && !nomePessoa.includes(filtroNome))
            incluir = false;
        else if (filtroTelefone !== '' && !telefonePessoa.includes(filtroTelefone))
            incluir = false;
        else if (filtroCpf !== '' && !cpfPessoa.includes(filtroCpf))
            incluir = false;

        return incluir;
    });

    renderizarPessoasCadastradas(filtradas);
}

function abrirFiltrosExternos() {
    const painel = document.getElementById('filtroExternos');

    if (painel)
        painel.hidden = false;
}

function fecharFiltrosExternos() {
    const painel = document.getElementById('filtroExternos');

    if (painel)
        painel.hidden = true;
}

function limparFiltrosExternos() {
    document.getElementById('filtroExternoNome').value = '';
    document.getElementById('filtroExternoTelefone').value = '';
    document.getElementById('filtroExternoCpf').value = '';

    aplicarFiltroExternos();
}

function renderizarVinculos(lista) {
    const tbody = document.getElementById('listaFamiliaresBody');

    if (!tbody)
        return;

    tbody.innerHTML = '';
    atualizarIndicadoresOrdenacaoVinculos();

    let listaVinculos = [];

    if (Array.isArray(lista))
        listaVinculos = lista;

    listaVinculos.forEach(v => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = textoSeguro(v.morador && v.morador.nome);
        row.insertCell(1).textContent = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.nome);
        row.insertCell(2).textContent = textoSeguro(v.vinculo);
        row.insertCell(3).textContent = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.telefone);
        row.insertCell(4).textContent = textoSeguro(v.composicaoFamiliar && v.composicaoFamiliar.cpf);

        const acoes = row.insertCell(5);
        acoes.classList.add('morador-actions-cell');

        const btnDesvincular = document.createElement('button');
        btnDesvincular.type = 'button';
        btnDesvincular.classList.add('morador-row-btn', 'danger');
        btnDesvincular.setAttribute('aria-label', 'Desvincular');
        btnDesvincular.innerHTML = '<span class="material-symbols-outlined">link_off</span>';
        btnDesvincular.onclick = () => desvincularFamiliar(v.morador.idMorador, v.composicaoFamiliar.idComposicaoFamiliar);

        acoes.appendChild(btnDesvincular);
    });
}

function renderizarPessoasCadastradas(pessoas) {
    const tbody = document.getElementById('listaExternosBody');

    if (!tbody)
        return;

    tbody.innerHTML = '';
    atualizarIndicadoresOrdenacaoPessoas();

    let listaPessoas = [];

    if (Array.isArray(pessoas))
        listaPessoas = pessoas;

    listaPessoas.forEach(p => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = p.idComposicaoFamiliar;
        row.insertCell(1).textContent = textoSeguro(p.nome);
        row.insertCell(2).textContent = textoSeguro(p.telefone);
        row.insertCell(3).textContent = textoSeguro(p.cpf);

        const acoes = row.insertCell(4);
        acoes.classList.add('morador-actions-cell');

        const btnVincular = document.createElement('button');
        btnVincular.type = 'button';
        btnVincular.classList.add('morador-row-btn');
        btnVincular.setAttribute('aria-label', 'Vincular');
        btnVincular.innerHTML = '<span class="material-symbols-outlined">link</span>';
        btnVincular.onclick = () => vincularFamiliar(p.idComposicaoFamiliar);

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.classList.add('morador-row-btn', 'danger');
        btnExcluir.setAttribute('aria-label', 'Excluir');
        btnExcluir.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnExcluir.onclick = () => excluirPessoa(p.idComposicaoFamiliar);

        acoes.appendChild(btnVincular);
        acoes.appendChild(btnExcluir);
    });
}

function inicializarPaginaComposicaoFamiliar() {
    carregarMoradores();
    carregarPessoasCadastradas();
    carregarVinculos();

    window.setTimeout(function () {
        const tbodyVinculos = document.getElementById('listaFamiliaresBody');
        const tbodyPessoas = document.getElementById('listaExternosBody');

        if (tbodyVinculos && tbodyVinculos.children.length === 0)
            carregarVinculos();

        if (tbodyPessoas && tbodyPessoas.children.length === 0)
            carregarPessoasCadastradas();
    }, 400);
}

function salvarPessoa(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const telefone = formatarTelefone(document.getElementById('telefone').value);
    const cpf = formatarCpf(document.getElementById('cpf').value);

    document.getElementById('telefone').value = telefone;
    document.getElementById('cpf').value = cpf;

    const url = `${URL}/cadastrar?nome=${encodeURIComponent(nome)}&telefone=${encodeURIComponent(telefone)}&cpf=${encodeURIComponent(cpf)}`;

    fetch(url, { method: 'POST' })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(resultado => {
            if (!resultado.ok)
                exibirMensagem('error', resultado.data.descricao);
            else {
                exibirMensagem('success', 'Pessoa cadastrada com sucesso!');
                carregarPessoasCadastradas();
                esconderFormulario();
            }
        })
        .catch(error => console.error('Erro ao cadastrar pessoa:', error));
}

function vincularFamiliar(familiarId) {
    const pessoa = pessoasCadastradas.find(p => p.idComposicaoFamiliar === familiarId);

    if (!pessoa)
        exibirMensagem('error', 'Pessoa não encontrada.');
    else
        mostrarFormularioVinculo(pessoa);
}

function confirmarVinculo(event) {
    event.preventDefault();

    const familiarId = document.getElementById('vinculoFamiliarId').value;
    const moradorId = document.getElementById('vinculoMoradorSelect').value;
    const vinculo = document.getElementById('vinculoTipo').value.trim();

    if (moradorId === '')
        exibirMensagem('error', 'Selecione um morador.');
    else
    if (vinculo === '')
        exibirMensagem('error', 'Informe o vínculo.');
    else {

        const url = `${URL}/relacionar?moradorId=${moradorId}&familiarId=${familiarId}&vinculo=${encodeURIComponent(vinculo)}`;

        fetch(url, { method: 'POST' })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(resultado => {
                if (!resultado.ok)
                    exibirMensagem('error', resultado.data.descricao);
                else {
                    exibirMensagem('success', 'Vínculo criado com sucesso!');
                    esconderFormularioVinculo();
                    carregarVinculos();
                }
            })
            .catch(error => console.error('Erro ao relacionar:', error));
    }

}

function desvincularFamiliar(moradorId, familiarId) {
    if (confirm('Remover o vínculo deste familiar com o morador?')) {
        fetch(`${URL}/desvincular?moradorId=${moradorId}&familiarId=${familiarId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) {
                    response.json().then(data => exibirMensagem('error', data.descricao));
                }
                else {
                    carregarVinculos();
                }
            })
            .catch(error => console.error('Erro ao desvincular:', error));
    }
}

function excluirPessoa(id) {
    if (confirm('Excluir esta pessoa do cadastro? (só permitido se não houver vínculos)')) {
        fetch(`${URL}/${id}`, { method: 'DELETE' })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(resultado => {
                if (!resultado.ok)
                    exibirMensagem('error', resultado.data.descricao);

                carregarPessoasCadastradas();
            })
            .catch(error => console.error('Erro ao excluir:', error));
    }
}

function mostrarFormulario(titulo = 'Cadastrar Nova Pessoa') {
    document.getElementById('formTitle').textContent = titulo;
    document.getElementById('formContainer').style.display = 'block';
}

function esconderFormulario() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('famForm').reset();
}

function mostrarFormularioVinculo(pessoa) {
    document.getElementById('vinculoFamiliarId').value = pessoa.idComposicaoFamiliar;
    document.getElementById('vinculoPessoaNome').value = pessoa.nome;
    document.getElementById('vinculoMoradorSelect').value = '';
    document.getElementById('vinculoTipo').value = '';
    document.getElementById('vinculoFormContainer').style.display = 'block';
    document.getElementById('vinculoMoradorSelect').focus();
}

function esconderFormularioVinculo() {
    document.getElementById('vinculoFormContainer').style.display = 'none';
    document.getElementById('vinculoForm').reset();
}

function limparIndicadoresOrdenacaoVinculos() {
    document.getElementById('sort-vinculo-morador').textContent = '';
    document.getElementById('sort-vinculo-familiar').textContent = '';
    document.getElementById('sort-vinculo-vinculo').textContent = '';
    document.getElementById('sort-vinculo-cpf').textContent = '';

    document.getElementById('th-vinculo-morador').classList.remove('is-active');
    document.getElementById('th-vinculo-familiar').classList.remove('is-active');
    document.getElementById('th-vinculo-vinculo').classList.remove('is-active');
    document.getElementById('th-vinculo-cpf').classList.remove('is-active');
}

function atualizarIndicadoresOrdenacaoVinculos() {
    let indicador;
    let th;

    limparIndicadoresOrdenacaoVinculos();

    if (ordenacaoVinculos !== '') {
        indicador = document.getElementById(`sort-vinculo-${ordenacaoVinculos}`);
        th = document.getElementById(`th-vinculo-${ordenacaoVinculos}`);

        if (direcaoOrdenacaoVinculos === 'asc')
            indicador.textContent = '^';
        else
            indicador.textContent = 'v';

        th.classList.add('is-active');
    }
}

function definirOrdenacaoVinculos(campo) {
    if (ordenacaoVinculos === campo) {
        if (direcaoOrdenacaoVinculos === 'asc')
            direcaoOrdenacaoVinculos = 'desc';
        else
            direcaoOrdenacaoVinculos = 'asc';
    }
    else {
        ordenacaoVinculos = campo;
        direcaoOrdenacaoVinculos = 'asc';
    }

    carregarVinculos();
}

function limparIndicadoresOrdenacaoPessoas() {
    document.getElementById('sort-pessoa-id').textContent = '';
    document.getElementById('sort-pessoa-nome').textContent = '';
    document.getElementById('sort-pessoa-cpf').textContent = '';

    document.getElementById('th-pessoa-id').classList.remove('is-active');
    document.getElementById('th-pessoa-nome').classList.remove('is-active');
    document.getElementById('th-pessoa-cpf').classList.remove('is-active');
}

function atualizarIndicadoresOrdenacaoPessoas() {
    let indicador;
    let th;

    limparIndicadoresOrdenacaoPessoas();

    if (ordenacaoPessoas !== '') {
        indicador = document.getElementById(`sort-pessoa-${ordenacaoPessoas}`);
        th = document.getElementById(`th-pessoa-${ordenacaoPessoas}`);

        if (direcaoOrdenacaoPessoas === 'asc')
            indicador.textContent = '^';
        else
            indicador.textContent = 'v';

        th.classList.add('is-active');
    }
}

function definirOrdenacaoPessoas(campo) {
    if (ordenacaoPessoas === campo) {
        if (direcaoOrdenacaoPessoas === 'asc')
            direcaoOrdenacaoPessoas = 'desc';
        else
            direcaoOrdenacaoPessoas = 'asc';
    }
    else {
        ordenacaoPessoas = campo;
        direcaoOrdenacaoPessoas = 'asc';
    }

    carregarPessoasCadastradas();
}

document.addEventListener('DOMContentLoaded', carregarContextoUrl);
document.addEventListener('DOMContentLoaded', preencherPerfilTopo);
document.addEventListener('DOMContentLoaded', inicializarPaginaComposicaoFamiliar);
