const API_URL = 'http://localhost:3000/api/alunos';

const form = document.getElementById('aluno-form');
const tbody = document.getElementById('alunos-tbody');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const formTitle = document.getElementById('form-title');

const inputId = document.getElementById('aluno-id');
const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputCurso = document.getElementById('curso');
const inputCpf = document.getElementById('cpf');
const inputNumero = document.getElementById('numero');

let editandoId = null;

// LISTAR ALUNOS
async function carregarAlunos() {
    try {
        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error('Não foi possível carregar os alunos.');
        }

        const alunos = await resposta.json();
        tbody.replaceChildren();

        if (!Array.isArray(alunos) || alunos.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');

            td.colSpan = 7;
            td.textContent = 'Nenhum aluno cadastrado.';
            td.style.textAlign = 'center';

            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        alunos.forEach(aluno => {
            const tr = document.createElement('tr');

            // Os valores seguem a mesma ordem dos cabeçalhos do HTML.
            const valores = [
                `#${aluno.id ?? ''}`,
                aluno.nome ?? '',
                aluno.email ?? '',
                aluno.curso ?? '',
                aluno.cpf ?? '',
                aluno.numero ?? aluno.telefone ?? ''
            ];

            valores.forEach(valor => {
                const td = document.createElement('td');
                td.textContent = String(valor);
                tr.appendChild(td);
            });

            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'actions';

            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn-icon btn-edit';
            btnEditar.textContent = 'Editar';

            btnEditar.addEventListener('click', () => {
                iniciarEdicao(aluno);
            });

            const btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'btn-icon btn-delete';
            btnExcluir.textContent = 'Excluir';

            btnExcluir.addEventListener('click', () => {
                deletarAluno(aluno.id);
            });

            tdAcoes.append(btnEditar, btnExcluir);
            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });

    } catch (erro) {
        console.error('Erro ao buscar alunos:', erro);
        alert('Erro ao carregar alunos. Confira se o servidor está ligado.');
    }
}

// CADASTRAR OU ATUALIZAR
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const aluno = {
        nome: inputNome.value.trim(),
        email: inputEmail.value.trim(),
        curso: inputCurso.value,
        cpf: inputCpf.value.trim(),
        numero: inputNumero.value.trim()
    };

    if (Object.values(aluno).some(valor => !valor)) {
        alert('Preencha todos os campos.');
        return;
    }

    const idAtual = editandoId;
    const editando = idAtual !== null;

    const url = editando
        ? `${API_URL}/${idAtual}`
        : API_URL;

    try {
        btnSave.disabled = true;
        btnSave.textContent = editando ? 'Atualizando...' : 'Salvando...';

        const resposta = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aluno)
        });

        const resultado = resposta.status === 204
            ? null
            : await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado?.erro || 'Não foi possível salvar o aluno.'
            );
        }

        resetarFormulario();
        await carregarAlunos();

        alert(
            editando
                ? 'Aluno atualizado com sucesso!'
                : 'Aluno cadastrado com sucesso!'
        );

    } catch (erro) {
        console.error('Erro ao salvar aluno:', erro);
        alert(erro.message || 'Erro de conexão com o servidor.');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = editandoId !== null
            ? 'Atualizar aluno'
            : 'Salvar aluno';
    }
});

// INICIAR EDIÇÃO
function iniciarEdicao(aluno) {
    editandoId = aluno.id;

    inputId.value = aluno.id ?? '';
    inputNome.value = aluno.nome ?? '';
    inputEmail.value = aluno.email ?? '';
    inputCurso.value = aluno.curso ?? '';
    inputCpf.value = aluno.cpf ?? '';
    inputNumero.value = aluno.numero ?? aluno.telefone ?? '';

    formTitle.textContent = 'Editar aluno';
    btnSave.textContent = 'Atualizar aluno';
    btnCancel.style.display = 'inline-block';

    form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// EXCLUIR ALUNO
async function deletarAluno(id) {
    if (!confirm(`Tem certeza que deseja excluir o aluno #${id}?`)) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!resposta.ok) {
            let resultado = {};

            try {
                resultado = await resposta.json();
            } catch {
                // A resposta pode não conter JSON.
            }

            throw new Error(
                resultado.erro || 'Não foi possível excluir o aluno.'
            );
        }

        if (String(editandoId) === String(id)) {
            resetarFormulario();
        }

        await carregarAlunos();
        alert('Aluno excluído com sucesso!');

    } catch (erro) {
        console.error('Erro ao excluir aluno:', erro);
        alert(erro.message || 'Erro ao excluir aluno.');
    }
}

// LIMPAR FORMULÁRIO
function resetarFormulario() {
    editandoId = null;
    form.reset();
    inputId.value = '';

    formTitle.textContent = 'Novo Aluno';
    btnSave.textContent = 'Salvar aluno';
    btnCancel.style.display = 'none';
}

btnCancel.addEventListener('click', resetarFormulario);

// INICIAR
carregarAlunos();