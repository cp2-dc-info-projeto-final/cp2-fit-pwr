- Usuário.
  
#### Fluxo principal:

- O usuário seleciona a opção “login usuário”.
  
- O sistema leva o usuário até a tela de registro contendo um formulário.
  
- O usuário preenche os campos do formulário (informando e-mail e senha).
  
- O sistema consulta o banco de dados para verificar a disponibilidade das informações fornecidas e se o usuário já possui uma matricula ativa.
  
#### Fluxo Alternativo A: Caso não tenha matricula ativa

- O usuário seleciona a opção “login usuário”.
  
- O sistema leva o usuário até a tela de registro contendo um formulário.
  
- O usuário preenche os campos do formulário (informando e-mail e senha).
  
- O sistema consulta o banco de dados para verificar a disponibilidade das informações fornecidas e se o usuário já possui uma matricula ativa.

- O sistema manda uma mensagem de erro ("matricula do usuario inativa ou inexistente.") e encaminha o usuario para a pagina de matricula


- Usuário.
  
#### Fluxo principal:

- O usuário seleciona a opção “matricula”.

- O sistema leva o usuário até a tela de registro contendo um formulário.
  
- O usuário preenche os campos do formulário (informando: Nome, Idade, CPF, Email, dados do cartão e uma senha de acesso).

- O sistema salva os dados no banco de dados é apresenta uma mensagem de confirmação ("Parabéns matricula concluida!")

- O sistema leva o usuario a aréa do aluno.

- Usuário.
  
#### Fluxo Alternativo A:Caso de erro nas informações de matricula

- O usuário seleciona a opção “matricula”.

- O sistema leva o usuário até a tela de registro contendo um formulário.
  
- O usuário preenche os campos do formulário (informando: Nome, Idade, CPF, Email, dados do cartão e uma senha de acesso).

- O sistema manda uma mensagem informando um erro no cadastro ("erro no cadatro tente novamente").


- Usuário.
  
#### Fluxo principal:

- Ao entrar na aréa do aluno vai ter um carosel de fotos e uma aba superior com varios links para acessar as outras funções("Planilha de treino", "Aulas coletivas", "Conta" e "sobre nós")

- ao clicar em cada um os links vc é encaminhao para sua devida pagina.


- Usuário.
  
#### Fluxo principal:

- Ao clicar na opção de conta na areá do aluno vamos a uma pagina que temos uma tabela com as informações da matricula do usuáario.

- No fim da tabela tem duas opções ("editar" e "delete").

- Ao clicar na opção "editar" abri um modal com cada item da sua matricula para poder editar todos os campos a matricula do usuario.

- Ao acabar de editar no fim do formulario tem dois botões ("salvar" ou  "cancelar").

- Ao clicar no salvar o sistema salva as alterações no banco de dados e faz as alteraçoes na matricula.


#### Fluxo Alternativo A:Cancelamento do editar 

- Ao clicar na opção de conta na areá do aluno vamos a uma pagina que temos uma tabela com as informações da matricula do usuáario.

- No fim da tabela tem duas opções ("editar" e "delete").

- Ao clicar na opção "editar" abri um modal com cada item da sua matricula para poder editar todos os campos a matricula do usuario.

- Ao acabar de editar no fim do formulario tem dois botões ("salvar" ou  "cancelar").

- clicando na opção "cancelar" o formulario fecha sem alterar nenhuma informação da matricula do usuário.


#### Fluxo principal:

- Ao clicar na opção de conta na areá do aluno vamos a uma pagina que temos uma tabela com as informações da matricula do usuáario.

- No fim da tabela tem duas opções ("editar" e "delete").

- Ao clicar na opção "deletar" abri um modal perguntando ("tem certeza se deseja excluir sua matrcula") com duas possiveis repostas("Sim" ou "Não").

- clicando no "sim" a matricula do aluno é apagada do banco de dados.

#### Fluxo alternativo A:cancelamento do deletar

- Ao clicar na opção de conta na areá do aluno vamos a uma pagina que temos uma tabela com as informações da matricula do usuáario.

- No fim da tabela tem duas opções ("editar" e "delete").

- Ao clicar na opção "deletar" abri um modal perguntando ("tem certeza se deseja excluir sua matrcula") com duas possiveis repostas("Sim" ou "Não").

- clicando no "não" o modal fecha.


- Usuário.
  
#### Fluxo principal:

- Ao clicar na opção de "aulas coletivas" na areá do aluno vamos a uma pagina que temos opções de algumas aula coletivas.

- Ao clicar na aula coletiva que você deseja vai para uma pagina da aula com os horarios, nome do professor, nome dos alunos matriculados na aula, quantidade de alunos e o numero de vagas.

- logo embaixo aparece a opção de "matricular-se".

- Ao clicar no "matricular-se" é salvo no banco de dados e o usuario esta matriculado na aula.
  
#### Fluxo Alternativo A:Caso esteja esgotado as vagas

