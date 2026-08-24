DROP TABLE IF EXISTS turma_aluno CASCADE;
DROP TABLE IF EXISTS turma CASCADE;
DROP TABLE IF EXISTS modalidade CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS aula CASCADE;

CREATE TABLE usuario (
    id bigint GENERATED ALWAYS AS IDENTITY,
    login text NOT NULL,
    email text NOT NULL,
    senha text NOT NULL,
    horario text NOT NULL DEFAULT 'manhã',
    role text NOT NULL DEFAULT 'user', -- user, nesse caso, é o aluno, professor e admin são outros tipos de usuário

    
    -- Constraints
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_login UNIQUE (login), -- unicidade
    CONSTRAINT uk_usuario_email UNIQUE (email), -- unicidade
    CONSTRAINT ck_usuario_login_length CHECK (length(login) >= 3 AND length(login) <= 50), -- comprimento
    CONSTRAINT ck_usuario_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- formato de email com expressão regular
    CONSTRAINT ck_usuario_senha_length CHECK (length(senha) >= 6), -- comprimento mínimo
    CONSTRAINT ck_usuario_horario_valid CHECK (horario IN ('manhã','tarde','noite')), -- tipos de usuário
    CONSTRAINT ck_usuario_role_valid CHECK (role IN ('admin', 'user', 'professor')) -- tipos de usuário
);

CREATE TABLE modalidade (
    id_modalidade BIGINT GENERATED ALWAYS AS IDENTITY,
    nome TEXT NOT NULL,

    CONSTRAINT pk_modalidade PRIMARY KEY (id_modalidade),
    CONSTRAINT uk_modalidade_nome UNIQUE (nome) -- unicidade
);

CREATE TABLE turma (
    id_turma BIGINT GENERATED ALWAYS AS IDENTITY,
    id_professor BIGINT NOT NULL,
    id_modalidade BIGINT NOT NULL,
    horario TEXT NOT NULL,

    CONSTRAINT pk_turma PRIMARY KEY (id_turma),
    CONSTRAINT fk_turma_professor FOREIGN KEY (id_professor) REFERENCES usuario(id),
    CONSTRAINT fk_turma_modalidade FOREIGN KEY (id_modalidade) REFERENCES modalidade(id_modalidade),
    CONSTRAINT ck_turma_horario_valid CHECK (horario IN ('manhã','tarde','noite')) -- tipos de horário
);

CREATE TABLE turma_aluno (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_turma BIGINT NOT NULL,
    id_aluno BIGINT NOT NULL,

    CONSTRAINT pk_turma_aluno PRIMARY KEY (id),
    CONSTRAINT fk_turma_aluno_turma FOREIGN KEY (id_turma) REFERENCES turma(id_turma),
    CONSTRAINT fk_turma_aluno_aluno FOREIGN KEY (id_aluno) REFERENCES usuario(id)
);

INSERT INTO usuario (login, email, senha, horario, role ) VALUES
-- senha efelantinho
('hermenegildo', 'hermenegildo@email.com', '$2a$12$f2c.uHGHS4drfaz6HR870OLamkarD57kI.gkr4//Vbbp0vN9IrFfG','manhã', 'admin'),
('zoroastra', 'zoroastra@email.com', '$2a$12$f2c.uHGHS4drfaz6HR870OLamkarD57kI.gkr4//Vbbp0vN9IrFfG','noite', 'user');

CREATE TABLE aula (
    id_aula BIGINT GENERATED ALWAYS AS IDENTITY,
    nome TEXT NOT NULL,
    dia_semana TEXT NOT NULL,
    horario TEXT NOT NULL,
    id_usuario BIGINT NOT NULL,

    CONSTRAINT pk_aula PRIMARY KEY (id_aula),
    CONSTRAINT fk_aula_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),

    CONSTRAINT ck_aula_dia_semana_valid
        CHECK (dia_semana IN (
            'segunda',
            'terça',
            'quarta',
            'quinta',
            'sexta',
            'sábado',
            'domingo'
        ))
);