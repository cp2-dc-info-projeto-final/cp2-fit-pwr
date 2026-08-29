-- =========================================================
-- APAGA AS TABELAS EXISTENTES
-- =========================================================

DROP TABLE IF EXISTS turma_aluno CASCADE;
DROP TABLE IF EXISTS turma CASCADE;
DROP TABLE IF EXISTS modalidade CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS aula CASCADE;
DROP TABLE IF EXISTS exercicio CASCADE;
DROP TABLE IF EXISTS plano_treino CASCADE;
DROP TABLE IF EXISTS treino CASCADE;
DROP TABLE IF EXISTS treino_exercicio CASCADE;


-- =========================================================
-- USUÁRIO
-- =========================================================

CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    login TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,

    horario TEXT NOT NULL DEFAULT 'manhã',

    -- user = aluno
    -- professor = professor
    -- admin = administrador
    role TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT pk_usuario
        PRIMARY KEY (id),

    CONSTRAINT uk_usuario_login
        UNIQUE (login),

    CONSTRAINT uk_usuario_email
        UNIQUE (email),

    CONSTRAINT ck_usuario_login_length
        CHECK (
            length(login) >= 3
            AND length(login) <= 50
        ),

    CONSTRAINT ck_usuario_email_format
        CHECK (
            email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        ),

    CONSTRAINT ck_usuario_senha_length
        CHECK (
            length(senha) >= 6
        ),

    CONSTRAINT ck_usuario_horario_valid
        CHECK (
            horario IN ('manhã', 'tarde', 'noite')
        ),

    CONSTRAINT ck_usuario_role_valid
        CHECK (
            role IN ('admin', 'user', 'professor')
        )
);


-- =========================================================
-- MODALIDADE
-- =========================================================

CREATE TABLE modalidade (
    id_modalidade BIGINT GENERATED ALWAYS AS IDENTITY,

    nome TEXT NOT NULL,

    CONSTRAINT pk_modalidade
        PRIMARY KEY (id_modalidade),

    CONSTRAINT uk_modalidade_nome
        UNIQUE (nome)
);


-- =========================================================
-- TURMA
-- =========================================================

CREATE TABLE turma (
    id_turma BIGINT GENERATED ALWAYS AS IDENTITY,

    id_professor BIGINT NOT NULL,
    id_modalidade BIGINT NOT NULL,

    horario TEXT NOT NULL,

    CONSTRAINT pk_turma
        PRIMARY KEY (id_turma),

    CONSTRAINT fk_turma_professor
        FOREIGN KEY (id_professor)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_turma_modalidade
        FOREIGN KEY (id_modalidade)
        REFERENCES modalidade(id_modalidade)
        ON DELETE CASCADE,

    CONSTRAINT ck_turma_horario_valid
        CHECK (
            horario ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
        )
);


-- =========================================================
-- RELAÇÃO TURMA / ALUNO
-- =========================================================

CREATE TABLE turma_aluno (
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_turma BIGINT NOT NULL,
    id_aluno BIGINT NOT NULL,

    CONSTRAINT pk_turma_aluno
        PRIMARY KEY (id),

    CONSTRAINT fk_turma_aluno_turma
        FOREIGN KEY (id_turma)
        REFERENCES turma(id_turma)
        ON DELETE CASCADE,

    CONSTRAINT fk_turma_aluno_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_turma_aluno
        UNIQUE (id_turma, id_aluno)
);


-- =========================================================
-- EXERCÍCIO
-- =========================================================

CREATE TABLE exercicio (
    id_exercicio BIGINT GENERATED ALWAYS AS IDENTITY,

    nome TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    descricao TEXT,
    imagem TEXT,

    CONSTRAINT pk_exercicio
        PRIMARY KEY (id_exercicio),

    CONSTRAINT uk_exercicio_nome
        UNIQUE (nome)
);


-- =========================================================
-- PLANO DE TREINO
-- =========================================================

CREATE TABLE plano_treino (
    id_plano BIGINT GENERATED ALWAYS AS IDENTITY,

    id_usuario BIGINT NOT NULL,
    nome TEXT NOT NULL,
    id_professor BIGINT NOT NULL,
    descricao TEXT,

    CONSTRAINT pk_plano_treino
        PRIMARY KEY (id_plano),

    CONSTRAINT fk_plano_treino_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_plano_treino_professor
        FOREIGN KEY (id_professor)
        REFERENCES usuario(id)
        ON DELETE CASCADE
);


-- =========================================================
-- TREINO
-- =========================================================

CREATE TABLE treino (
    id_treino BIGINT GENERATED ALWAYS AS IDENTITY,

    id_plano BIGINT NOT NULL,

    nome TEXT NOT NULL,

    dia_semana TEXT NOT NULL,

    CONSTRAINT pk_treino
        PRIMARY KEY (id_treino),

    CONSTRAINT fk_treino_plano
        FOREIGN KEY (id_plano)
        REFERENCES plano_treino(id_plano)
        ON DELETE CASCADE,

    CONSTRAINT ck_treino_dia_valid
        CHECK (
            dia_semana IN (
                'segunda',
                'terça',
                'quarta',
                'quinta',
                'sexta',
                'sábado',
                'domingo'
            )
        )
);


-- =========================================================
-- EXERCÍCIOS DO TREINO
-- =========================================================

CREATE TABLE treino_exercicio (
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_treino BIGINT NOT NULL,
    id_exercicio BIGINT NOT NULL,

    series INTEGER NOT NULL,
    repeticoes INTEGER NOT NULL,

    carga NUMERIC(6,2),

    descanso INTEGER NOT NULL DEFAULT 60,

    ordem INTEGER NOT NULL,

    observacao TEXT,

    CONSTRAINT pk_treino_exercicio
        PRIMARY KEY (id),

    CONSTRAINT fk_treino_exercicio_treino
        FOREIGN KEY (id_treino)
        REFERENCES treino(id_treino)
        ON DELETE CASCADE,

    CONSTRAINT fk_treino_exercicio_exercicio
        FOREIGN KEY (id_exercicio)
        REFERENCES exercicio(id_exercicio)
        ON DELETE CASCADE,

    CONSTRAINT ck_treino_exercicio_series
        CHECK (series > 0),

    CONSTRAINT ck_treino_exercicio_repeticoes
        CHECK (repeticoes > 0),

    CONSTRAINT ck_treino_exercicio_carga
        CHECK (
            carga IS NULL
            OR carga >= 0
        ),

    CONSTRAINT ck_treino_exercicio_descanso
        CHECK (descanso >= 0),

    CONSTRAINT ck_treino_exercicio_ordem
        CHECK (ordem > 0),

    CONSTRAINT uk_treino_exercicio_ordem
        UNIQUE (id_treino, ordem)
);


-- =========================================================
-- USUÁRIOS INICIAIS
-- =========================================================

INSERT INTO usuario (
    login,
    email,
    senha,
    horario,
    role
)
VALUES
(
    'hermenegildo',
    'hermenegildo@email.com',
    '$2a$12$f2c.uHGHS4drfaz6HR870OLamkarD57kI.gkr4//Vbbp0vN9IrFfG',
    'manhã',
    'admin'
),
(
    'zoroastra',
    'zoroastra@email.com',
    '$2a$12$f2c.uHGHS4drfaz6HR870OLamkarD57kI.gkr4//Vbbp0vN9IrFfG',
    'noite',
    'user'
);