- Ao clicar na opção de "aulas coletivas" na areá do aluno vamos a uma pagina que temos opções de algumas aula coletivas.

- Ao clicar na aula coletiva que você deseja vai para uma pagina da aula com os horarios, nome do professor, nome dos alunos matriculados na aula, quantidade de alunos e o numero de vagas.

- logo embaixo aparece a opção de "matricular-se".

- Ao clicar no "matricular-se" aparece uma mensagem "vaga para aula esgotada no momento".

#### Fluxo Alternativo A:aluno já matriculado na aula

- Ao clicar na opção de "aulas coletivas" na areá do aluno vamos a uma pagina que temos opções de algumas aula coletivas.

- Ao clicar na aula coletiva que você deseja vai para uma pagina da aula com os horarios, nome do professor, nome dos alunos matriculados na aula, quantidade de alunos e o numero de vagas.

- logo embaixo aparece a opção de "cancelar matricula".

- Ao clicar no "cancelar matricula" aparece uma mensagem "tem certeza que deseja cancelar sua matricula?" logo embaixo da mensagem dois botões "sim" ou "não.

- Clicando no "sim" a mensagem fecha e é apagado no banco de dados a matricula do usurio na aula coletiva.


- Administrador.
  
#### Fluxo principal:

- Ao entrar na pagina de contas o administrador tem acesso a uma tabela com a matricula é informações de todos os alunos.

- Ao lado de cada linha da da tabela tem duas opções "cancelar matricula" e "editar" e uma opção no canto superior direito "adicionar nova matricula".

- Clicando na opção de "adicionar nova matricula" abri um formulario para adicionar todas as informações do aluno.

- Ao preencher todos o formulario aparece uma opção de salva.

- Clicando na opção de salvar todas as informações são salvas no banco de dados.

#### Fluxo principal:

- Ao entrar na pagina de contas o administrador tem acesso a uma tabela com a matricula é informações de todos os alunos.

- Ao lado de cada linha da da tabela tem duas opções "cancelar matricula" e "editar" e uma opção no canto superior direito "adicionar nova matricula".

- Clicando na opção de "cancelar matricula" aparece uma mensagem "tem certeza que deseja cancelar essa matricula?" e dois botões embaixo "sim" e "não".

- clicando no "sim" a mensagem sai da tela e a matricula do aluno é apagada

#### Fluxo Alternativo A:clicar no "não"

- Ao entrar na pagina de contas o administrador tem acesso a uma tabela com a matricula é informações de todos os alunos.

- Ao lado de cada linha da da tabela tem duas opções "cancelar matricula" e "editar" e uma opção no canto superior direito "adicionar nova matricula".

- Clicando na opção de "cancelar matricula" aparece uma mensagem "tem certeza que deseja cancelar essa matricula?" e dois botões embaixo "sim" e "não".

- Ao clicar no "não" a mensagem fecha e o administrador volta a pagina principal de contas.

#### Fluxo principal:

- Ao entrar na pagina de contas o administrador tem acesso a uma tabela com a matricula é informações de todos os alunos.

- Ao lado de cada linha da da tabela tem duas opções "cancelar matricula" e "editar" e uma opção no canto superior direito "adicionar nova matricula".

- Ao clicar na opção "editar" abri um formulario para colocar todas as informações do aluno.

- Ao preencher todas as informações do aluno no final do formulario tem um botão "salvar".

- Clicando no "salvar" o sistema salva todas as alterações no banco de dados.


- Professor.
  
#### Fluxo principal:

- Ao professor acessa a pagina de aulas coletivas ele acessa a sua aula, ele tem acesso a todos os alunos matriculados e todas as informações.

- Ao lado de cada linha da tabela de alunos tem uma opção de "cancelar matricula".

- Ao clicar no cancelar matricula aparece a mensagem "tem certeza que deseja cancelar a matricula desse aluno" e dois botões "sim" ou "não".

- se o professor clicar no "sim" a matricula do aluno na aula é cancelada.

#### Fluxo Alternativo A:clicando no "não"

- Ao professor acessa a pagina de aulas coletivas ele acessa a sua aula, ele tem acesso a todos os alunos matriculados e todas as informações.

- Ao lado de cada linha da tabela de alunos tem uma opção de "cancelar matricula".

- Ao clicar no cancelar matricula aparece a mensagem "tem certeza que deseja cancelar a matricula desse aluno" e dois botões "sim" ou "não".

- clicando no "não" a tela de mensagem é fechada.

#### Fluxo Principal:

- Ao professor acessa a pagina de aulas coletivas ele acessa a sua aula, ele tem acesso a todos os alunos matriculados e todas as informações.

- Ao lado de cada linha da tabela de alunos tem uma opção de "cancelar matricula".

- No canto superior direito da pagina tem um botão "editar" ao clicar no editar abri um formulario com as seguintes informações para serem editadas ("dia e horario da aula,vagas disponiveis,")

- No fim do formulario tem o botão "salvar".

- Clicando no botão salvar o sistema salva todas as novas informações no banco de dados.
