<script lang="ts">
  import {
    Card,
    Button,
    Label,
    Input,
    Select,
    Textarea,
    Heading,
    Badge
  } from 'flowbite-svelte';

  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';

  type Aluno = {
    id: number;
    login: string;
    email: string;
    horario: string;
    role: string;
  };

  type Exercicio = {
    id_exercicio: number;
    nome: string;
    grupo_muscular: string;
    descricao?: string;
    imagem?: string;
  };

  type ExercicioTreino = {
    id_exercicio: number;
    nome: string;
    grupo_muscular: string;
    series: number;
    repeticoes: number;
    carga: number | null;
    descanso: number;
    ordem: number;
    observacao: string;
  };

  let alunos: Aluno[] = [];
  let exercicios: Exercicio[] = [];

  let alunoSelecionado = '';
  let nomePlano = '';
  let descricaoPlano = '';

  let diaSemana = 'segunda';
  let nomeTreino = '';

  let exercicioSelecionado = '';
  let series = 3;
  let repeticoes = 12;
  let carga: number | null = null;
  let descanso = 60;
  let observacao = '';

  let exerciciosTreino: ExercicioTreino[] = [];

  let loading = true;
  let salvando = false;
  let error = '';
  let sucesso = '';

  const diasSemana = [
    { value: 'segunda', name: 'Segunda-feira' },
    { value: 'terça', name: 'Terça-feira' },
    { value: 'quarta', name: 'Quarta-feira' },
    { value: 'quinta', name: 'Quinta-feira' },
    { value: 'sexta', name: 'Sexta-feira' },
    { value: 'sábado', name: 'Sábado' },
    { value: 'domingo', name: 'Domingo' }
  ];

  /*
   * Carregar alunos e exercícios
   */
  async function carregarDados() {
    loading = true;
    error = '';

    try {
      const [alunosRes, exerciciosRes] = await Promise.all([
        api.get('/users/alunos'),
        api.get('/treinos/exercicios')
      ]);

      const alunosBody = alunosRes.data as ApiResponse<Aluno[]>;
      const exerciciosBody = exerciciosRes.data as ApiResponse<Exercicio[]>;

      if (alunosBody.success) {
        alunos = (alunosBody.data ?? []).filter(
          (aluno) => aluno.role === 'user'
        );
      } else {
        error = alunosBody.message || 'Erro ao carregar alunos.';
      }

      if (exerciciosBody.success) {
        exercicios = exerciciosBody.data ?? [];
      } else {
        error = exerciciosBody.message || 'Erro ao carregar exercícios.';
      }

    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);

      error =
        e.response?.data?.message ||
        'Erro ao carregar alunos e exercícios.';

    } finally {
      loading = false;
    }
  }

  /*
   * Adicionar exercício à lista
   */
  function adicionarExercicio() {
    error = '';

    if (!exercicioSelecionado) {
      error = 'Selecione um exercício.';
      return;
    }

    if (series <= 0 || repeticoes <= 0) {
      error = 'Séries e repetições devem ser maiores que zero.';
      return;
    }

    if (descanso < 0) {
      error = 'O descanso não pode ser negativo.';
      return;
    }

    if (carga !== null && carga < 0) {
      error = 'A carga não pode ser negativa.';
      return;
    }

    const exercicio = exercicios.find(
      (item) =>
        String(item.id_exercicio) === String(exercicioSelecionado)
    );

    if (!exercicio) {
      error = 'Exercício não encontrado.';
      return;
    }

    const jaExiste = exerciciosTreino.some(
      (item) => item.id_exercicio === exercicio.id_exercicio
    );

    if (jaExiste) {
      error = 'Esse exercício já foi adicionado ao treino.';
      return;
    }

    exerciciosTreino = [
      ...exerciciosTreino,
      {
        id_exercicio: exercicio.id_exercicio,
        nome: exercicio.nome,
        grupo_muscular: exercicio.grupo_muscular,
        series: Number(series),
        repeticoes: Number(repeticoes),
        carga: carga === null ? null : Number(carga),
        descanso: Number(descanso),
        ordem: exerciciosTreino.length + 1,
        observacao
      }
    ];

    exercicioSelecionado = '';
    series = 3;
    repeticoes = 12;
    carga = null;
    descanso = 60;
    observacao = '';
  }

  /*
   * Remover exercício da lista
   */
  function removerExercicio(index: number) {
    exerciciosTreino = exerciciosTreino
      .filter((_, i) => i !== index)
      .map((exercicio, i) => ({
        ...exercicio,
        ordem: i + 1
      }));
  }

  /*
   * Criar plano, treino e exercícios
   */
  async function criarPlano() {
    error = '';
    sucesso = '';

    if (!alunoSelecionado) {
      error = 'Selecione um aluno.';
      return;
    }

    if (!nomePlano.trim()) {
      error = 'Digite o nome do plano de treino.';
      return;
    }

    if (!nomeTreino.trim()) {
      error = 'Digite o nome do treino.';
      return;
    }

    if (exerciciosTreino.length === 0) {
      error = 'Adicione pelo menos um exercício ao treino.';
      return;
    }

    salvando = true;

    try {

      /*
       * 1 - Criar o plano de treino
       *
       * Rota correta:
       * POST /treinos
       */
      const planoResponse = await api.post('/treinos', {
        id_usuario: Number(alunoSelecionado),
        nome: nomePlano.trim(),
        descricao: descricaoPlano
      });

      const planoBody = planoResponse.data as ApiResponse<any>;

      if (!planoBody.success || !planoBody.data) {
        error = planoBody.message || 'Erro ao criar plano.';
        return;
      }

      const plano = planoBody.data;

      /*
       * 2 - Criar o treino dentro do plano
       *
       * Rota correta:
       * POST /treinos/:id/treinos
       */
      const treinoResponse = await api.post(
        `/treinos/${plano.id_plano}/treinos`,
        {
          nome: nomeTreino.trim(),
          dia_semana: diaSemana
        }
      );

      const treinoBody = treinoResponse.data as ApiResponse<any>;

      if (!treinoBody.success || !treinoBody.data) {
        error = treinoBody.message || 'Erro ao criar treino.';
        return;
      }

      const treino = treinoBody.data;

      /*
       * 3 - Adicionar exercícios ao treino
       *
       * Rota:
       * POST /treinos/:id/exercicios
       */
      for (const exercicio of exerciciosTreino) {
        await api.post(
          `/treinos/${treino.id_treino}/exercicios`,
          {
            id_exercicio: exercicio.id_exercicio,
            series: exercicio.series,
            repeticoes: exercicio.repeticoes,
            carga: exercicio.carga,
            descanso: exercicio.descanso,
            ordem: exercicio.ordem,
            observacao: exercicio.observacao
          }
        );
      }

      sucesso = 'Plano de treino criado com sucesso!';

      /*
       * Limpar formulário
       */
      nomePlano = '';
      descricaoPlano = '';
      nomeTreino = '';
      exerciciosTreino = [];
      alunoSelecionado = '';
      diaSemana = 'segunda';

      exercicioSelecionado = '';
      series = 3;
      repeticoes = 12;
      carga = null;
      descanso = 60;
      observacao = '';

    } catch (e: any) {
      console.error('Erro ao criar plano:', e);

      error =
        e.response?.data?.message ||
        'Erro ao salvar o plano de treino.';

    } finally {
      salvando = false;
    }
  }

  onMount(carregarDados);
