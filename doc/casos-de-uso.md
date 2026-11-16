# Documento de Casos de Uso – CP2 FIT

## Lista dos Casos de Uso

- [CDU 01](#cdu-01): Realizar cadastro e login no sistema.
- [CDU 02](#cdu-02): Realizar matrícula na academia.
- [CDU 03](#cdu-03): Consultar aulas e realizar inscrição em turmas.
- [CDU 04](#cdu-04): Gerenciar aulas e turmas.
- [CDU 05](#cdu-05): Criar e gerenciar planos de treino.
- [CDU 06](#cdu-06): Gerenciar usuários.
- [CDU 07](#cdu-07): Gerenciar modalidades.

## Lista dos Atores

- **Aluno:** usuário que realiza matrícula, consulta aulas, inscreve-se em turmas e acompanha seus planos de treino.
- **Professor:** profissional responsável por organizar aulas, gerenciar suas turmas e criar planos de treino para os alunos.
- **Administrador:** responsável pelo gerenciamento geral do sistema, incluindo usuários, professores, modalidades, aulas e turmas.

## Descrição dos Casos de Uso

### CDU 01 – Realizar cadastro e login no sistema

O usuário realiza seu cadastro na plataforma ou acessa sua conta utilizando suas credenciais.

#### Atores

1. Aluno.
2. Professor.
3. Administrador.

#### Fluxo Principal

1. O usuário acessa a página inicial do CP2 FIT.
2. O usuário seleciona a opção de cadastro ou login.
3. Caso escolha o cadastro, informa os dados solicitados pelo sistema.
4. O sistema valida as informações fornecidas.
5. O sistema registra o novo usuário.
6. Caso escolha o login, o usuário informa seu nome de usuário e senha.
7. O sistema verifica as credenciais.
8. O sistema autentica o usuário e libera o acesso de acordo com seu perfil.

#### Fluxo Alternativo A – Dados inválidos no cadastro

1. O usuário informa dados incorretos ou deixa campos obrigatórios vazios.
2. O sistema identifica os erros.
3. O sistema apresenta uma mensagem informando os problemas encontrados.
4. O usuário corrige as informações e tenta realizar o cadastro novamente.

#### Fluxo Alternativo B – Falha no login

1. O usuário informa credenciais incorretas.
2. O sistema verifica que os dados não correspondem a uma conta válida.
3. O sistema apresenta uma mensagem de erro.
4. O usuário pode informar novamente suas credenciais.

#### Fluxo Alternativo C – Aluno sem matrícula

1. O aluno realiza o login corretamente.
2. O sistema verifica a situação da matrícula.
3. O sistema identifica que o aluno não possui matrícula ativa.
4. O sistema direciona o aluno para a página de matrícula.

---

### CDU 02 – Realizar matrícula na academia

O aluno realiza sua matrícula para ter acesso aos serviços e atividades oferecidos pela academia.

#### Atores

1. Aluno.
2. Sistema.

#### Fluxo Principal

1. O aluno acessa a página de matrícula.
2. O sistema apresenta o plano disponível.
3. O aluno consulta o valor e os benefícios oferecidos.
4. O aluno seleciona a opção para realizar a matrícula.
5. O sistema solicita os dados necessários para a matrícula.
6. O aluno preenche as informações solicitadas.
7. O sistema valida os dados.
8. O sistema registra a matrícula.
9. O aluno passa a ter acesso às funcionalidades destinadas aos usuários matriculados.

#### Fluxo Alternativo A – Dados de pagamento inválidos

1. O aluno informa dados incorretos no formulário de matrícula.
2. O sistema identifica que as informações são inválidas.
3. O sistema apresenta uma mensagem de erro.
4. O aluno corrige os dados e tenta novamente.

#### Fluxo Alternativo B – Matrícula já existente

1. O aluno acessa a página de matrícula.
2. O sistema verifica que já existe uma matrícula ativa.
3. O sistema informa que o aluno já está matriculado.
4. O aluno é direcionado para a área correspondente à sua conta.

---

### CDU 03 – Consultar aulas e realizar inscrição em turmas

O aluno consulta as aulas disponíveis e pode realizar sua inscrição nas turmas oferecidas pela academia.

#### Atores

1. Aluno.
2. Sistema.

#### Fluxo Principal

1. O aluno realiza login no sistema.
2. O aluno acessa a área de aulas.
3. O sistema apresenta as aulas e turmas disponíveis.
4. O aluno consulta as modalidades, os horários e os professores responsáveis.
5. O aluno seleciona a turma desejada.
6. O aluno solicita sua inscrição.
7. O sistema registra a inscrição na turma.
8. O sistema confirma a inscrição ao aluno.

#### Fluxo Alternativo A – Aluno já inscrito

1. O aluno seleciona uma turma na qual já está inscrito.
2. O sistema identifica a inscrição existente.
3. O sistema informa que o aluno já faz parte daquela turma.
4. Nenhuma nova inscrição é realizada.

#### Fluxo Alternativo B – Cancelamento de inscrição

1. O aluno acessa a área de aulas.
2. O aluno localiza uma turma na qual está inscrito.
3. O aluno seleciona a opção de cancelar inscrição.
4. O sistema solicita a confirmação da ação, caso disponível.
5. O sistema remove a inscrição.
6. O sistema atualiza as informações da turma.

---

### CDU 04 – Gerenciar aulas e turmas

O professor ou administrador realiza o gerenciamento das aulas e turmas disponíveis na academia.

#### Atores

1. Professor.
2. Administrador.
3. Sistema.

#### Fluxo Principal

1. O professor ou administrador realiza login no sistema.
2. O usuário acessa a área de gerenciamento de aulas ou turmas.
3. O sistema apresenta os registros disponíveis de acordo com as permissões do usuário.
4. O usuário seleciona a opção de criar uma nova aula ou turma.
5. O sistema apresenta o formulário de cadastro.
6. O usuário informa a modalidade, o professor responsável e o horário.
7. O sistema valida as informações.
8. O sistema registra a nova aula ou turma.
9. O sistema atualiza a listagem de registros.

#### Fluxo Alternativo A – Editar aula ou turma

1. O usuário seleciona uma aula ou turma cadastrada.
2. O usuário escolhe a opção de edição.
3. O sistema apresenta os dados atuais.
4. O usuário modifica as informações desejadas.
5. O sistema valida e salva as alterações.
6. O sistema atualiza o registro.

#### Fluxo Alternativo B – Excluir aula ou turma

1. O usuário seleciona uma aula ou turma.
2. O usuário escolhe a opção de exclusão.
3. O sistema solicita a confirmação da operação, caso disponível.
4. O usuário confirma a exclusão.
5. O sistema remove o registro.
6. O sistema atualiza a listagem.

#### Fluxo Alternativo C – Professor tenta acessar turma de outro professor

1. O professor tenta acessar uma turma que não está vinculada ao seu perfil.
2. O sistema verifica a identificação do professor responsável.
3. O sistema identifica que o professor não possui permissão.
4. O sistema bloqueia a operação e apresenta uma mensagem de acesso não autorizado.

---

### CDU 05 – Criar e gerenciar planos de treino

O professor ou administrador cria planos de treino para os alunos, adicionando os exercícios que deverão ser realizados.

#### Atores

1. Professor.
2. Administrador.
3. Aluno.
4. Sistema.

#### Fluxo Principal

1. O professor ou administrador realiza login no sistema.
2. O usuário acessa a área de gerenciamento de treinos.
3. O sistema apresenta as opções disponíveis.
4. O usuário seleciona a opção de criar um plano de treino.
5. O usuário seleciona o aluno que receberá o plano.
6. O sistema disponibiliza a criação de treinos.
7. O usuário cadastra os treinos e adiciona os exercícios correspondentes.
8. O usuário salva as informações.
9. O sistema registra o plano de treino no banco de dados.
10. O aluno acessa sua área de treinos.
11. O sistema apresenta o plano disponibilizado pelo professor.

#### Fluxo Alternativo A – Dados incompletos

1. O professor tenta salvar um plano de treino sem preencher todas as informações obrigatórias.
2. O sistema identifica os campos incompletos.
3. O sistema apresenta uma mensagem de erro.
4. O professor preenche as informações necessárias.
5. O professor tenta salvar novamente.

#### Fluxo Alternativo B – Aluno sem plano de treino

1. O aluno acessa a área de planos de treino.
2. O sistema verifica se existe algum plano associado ao aluno.
3. O sistema identifica que não há planos cadastrados.
4. O sistema informa que nenhum plano de treino está disponível.

---

### CDU 06 – Gerenciar usuários

O administrador realiza o gerenciamento das contas cadastradas na plataforma.

#### Atores

1. Administrador.
2. Sistema.

#### Fluxo Principal

1. O administrador realiza login no sistema.
2. O administrador acessa a área de gerenciamento de usuários.
3. O sistema apresenta a lista de usuários cadastrados.
4. O administrador seleciona a opção desejada.
5. O administrador pode cadastrar um novo usuário, editar informações ou excluir uma conta.
6. O sistema valida as informações fornecidas.
7. O sistema registra as alterações no banco de dados.
8. O sistema atualiza a listagem de usuários.

#### Fluxo Alternativo A – Cadastro com informações inválidas

1. O administrador tenta cadastrar um usuário com informações incorretas ou incompletas.
2. O sistema identifica os dados inválidos.
3. O sistema apresenta uma mensagem de erro.
4. O administrador corrige as informações.
5. O cadastro é realizado novamente.

#### Fluxo Alternativo B – Usuário não encontrado

1. O administrador pesquisa um usuário.
2. O sistema realiza a busca.
3. O sistema não encontra nenhum registro correspondente.
4. O sistema informa que o usuário não foi encontrado.

---

### CDU 07 – Gerenciar modalidades

O administrador realiza o gerenciamento das modalidades oferecidas pela academia.

#### Atores

1. Administrador.
2. Sistema.

#### Fluxo Principal

1. O administrador realiza login no sistema.
2. O administrador acessa a área de modalidades.
3. O sistema apresenta as modalidades cadastradas.
4. O administrador seleciona a opção de adicionar uma modalidade.
5. O sistema apresenta o formulário de cadastro.
6. O administrador informa o nome da modalidade.
7. O sistema valida as informações.
8. O sistema registra a nova modalidade.
9. O sistema atualiza a lista de modalidades.

#### Fluxo Alternativo A – Editar modalidade

1. O administrador seleciona uma modalidade cadastrada.
2. O administrador escolhe a opção de edição.
3. O sistema apresenta as informações atuais.
4. O administrador altera os dados desejados.
5. O sistema salva as alterações.
6. O sistema atualiza a listagem.

#### Fluxo Alternativo B – Excluir modalidade

1. O administrador seleciona uma modalidade.
2. O administrador escolhe a opção de exclusão.
3. O sistema verifica se a operação pode ser realizada.
4. O sistema solicita a confirmação da exclusão, caso disponível.
5. O administrador confirma a operação.
6. O sistema remove a modalidade e atualiza a listagem.
