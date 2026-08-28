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

  <div class="my-10 text-center text-gray-500">
    <div class="text-lg font-medium">
      Carregando aulas...
    </div>
  </div>

{:else if error}

  <div class="my-10 text-center">
    <div class="text-red-500">
      {error}
    </div>

    <button
      class="mt-4 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition"
      on:click={carregarAulas}
    >
      Tentar novamente
    </button>
  </div>

{:else if aulas.length === 0}

  <div class="my-10 text-center text-gray-500">
    Nenhuma aula coletiva disponível no momento.
  </div>

{:else}

  <!-- Título -->
  <div class="max-w-6xl mx-auto px-4 mt-8 mb-6">
    <h2 class="text-2xl font-bold text-gray-800">
      Aulas Coletivas
    </h2>

    <p class="text-gray-500 mt-1">
      Escolha uma aula para se matricular.
    </p>
  </div>

  <!-- Cards -->
  <div
    class="
      max-w-6xl mx-auto
      px-4 pb-10
      grid grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      gap-6
    "
  >

    {#each aulas as aula}

      <Card
        class="
          p-0 overflow-hidden
          shadow-lg
          border border-gray-200
          rounded-lg
          hover:shadow-xl
          transition-shadow
        "
      >

        <!-- Cabeçalho -->
        <div class="px-5 py-4 bg-gray-100 border-b border-gray-200">

          <div class="flex items-start justify-between gap-3">

            <div>
              <h3 class="text-xl font-bold text-gray-800">
                {aula.nome_modalidade}
              </h3>

              <p class="text-sm text-gray-500 mt-1">
                Aula coletiva
              </p>
            </div>

            {#if aula.inscrito}
              <Badge color="green">
                Matriculado
              </Badge>
            {:else}
              <Badge color="blue">
                Disponível
              </Badge>
            {/if}

          </div>

        </div>

        <!-- Informações -->
        <div class="px-5 py-5 flex flex-col gap-4">

          <!-- Horário -->
          <div class="flex items-center gap-3">

            <div
              class="
                w-10 h-10
                rounded-full
                bg-primary-50
                flex items-center justify-center
                flex-shrink-0
              "
            >
              <svg
                class="w-5 h-5 text-primary-500"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  stroke-linecap="round"
                  d="M12 7v5l3 2"
                />
              </svg>
            </div>

            <div>
              <p class="text-xs text-gray-400">
                Horário
              </p>

              <p class="font-medium text-gray-700 capitalize">
                {aula.horario}
              </p>
            </div>

          </div>

          <!-- Professor -->
          <div class="flex items-center gap-3">

            <div
              class="
                w-10 h-10
                rounded-full
                bg-primary-50
                flex items-center justify-center
                flex-shrink-0
              "
            >
              <svg
                class="w-5 h-5 text-primary-500"
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

            <div>
              <p class="text-xs text-gray-400">
                Professor
              </p>

              <p class="font-medium text-gray-700">
                {aula.professor}
              </p>
            </div>

          </div>

          <!-- Botão -->
          {#if aula.inscrito}

            <button
              class="
                w-full
                mt-2
                px-4 py-2.5
                rounded-lg
                border border-red-200
                text-red-500
                bg-white
                hover:bg-red-50
                transition
                font-medium
              "
              disabled={processandoId === aula.id_turma}
              on:click={() => desmatricular(aula.id_turma)}
            >
              {#if processandoId === aula.id_turma}
                Cancelando...
              {:else}
                Desmatricular-se
              {/if}
            </button>

          {:else}

            <button
              class="
                w-full
                mt-2
                px-4 py-2.5
                rounded-lg
                bg-primary-500
                text-white
                hover:bg-primary-600
                transition
                font-medium
              "
              disabled={processandoId === aula.id_turma}
              on:click={() => inscrever(aula.id_turma)}
            >
              {#if processandoId === aula.id_turma}
                Inscrevendo...
              {:else}
                Inscrever-se
              {/if}
            </button>

          {/if}

        </div>

      </Card>

    {/each}

  </div>

{/if}