</script>


<div class="min-h-screen w-full bg-gray-900 px-4 py-8 text-gray-100 sm:px-6 lg:px-8">

    <div class="mx-auto max-w-6xl">

        <!-- Cabeçalho -->
        <div class="mb-8">

            <div class="mb-2 flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-blue-500"></div>

                <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
                    Gestão de treinamento
                </span>
            </div>

            <Heading tag="h2" class="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Criar Plano de Treino
            </Heading>

            <p class="mt-2 text-sm text-gray-400 md:text-base">
                Monte uma ficha personalizada e organize os treinos dos seus alunos.
            </p>

        </div>


        {#if loading}

            <div class="flex flex-col items-center justify-center py-20">

                <div class="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>

                <p class="text-sm text-gray-400">
                    Carregando dados...
                </p>

            </div>

        {:else}

            <!-- Mensagens -->
            {#if error}

                <div class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div class="flex items-center gap-3">
                        <span class="text-red-400">!</span>

                        <p class="text-sm text-red-400">
                            {error}
                        </p>
                    </div>
                </div>

            {/if}


            {#if sucesso}

                <div class="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                    <div class="flex items-center gap-3">
                        <span class="text-green-400">✓</span>

                        <p class="text-sm text-green-400">
                            {sucesso}
                        </p>
                    </div>
                </div>

            {/if}


            <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">


                <!-- COLUNA ESQUERDA -->
                <div class="lg:col-span-1">

                    <Card class="w-full border border-gray-700 bg-gray-800 p-5 shadow-lg">

                        <!-- Título -->
                        <div class="mb-6">

                            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                                <span class="text-lg text-blue-400">▤</span>
                            </div>

                            <Heading tag="h3" class="text-lg font-bold text-white">
                                Dados do plano
                            </Heading>

                            <p class="mt-1 text-sm text-gray-400">
                                Informações gerais do treinamento.
                            </p>

                        </div>


                        <div class="flex flex-col gap-5">

                            <!-- Aluno -->
                            <div>

                                <Label for="aluno" class="text-sm font-medium text-gray-300">
                                    Aluno
                                </Label>

                                <Select
                                    id="aluno"
                                    bind:value={alunoSelecionado}
                                    class="mt-2"
                                >
                                    <option value="" disabled selected hidden>
                                        Selecione um aluno
                                    </option>

                                    {#each alunos as aluno}
                                        <option value={aluno.id}>
                                            {aluno.login}
                                        </option>
                                    {/each}
                                </Select>

                            </div>


                            <!-- Nome do plano -->
                            <div>

                                <Label for="nomePlano" class="text-sm font-medium text-gray-300">
                                    Nome do plano
                                </Label>

                                <Input
                                    id="nomePlano"
                                    bind:value={nomePlano}
                                    placeholder="Ex: Hipertrofia"
                                    class="mt-2"
                                />

                            </div>


                            <!-- Descrição -->
                            <div>

                                <Label for="descricao" class="text-sm font-medium text-gray-300">
                                    Descrição
                                </Label>

                                <Textarea
                                    id="descricao"
                                    bind:value={descricaoPlano}
                                    placeholder="Descreva os objetivos deste plano..."
                                    class="mt-2"
                                    rows={4}
                                />

                            </div>


                            <div class="border-t border-gray-700"></div>


                            <!-- Configuração da ficha -->
                            <div>

                                <div class="mb-4">
                                    <p class="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                        Configuração da ficha
                                    </p>
                                </div>

                                <div class="flex flex-col gap-5">

                                    <div>

                                        <Label for="nomeTreino" class="text-sm font-medium text-gray-300">
                                            Nome do treino
                                        </Label>

                                        <Input
                                            id="nomeTreino"
                                            bind:value={nomeTreino}
                                            placeholder="Ex: Treino A - Peito e Tríceps"
                                            class="mt-2"
                                        />

                                    </div>


                                    <div>

                                        <Label for="dia" class="text-sm font-medium text-gray-300">
                                            Dia da semana
                                        </Label>

                                        <Select
                                            id="dia"
                                            bind:value={diaSemana}
                                            class="mt-2"
                                        >
                                            {#each diasSemana as dia}
                                                <option value={dia.value}>
                                                    {dia.name}
                                                </option>
                                            {/each}
                                        </Select>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </Card>

                </div>


                <!-- COLUNA DIREITA -->
                <div class="flex flex-col gap-6 lg:col-span-2">

                    <!-- ADICIONAR EXERCÍCIO -->
                    <Card class="w-full border border-gray-700 bg-gray-800 p-5 shadow-lg">

                        <div class="mb-6">

                            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                                <span class="text-xl font-semibold text-blue-400">+</span>
                            </div>

                            <Heading tag="h3" class="text-lg font-bold text-white">
                                Adicionar exercício
                            </Heading>

                            <p class="mt-1 text-sm text-gray-400">
                                Configure os parâmetros de execução do exercício.
                            </p>

                        </div>


                        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <!-- Exercício -->
                            <div class="md:col-span-2">

                                <Label for="exercicio" class="text-sm font-medium text-gray-300">
                                    Exercício
                                </Label>

                                <Select
                                    id="exercicio"
                                    bind:value={exercicioSelecionado}
                                    class="mt-2"
                                >
                                    <option value="" disabled selected hidden>
                                        Selecione um exercício
                                    </option>

                                    {#each exercicios as exercicio}
                                        <option value={exercicio.id_exercicio}>
                                            {exercicio.nome} — {exercicio.grupo_muscular}
                                        </option>
                                    {/each}
                                </Select>

                            </div>


                            <!-- Séries -->
                            <div>

                                <Label for="series" class="text-sm font-medium text-gray-300">
                                    Séries
                                </Label>

                                <Input
                                    id="series"
                                    type="number"
                                    min="1"
                                    bind:value={series}
                                    class="mt-2"
                                />

                            </div>


                            <!-- Repetições -->
                            <div>

                                <Label for="repeticoes" class="text-sm font-medium text-gray-300">
                                    Repetições
                                </Label>

                                <Input
                                    id="repeticoes"
                                    type="number"
                                    min="1"
                                    bind:value={repeticoes}
                                    class="mt-2"
                                />

                            </div>


                            <!-- Carga -->
                            <div>

                                <Label for="carga" class="text-sm font-medium text-gray-300">
                                    Carga (kg)
                                </Label>

                                <Input
                                    id="carga"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    bind:value={carga}
                                    placeholder="Ex: 20"
                                    class="mt-2"
                                />

                            </div>


                            <!-- Descanso -->
                            <div>

                                <Label for="descanso" class="text-sm font-medium text-gray-300">
                                    Descanso (segundos)
                                </Label>

                                <Input
                                    id="descanso"
                                    type="number"
                                    min="0"
                                    bind:value={descanso}
                                    class="mt-2"
                                />

                            </div>


                            <!-- Observação -->
                            <div class="md:col-span-2">

                                <Label for="observacao" class="text-sm font-medium text-gray-300">
                                    Observações
                                </Label>

                                <Textarea
                                    id="observacao"
                                    bind:value={observacao}
                                    placeholder="Ex: Executar lentamente, manter postura..."
                                    rows={3}
                                    class="mt-2"
                                />

                            </div>

                        </div>


                        <!-- Botão adicionar -->
                        <div class="mt-6 border-t border-gray-700 pt-5">

                            <Button
                                color="blue"
                                class="w-full"
                                onclick={adicionarExercicio}
                            >
                                + Adicionar exercício ao treino
                            </Button>

                        </div>

                    </Card>



                    <!-- LISTA DE EXERCÍCIOS -->
                    <Card class="w-full border border-gray-700 bg-gray-800 p-5 shadow-lg">


                        <!-- Cabeçalho -->
                        <div class="flex flex-wrap items-center justify-between gap-3">

                            <div>

                                <Heading tag="h3" class="text-lg font-bold text-white">
                                    Exercícios do treino
                                </Heading>

                                <p class="mt-1 text-sm text-gray-400">
                                    Revise os exercícios antes de salvar.
                                </p>

                            </div>

                            <div class="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-center">

                                <p class="text-xl font-bold text-blue-400">
                                    {exerciciosTreino.length}
                                </p>

                                <p class="text-xs text-gray-400">
                                    Adicionados
                                </p>

                            </div>

                        </div>


                        {#if exerciciosTreino.length === 0}

                            <!-- Estado vazio -->
                            <div class="mt-6 rounded-xl border border-dashed border-gray-700 bg-gray-900/50 px-5 py-12 text-center">

                                <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-800">
                                    <span class="text-2xl text-gray-500">🏋️</span>
                                </div>

                                <h4 class="font-semibold text-gray-200">
                                    Nenhum exercício adicionado
                                </h4>

                                <p class="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                                    Selecione um exercício acima e configure suas séries, repetições e carga.
                                </p>

                            </div>

                        {:else}

                            <!-- Exercícios cadastrados -->
                            <div class="mt-6 flex flex-col gap-4">

                                {#each exerciciosTreino as exercicio, index}

                                    <div class="group rounded-xl border border-gray-700 bg-gray-900/60 p-4 transition-all duration-200 hover:border-blue-500/40">

                                        <!-- Identificação -->
                                        <div class="flex items-start justify-between gap-3">

                                            <div class="flex min-w-0 items-start gap-3">

                                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-sm font-bold text-blue-400">
                                                    {index + 1}
                                                </div>

                                                <div class="min-w-0">

                                                    <h4 class="font-bold text-white">
                                                        {exercicio.nome}
                                                    </h4>

                                                    <div class="mt-2">
                                                        <Badge color="gray">
                                                            {exercicio.grupo_muscular}
                                                        </Badge>
                                                    </div>

                                                </div>

                                            </div>


                                            <!-- Remover -->
                                            <button
                                                type="button"
                                                class="shrink-0 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
                                                onclick={() => removerExercicio(index)}
                                            >
                                                Remover
                                            </button>

                                        </div>


                                        <!-- Indicadores -->
                                        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                                            <div class="rounded-lg border border-gray-700/70 bg-gray-800/70 p-3">

                                                <p class="text-xs text-gray-500">
                                                    Séries
                                                </p>

                                                <p class="mt-1 text-lg font-bold text-white">
                                                    {exercicio.series}
                                                </p>

                                            </div>


                                            <div class="rounded-lg border border-gray-700/70 bg-gray-800/70 p-3">

                                                <p class="text-xs text-gray-500">
                                                    Repetições
                                                </p>

                                                <p class="mt-1 text-lg font-bold text-white">
                                                    {exercicio.repeticoes}
                                                </p>

                                            </div>


                                            <div class="rounded-lg border border-gray-700/70 bg-gray-800/70 p-3">

                                                <p class="text-xs text-gray-500">
                                                    Carga
                                                </p>

                                                <p class="mt-1 text-lg font-bold text-white">
                                                    {exercicio.carga ?? '-'}
                                                    <span class="text-xs font-medium text-gray-500">
                                                        kg
                                                    </span>
                                                </p>

                                            </div>


                                            <div class="rounded-lg border border-gray-700/70 bg-gray-800/70 p-3">

                                                <p class="text-xs text-gray-500">
                                                    Descanso
                                                </p>

                                                <p class="mt-1 text-lg font-bold text-white">
                                                    {exercicio.descanso}
                                                    <span class="text-xs font-medium text-gray-500">
                                                        s
                                                    </span>
                                                </p>

                                            </div>

                                        </div>


                                        <!-- Observação -->
                                        {#if exercicio.observacao}

                                            <div class="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">

                                                <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                                                    Observação
                                                </p>

                                                <p class="text-sm leading-relaxed text-gray-300">
                                                    {exercicio.observacao}
                                                </p>

                                            </div>

                                        {/if}

                                    </div>

                                {/each}

                            </div>

                        {/if}


                        <!-- Salvar plano -->
                        <div class="mt-6 border-t border-gray-700 pt-5">

                            <div class="mb-4 flex items-center justify-between">

                                <span class="text-sm text-gray-400">
                                    Total de exercícios
                                </span>

                                <span class="font-semibold text-white">
                                    {exerciciosTreino.length}
                                </span>

                            </div>

                            <Button
                                color="blue"
                                class="w-full"
                                disabled={salvando}
                                onclick={criarPlano}
                            >
                                {#if salvando}
                                    Salvando plano de treino...
                                {:else}
                                    Salvar plano de treino
                                {/if}
                            </Button>

                            <p class="mt-3 text-center text-xs text-gray-500">
                                Confira os dados antes de confirmar o cadastro.
                            </p>

                        </div>

                    </Card>

                </div>

            </div>

        {/if}

    </div>

</div>