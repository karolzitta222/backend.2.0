const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// BANCO DE DADOS
function lerBancoDeDados() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(
            DB_FILE,
            JSON.stringify({ alunos: [] }, null, 2),
            'utf-8'
        );
    }

    const data = fs.readFileSync(DB_FILE, 'utf-8');

    if (!data.trim()) {
        return { alunos: [] };
    }

    const banco = JSON.parse(data);

    if (!Array.isArray(banco.alunos)) {
        banco.alunos = [];
    }

    // Compatibilidade com registros antigos.
    banco.alunos = banco.alunos.map(aluno => ({
        ...aluno,
        cpf: aluno.cpf ?? aluno.CPF ?? '',
        numero: aluno.numero ?? aluno.telefone ?? aluno.telefone_numero ?? ''
    }));

    return banco;
}

function salvarBancoDados(dados) {
    try {
        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(dados, null, 2),
            'utf-8'
        );

        return true;
    } catch (erro) {
        console.error('Erro ao salvar banco:', erro);
        return false;
    }
}

// VALIDAR CAMPOS
function validarAluno(dados) {
    const { nome, email, curso, cpf, numero } = dados;

    return [
        nome,
        email,
        curso,
        cpf,
        numero
    ].every(valor =>
        typeof valor === 'string' && valor.trim().length > 0
    );
}

// CADASTRAR ALUNO
app.post('/api/alunos', (req, res) => {
    try {
        const { nome, email, curso, cpf, numero } = req.body;

        if (!validarAluno(req.body)) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios!'
            });
        }

        const db = lerBancoDeDados();

        const nextId = db.alunos.length
            ? Math.max(...db.alunos.map(a => Number(a.id) || 0)) + 1
            : 1;

        const novoAluno = {
            id: nextId,
            nome: nome.trim(),
            email: email.trim(),
            curso: curso.trim(),
            cpf: cpf.trim(),
            numero: numero.trim()
        };

        db.alunos.push(novoAluno);

        if (!salvarBancoDados(db)) {
            return res.status(500).json({
                erro: 'Não foi possível salvar o aluno.'
            });
        }

        return res.status(201).json(novoAluno);

    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
});

// LISTAR ALUNOS
app.get('/api/alunos', (req, res) => {
    try {
        const db = lerBancoDeDados();
        return res.json(db.alunos);

    } catch (erro) {
        console.error('Erro ao listar:', erro);

        return res.status(500).json({
            erro: 'Erro ao buscar alunos.'
        });
    }
});

// ATUALIZAR ALUNO
app.put('/api/alunos/:id', (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const { nome, email, curso, cpf, numero } = req.body;

        if (!validarAluno(req.body)) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios!'
            });
        }

        const db = lerBancoDeDados();

        const index = db.alunos.findIndex(
            aluno => Number(aluno.id) === id
        );

        if (index === -1) {
            return res.status(404).json({
                erro: 'Aluno não encontrado!'
            });
        }

        db.alunos[index] = {
            ...db.alunos[index],
            nome: nome.trim(),
            email: email.trim(),
            curso: curso.trim(),
            cpf: cpf.trim(),
            numero: numero.trim()
        };

        if (!salvarBancoDados(db)) {
            return res.status(500).json({
                erro: 'Não foi possível atualizar o aluno.'
            });
        }

        return res.json(db.alunos[index]);

    } catch (erro) {
        console.error('Erro ao atualizar:', erro);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
});

// EXCLUIR ALUNO
app.delete('/api/alunos/:id', (req, res) => {
    try {
        const id = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const db = lerBancoDeDados();

        const index = db.alunos.findIndex(
            aluno => Number(aluno.id) === id
        );

        if (index === -1) {
            return res.status(404).json({
                erro: 'Aluno não encontrado!'
            });
        }

        db.alunos.splice(index, 1);

        if (!salvarBancoDados(db)) {
            return res.status(500).json({
                erro: 'Não foi possível excluir o aluno.'
            });
        }

        return res.status(204).send();

    } catch (erro) {
        console.error('Erro ao excluir:', erro);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Banco de dados: ${DB_FILE}`);
});