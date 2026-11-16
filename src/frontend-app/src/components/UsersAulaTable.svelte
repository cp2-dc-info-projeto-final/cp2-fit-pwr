<script lang="ts">
  import { Card, Badge } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';

  type Aula = {
    id_turma: number;
    horario: string;
    nome_modalidade: string;
    professor: string;
    inscrito: boolean;
  };

  let aulas: Aula[] = [];
  let loading = true;
  let error = '';
  let processandoId: number | null = null;

  // Carrega as aulas disponíveis
  async function carregarAulas() {
    loading = true;
    error = '';

    try {
      const res = await api.get('/aulas');
      const body = res.data as ApiResponse<Aula[]>;

      if (body.success) {
        aulas = body.data ?? [];
      } else {
        error = body.message || 'Erro ao carregar as aulas.';
      }
    } catch (e: any) {
      console.error('Erro ao carregar aulas:', e);

      const body = e.response?.data as ApiResponse<Aula[]> | undefined;

      error = body?.message || 'Erro ao carregar as aulas.';
    } finally {
      loading = false;
    }
  }

  // Inscreve o usuário na aula
  async function inscrever(idTurma: number) {
    processandoId = idTurma;
    error = '';

    try {
      const res = await api.post(`/aulas/${idTurma}/inscricao`);

      const body = res.data as ApiResponse<null>;

      if (!body.success) {
        error = body.message || 'Erro ao realizar inscrição.';
        return;
      }

      // Atualiza apenas a aula modificada
      aulas = aulas.map((aula) =>
        aula.id_turma === idTurma
          ? { ...aula, inscrito: true }
          : aula
      );
    } catch (e: any) {
      console.error('Erro ao realizar inscrição:', e);

      const body = e.response?.data as ApiResponse<null> | undefined;

      error = body?.message || 'Erro ao realizar inscrição.';
    } finally {
      processandoId = null;
    }
  }

  // Remove a matrícula do usuário
  async function desmatricular(idTurma: number) {
    processandoId = idTurma;
    error = '';

    try {
      const res = await api.delete(`/aulas/${idTurma}/inscricao`);

      const body = res.data as ApiResponse<null>;

      if (!body.success) {
        error = body.message || 'Erro ao cancelar inscrição.';
        return;
      }

      // Atualiza apenas a aula modificada
      aulas = aulas.map((aula) =>
        aula.id_turma === idTurma
          ? { ...aula, inscrito: false }
          : aula
      );
    } catch (e: any) {
      console.error('Erro ao cancelar inscrição:', e);

      const body = e.response?.data as ApiResponse<null> | undefined;

      error = body?.message || 'Erro ao cancelar inscrição.';
    } finally {
      processandoId = null;
    }
  }

  onMount(() => {
    carregarAulas();
  });
</script>


