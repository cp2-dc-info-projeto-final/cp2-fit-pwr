```svelte
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

  async function carregarDados() {
    loading = true;
    error = '';

    try {
      const [alunosRes, exerciciosRes] = await Promise.all([
        api.get('/users'),
        api.get('/exercicios')
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
      console.error(e);

      error =
        e.response?.data?.message ||
        'Erro ao carregar alunos e exercícios.';
    } finally {
      loading = false;
    }
  }

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

    const exercicio = exercicios.find(
      (item) => String(item.id_exercicio) === String(exercicioSelecionado)
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
        series,
        repeticoes,
        carga,
        descanso,
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

  function removerExercicio(index: number) {
    exerciciosTreino = exerciciosTreino
      .filter((_, i) => i !== index)
      .map((exercicio, i) => ({
        ...exercicio,
        ordem: i + 1
      }));
  }

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
      const planoResponse = await api.post('/planos-treino', {
        id_usuario: Number(alunoSelecionado),
        nome: nomePlano,
        descricao: descricaoPlano
      });

      const planoBody = planoResponse.data as ApiResponse<any>;

      if (!planoBody.success || !planoBody.data) {
        error = planoBody.message || 'Erro ao criar plano.';
        return;
      }

      const plano = planoBody.data;

      const treinoResponse = await api.post('/treinos', {
        id_plano: plano.id_plano,
        nome: nomeTreino,
        dia_semana: diaSemana
      });

      const treinoBody = treinoResponse.data as ApiResponse<any>;

      if (!treinoBody.success || !treinoBody.data) {
        error = treinoBody.message || 'Erro ao criar treino.';
        return;
      }

      const treino = treinoBody.data;

      for (const exercicio of exerciciosTreino) {
        await api.post(`/treinos/${treino.id_treino}/exercicios`, {
          id_exercicio: exercicio.id_exercicio,
          series: exercicio.series,
          repeticoes: exercicio.repeticoes,
          carga: exercicio.carga,
          descanso: exercicio.descanso,
          ordem: exercicio.ordem,
          observacao: exercicio.observacao
        });
      }

      sucesso = 'Plano de treino criado com sucesso!';

      nomePlano = '';
      descricaoPlano = '';
      nomeTreino = '';
      exerciciosTreino = [];
      alunoSelecionado = '';
      diaSemana = 'segunda';
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

<div class="max-w-6xl mx-auto px-4 py-8">

  <div class="mb-8">
    <Heading tag="h2" class="text-2xl font-bold text-gray-800">
      Criar Plano de Treino
    </Heading>

    <p class="mt-2 text-gray-500">
      Monte um treino personalizado para seus alunos.
    </p>
  </div>

  {#if loading}

    <div class="flex justify-center py-12">
      <p class="text-gray-500">
        Carregando dados...
      </p>
    </div>

  {:else}

    {#if error}
      <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        {error}
      </div>
    {/if}

    {#if sucesso}
      <div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-600">
        {sucesso}
      </div>
    {/if}

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <div class="lg:col-span-1">

        <Card class="shadow-lg border border-gray-200">

          <Heading tag="h3" class="text-lg font-bold">
            Dados do plano
          </Heading>

          <div class="mt-5 flex flex-col gap-5">

            <div>
              <Label for="aluno">
                Aluno
              </Label>

              <Select
                id="aluno"
                bind:value={alunoSelecionado}
                class="mt-1"
              >
                <option value="">
                  Selecione um aluno
                </option>

                {#each alunos as aluno}
                  <option value={aluno.id}>
                    {aluno.login}
                  </option>
                {/each}
              </Select>
            </div>

            <div>
              <Label for="nomePlano">
                Nome do plano
              </Label>

              <Input
                id="nomePlano"
                bind:value={nomePlano}
                placeholder="Ex: Hipertrofia"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="descricao">
                Descrição
              </Label>

              <Textarea
                id="descricao"
                bind:value={descricaoPlano}
                placeholder="Descrição do plano..."
                class="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label for="nomeTreino">
                Nome do treino
              </Label>

              <Input
                id="nomeTreino"
                bind:value={nomeTreino}
                placeholder="Ex: Treino A - Peito e Tríceps"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="dia">
                Dia da semana
              </Label>

              <Select
                id="dia"
                bind:value={diaSemana}
                class="mt-1"
              >
                {#each diasSemana as dia}
                  <option value={dia.value}>
                    {dia.name}
                  </option>
                {/each}
              </Select>
            </div>

          </div>

        </Card>

      </div>


      <div class="lg:col-span-2">

        <Card class="shadow-lg border border-gray-200">

          <Heading tag="h3" class="text-lg font-bold">
            Adicionar exercício
          </Heading>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

            <div class="md:col-span-2">
              <Label for="exercicio">
                Exercício
              </Label>

              <Select
                id="exercicio"
                bind:value={exercicioSelecionado}
                class="mt-1"
              >
                <option value="">
                  Selecione um exercício
                </option>

                {#each exercicios as exercicio}
                  <option value={exercicio.id_exercicio}>
                    {exercicio.nome} — {exercicio.grupo_muscular}
                  </option>
                {/each}
              </Select>
            </div>

            <div>
              <Label for="series">
                Séries
              </Label>

              <Input
                id="series"
                type="number"
                min="1"
                bind:value={series}
                class="mt-1"
              />
            </div>

            <div>
              <Label for="repeticoes">
                Repetições
              </Label>

              <Input
                id="repeticoes"
                type="number"
                min="1"
                bind:value={repeticoes}
                class="mt-1"
              />
            </div>

            <div>
              <Label for="carga">
                Carga (kg)
              </Label>

              <Input
                id="carga"
                type="number"
                min="0"
                step="0.5"
                bind:value={carga}
                placeholder="Ex: 20"
                class="mt-1"
              />
            </div>

            <div>
              <Label for="descanso">
                Descanso (segundos)
              </Label>

              <Input
                id="descanso"
                type="number"
                min="0"
                bind:value={descanso}
                class="mt-1"
              />
            </div>

            <div class="md:col-span-2">
              <Label for="observacao">
                Observação
              </Label>

              <Textarea
                id="observacao"
                bind:value={observacao}
                placeholder="Ex: Executar lentamente..."
                rows={3}
                class="mt-1"
              />
            </div>

          </div>

          <div class="mt-5">
            <Button
              color="light"
              class="w-full"
              onclick={adicionarExercicio}
            >
              + Adicionar exercício
            </Button>
          </div>

        </Card>


        <Card class="mt-6 shadow-lg border border-gray-200">

          <div class="flex items-center justify-between">

            <Heading tag="h3" class="text-lg font-bold">
              Exercícios do treino
            </Heading>

            <Badge color="blue">
              {exerciciosTreino.length}
            </Badge>

          </div>

          {#if exerciciosTreino.length === 0}

            <div class="py-8 text-center text-gray-500">
              Nenhum exercício adicionado.
            </div>

          {:else}

            <div class="mt-5 flex flex-col gap-3">

              {#each exerciciosTreino as exercicio, index}

                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >

                  <div class="flex items-start justify-between gap-4">

                    <div>

                      <div class="flex items-center gap-2">
                        <span class="font-bold text-gray-800">
                          {index + 1}. {exercicio.nome}
                        </span>

                        <Badge color="gray">
                          {exercicio.grupo_muscular}
                        </Badge>
                      </div>

                      <div class="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">

                        <div>
                          <span class="text-gray-400">
                            Séries
                          </span>

                          <p class="font-semibold">
                            {exercicio.series}
                          </p>
                        </div>

                        <div>
                          <span class="text-gray-400">
                            Repetições
                          </span>

                          <p class="font-semibold">
                            {exercicio.repeticoes}
                          </p>
                        </div>

                        <div>
                          <span class="text-gray-400">
                            Carga
                          </span>

                          <p class="font-semibold">
                            {exercicio.carga ?? '-'} kg
                          </p>
                        </div>

                        <div>
                          <span class="text-gray-400">
                            Descanso
                          </span>

                          <p class="font-semibold">
                            {exercicio.descanso}s
                          </p>
                        </div>

                      </div>

                      {#if exercicio.observacao}
                        <p class="mt-3 text-sm text-gray-500">
                          {exercicio.observacao}
                        </p>
                      {/if}

                    </div>

                    <button
                      type="button"
                      class="text-sm text-red-500 hover:text-red-700"
                      onclick={() => removerExercicio(index)}
                    >
                      Remover
                    </button>

                  </div>

                </div>

              {/each}

            </div>

          {/if}

          <div class="mt-6 border-t border-gray-200 pt-5">

            <Button
              color="primary"
              class="w-full"
              disabled={salvando}
              onclick={criarPlano}
            >
              {#if salvando}
                Salvando treino...
              {:else}
                Salvar plano de treino
              {/if}
            </Button>

          </div>

        </Card>

      </div>

    </div>

  {/if}

</div>
```