{#if loading}

  <!-- Carregamento -->
  <div class="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
    <div class="mb-5 h-11 w-11 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>

    <p class="text-sm font-semibold text-gray-200">
      Carregando aulas coletivas
    </p>

    <p class="mt-2 text-xs text-gray-500">
      Preparando as opções disponíveis...
    </p>
  </div>

{:else if error}

  <!-- Erro -->
  <div class="rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center">

    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl font-bold text-red-400">
      !
    </div>

    <h3 class="text-lg font-bold text-white">
      Não foi possível carregar as aulas
    </h3>

    <p class="mt-2 text-sm text-red-300">
      {error}
    </p>

    <button
      class="mt-5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white"
      on:click={carregarAulas}
    >
      Tentar novamente
    </button>

  </div>

{:else if aulas.length === 0}

  <!-- Estado vazio -->
  <div class="rounded-2xl border border-dashed border-gray-700 bg-gray-800/50 px-6 py-16 text-center">

    <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
      <span class="text-3xl">🏋️</span>
    </div>

    <h3 class="text-lg font-bold text-white">
      Nenhuma aula disponível
    </h3>

    <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
      Não existem aulas coletivas disponíveis no momento. Volte mais tarde para conferir novas opções.
    </p>

  </div>

{:else}

  <!-- PAINEL PRINCIPAL -->
  <div class="space-y-6">

    <!-- CABEÇALHO -->
    <div class="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg sm:p-6">

      <div class="flex flex-wrap items-center justify-between gap-4">

        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>

            <span class="text-xs font-bold uppercase tracking-widest text-blue-400">
              Área de treinamento
            </span>
          </div>

          <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Aulas Coletivas
          </h2>

          <p class="mt-2 text-sm text-gray-400">
            Escolha uma modalidade e participe das atividades da academia.
          </p>
        </div>

        <div class="rounded-xl border border-gray-700 bg-gray-950/70 px-5 py-3 text-center">
          <p class="text-2xl font-extrabold text-blue-400">
            {aulas.length}
          </p>

          <p class="mt-1 text-xs font-medium text-gray-400">
            Aulas disponíveis
          </p>
        </div>

      </div>

      <!-- Indicadores -->
      <div class="mt-6 grid grid-cols-2 gap-3 border-t border-gray-700 pt-5">

        <div class="rounded-xl border border-gray-700 bg-gray-900/70 p-4">
          <p class="text-xs font-medium text-gray-500">
            Minhas inscrições
          </p>

          <p class="mt-2 text-2xl font-bold text-green-400">
            {aulas.filter(aula => aula.inscrito).length}
          </p>
        </div>

        <div class="rounded-xl border border-gray-700 bg-gray-900/70 p-4">
          <p class="text-xs font-medium text-gray-500">
            Disponíveis para inscrição
          </p>

          <p class="mt-2 text-2xl font-bold text-blue-400">
            {aulas.filter(aula => !aula.inscrito).length}
          </p>
        </div>

      </div>

    </div>


    <!-- TÍTULO DA LISTA -->
    <div class="flex items-center justify-between gap-3">

      <div>
        <h3 class="text-lg font-bold text-white">
          Explore as modalidades
        </h3>

        <p class="mt-1 text-xs text-gray-500">
          Confira horários e professores.
        </p>
      </div>

      <span class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-bold text-gray-400">
        {aulas.length} registros
      </span>

    </div>


    <!-- LISTA DE AULAS -->
    <div class="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">

      {#each aulas as aula}

        <Card class="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl">

          <!-- CABEÇALHO DO CARD -->
          <div class="border-b border-gray-700 bg-gray-950/60 p-5">

            <div class="flex items-start justify-between gap-3">

              <div class="min-w-0">

                <span class="mb-2 block text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  Modalidade coletiva
                </span>

                <h4 class="text-lg font-bold leading-snug text-white transition-colors group-hover:text-blue-400">
                  {aula.nome_modalidade}
                </h4>

              </div>

              {#if aula.inscrito}

                <span class="shrink-0 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-green-300">
                  Matriculado
                </span>

              {:else}

                <span class="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Disponível
                </span>

              {/if}

            </div>

          </div>


          <!-- INFORMAÇÕES -->
          <div class="flex flex-1 flex-col gap-5 p-5">

            <!-- Horário -->
            <div class="flex items-center gap-3">

              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <svg
                  class="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" d="M12 7v5l3 2" />
                </svg>
              </div>

              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Horário
                </p>

                <p class="mt-1 text-sm font-semibold capitalize text-gray-200">
                  {aula.horario}
                </p>
              </div>

            </div>


            <!-- Professor -->
            <div class="flex items-center gap-3">

              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <svg
                  class="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 21a8 8 0 0 1 16 0"
                  />
                </svg>
              </div>

              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Professor responsável
                </p>

                <p class="mt-1 truncate text-sm font-semibold text-gray-200">
                  {aula.professor}
                </p>
              </div>

            </div>


            <!-- BOTÃO DE AÇÃO -->
            <div class="mt-auto border-t border-gray-700 pt-5">

              {#if aula.inscrito}

                <button
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:border-red-400 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={processandoId === aula.id_turma}
                  on:click={() => desmatricular(aula.id_turma)}
                >
                  {#if processandoId === aula.id_turma}
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300"></span>
                    Cancelando...
                  {:else}
                    Desmatricular-se
                  {/if}
                </button>

              {:else}

                <button
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={processandoId === aula.id_turma}
                  on:click={() => inscrever(aula.id_turma)}
                >
                  {#if processandoId === aula.id_turma}
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-blue-300/30 border-t-blue-300"></span>
                    Inscrevendo...
                  {:else}
                    Inscrever-se
                  {/if}
                </button>

              {/if}

            </div>

          </div>

        </Card>

      {/each}

    </div>

  </div>

{/if}
