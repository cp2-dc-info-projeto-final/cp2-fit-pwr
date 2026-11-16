<script lang="ts">
  // Tabela de exercícios
  
  import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Card } from 'flowbite-svelte'; // UI
  import ConfirmModal from './ConfirmModal.svelte'; // modal de confirmação
  import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons'; // ícones genéricos mais adequados
  import { goto } from '\$app/navigation'; // navegação
  import api from '\$lib/api'; // API backend
  import type { ApiResponse } from '\$lib/api';
  import { onMount } from 'svelte'; // ciclo de vida
  import type { Exercicio } from '\$lib/models/Exercicio'; // Caminho para a interface de Exercício

  let exercicios: Exercicio[] = []; // lista de exercícios
  let loading = true;
  let error = '';
  let deletingId: number | null = null; // id em deleção
  let confirmOpen = false; // modal aberto?
  let confirmTargetId: number | null = null; // id alvo do modal
  let filtro = "";

  async function filtraExercicios(){
    try {
      const res = await api.get(`/exercicios?nome=${encodeURIComponent(filtro)}`);
      const body = res.data as ApiResponse<Exercicio[]>;
      if (body.success) {
        exercicios = body.data ?? [];
      } else {
        error = body.message;
      }
    } catch (e: any) {
      console.error('Erro ao carregar exercícios:', e);
      const body = e.response?.data as ApiResponse<Exercicio[]> | undefined;
      error = body?.message || 'Erro ao carregar exercícios';
    } finally {
      loading = false;
    }
  }

  // Abre modal de confirmação
  function openConfirm(id: number) {
    confirmTargetId = id;
    confirmOpen = true;
  }
  // Fecha modal
  function closeConfirm() {
    confirmOpen = false;
    confirmTargetId = null;
  }

  // Confirma remoção
  function handleConfirm() {
    if (confirmTargetId !== null) {
      handleDelete(confirmTargetId);
    }
    closeConfirm();
  }

  // Cancela remoção
  function handleCancel() {
    closeConfirm();
  }

  async function handleDelete(id: number) {
    deletingId = id;
    error = '';
    try {
      const res = await api.delete(`/exercicios/${id}`);
      const body = res.data as ApiResponse<null>;
      if (!body.success) {
        error = body.message;
        return;
      }
      exercicios = exercicios.filter(exercicio => exercicio.id_exercicio !== id);
    } catch (e: any) {
      console.error('Erro ao deletar exercício:', e);
      const body = e.response?.data as ApiResponse<null> | undefined;
      error = body?.message || 'Erro ao remover exercício.';
    } finally {
      deletingId = null;
    }
  }

  onMount(async () => {
    try {
      const res = await api.get('/exercicios');
      const body = res.data as ApiResponse<Exercicio[]>;
      if (body.success) {
        exercicios = body.data ?? [];
      } else {
        error = body.message;
      }
    } catch (e: any) {
      console.error('Erro ao carregar exercícios:', e);
      const body = e.response?.data as ApiResponse<Exercicio[]> | undefined;
      error = body?.message || 'Erro ao carregar exercícios';
    } finally {
      loading = false;
    }
  });
</script>


{#if loading}

  <div class="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
    <div class="mb-5 h-11 w-11 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
    <p class="text-sm font-semibold text-gray-200">Carregando exercícios</p>
    <p class="mt-2 text-xs text-gray-500">Preparando o catálogo de exercícios...</p>
  </div>

{:else if error}

  <div class="rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center">
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl font-bold text-red-400">
      !
    </div>
    <h3 class="text-lg font-bold text-white">Não foi possível carregar os exercícios</h3>
    <p class="mt-2 text-sm text-red-300">{error}</p>
  </div>

{:else}

  <div class="space-y-6">

    <!-- PESQUISA -->
    <div class="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">

      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-white">Localizar exercício</h3>
          <p class="mt-1 text-xs text-gray-500">Pesquise pelo nome do exercício.</p>
        </div>

        <span class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-400">
          Busca
        </span>
      </div>

      <div class="relative">
        <svg class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="m16 16 4 4"/>
        </svg>

        <input
          type="search"
          id="busca"
          placeholder="Digite o nome do exercício..."
          bind:value={filtro}
          on:input={filtraExercicios}
          class="w-full rounded-xl border border-gray-600 bg-gray-950 py-4 pl-12 pr-4 text-sm font-medium text-white outline-none transition duration-200 placeholder:text-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

    </div>


    <!-- TABELA DESKTOP -->
    <div class="hidden xl:block">

      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-white">Catálogo de exercícios</h3>
          <p class="mt-1 text-xs text-gray-500">Gerencie os exercícios e seus grupos musculares.</p>
        </div>

        <span class="text-xs font-medium text-gray-500">
          Biblioteca de exercícios
        </span>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">

        <Table class="w-full">

          <TableHead class="border-b border-gray-700 bg-gray-950">

            <TableHeadCell class="w-20 px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
              ID
            </TableHeadCell>

            <TableHeadCell class="w-56 px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Exercício
            </TableHeadCell>

            <TableHeadCell class="w-48 px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Grupo muscular
            </TableHeadCell>

            <TableHeadCell class="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Descrição
            </TableHeadCell>

            <TableHeadCell class="w-32 px-6 py-5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Ações
            </TableHeadCell>

          </TableHead>

          <TableBody>

            {#each exercicios as exercicio}

              <TableBodyRow class="border-b border-gray-700/70 bg-gray-800 transition-colors duration-200 hover:bg-gray-700/40">

                <TableBodyCell class="px-6 py-5">
                  <span class="font-mono text-sm font-semibold text-gray-500">
                    #{exercicio.id_exercicio}
                  </span>
                </TableBodyCell>

                <TableBodyCell class="px-6 py-5">
                  <div class="flex items-center gap-3">

                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-sm font-black text-blue-400">
                      {exercicio.nome?.charAt(0)}
                    </div>

                    <span class="font-bold text-white">
                      {exercicio.nome}
                    </span>

                  </div>
                </TableBodyCell>

                <TableBodyCell class="px-6 py-5">
                  <span class="inline-flex items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300">
                    {exercicio.grupo_muscular}
                  </span>
                </TableBodyCell>

                <TableBodyCell class="max-w-0 px-6 py-5 text-sm text-gray-300">
                  <span class="block truncate" title={exercicio.descricao || 'Sem descrição'}>
                    {exercicio.descricao || 'Sem descrição'}
                  </span>
                </TableBodyCell>

                <TableBodyCell class="px-6 py-5">
                  <div class="flex items-center justify-center gap-2">

                    <button
                      class="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-600"
                      title="Editar exercício"
                      on:click={() => goto(`/exercicios/edit/${exercicio.id_exercicio}`)}
                    >
                      <EditOutline class="h-5 w-5 text-blue-300" />
                    </button>

                    <button
                      title="Remover exercício"
                      class="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 transition-all hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      on:click={() => openConfirm(exercicio.id_exercicio)}
                      disabled={deletingId === exercicio.id_exercicio || loading}
                    >
                      <TrashBinOutline class="h-5 w-5 text-red-300" />
                    </button>

                  </div>
                </TableBodyCell>

              </TableBodyRow>

            {/each}

          </TableBody>

        </Table>

        {#if exercicios.length === 0}
          <div class="px-6 py-16 text-center">
            <p class="text-base font-bold text-white">Nenhum exercício encontrado</p>
            <p class="mt-2 text-sm text-gray-400">Não existem exercícios para exibir.</p>
          </div>
        {/if}

      </div>

    </div>


    <!-- CARDS MOBILE -->
    <div class="block xl:hidden">

      <div class="mb-4 flex items-center justify-between">

        <div>
          <h3 class="text-lg font-bold text-white">Exercícios cadastrados</h3>
          <p class="mt-1 text-xs text-gray-500">Gerencie sua biblioteca de exercícios.</p>
        </div>

        <span class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-bold text-blue-400">
          {exercicios.length} registros
        </span>

      </div>

      <div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">

        {#each exercicios as exercicio}

          <Card class="h-full w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-lg transition-all duration-200 hover:border-blue-500/50">

            <!-- CABEÇALHO -->
            <div class="flex items-start justify-between gap-3 border-b border-gray-700 bg-gray-950/70 p-5">

              <div class="flex min-w-0 items-start gap-3">

                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-lg font-black text-blue-400">
                  {exercicio.nome?.charAt(0)}
                </div>

                <div class="min-w-0">

                  <h4 class="text-base font-bold leading-snug text-white">
                    {exercicio.nome}
                  </h4>

                  <p class="mt-1 text-xs font-medium text-gray-500">
                    ID #{exercicio.id_exercicio}
                  </p>

                </div>

              </div>

              <span class="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Exercício
              </span>

            </div>


            <!-- INFORMAÇÕES -->
            <div class="space-y-4 p-5">

              <div>
                <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Grupo muscular
                </p>

                <span class="inline-flex rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300">
                  {exercicio.grupo_muscular}
                </span>
              </div>

              <div>

                <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Descrição
                </p>

                <p class="text-sm leading-relaxed text-gray-300">
                  {exercicio.descricao || 'Nenhuma descrição cadastrada.'}
                </p>

              </div>


              <!-- AÇÕES -->
              <div class="flex gap-3 border-t border-gray-700 pt-4">

                <button
                  class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white"
                  title="Editar exercício"
                  on:click={() => goto(`/exercicios/edit/${exercicio.id_exercicio}`)}
                >
                  <EditOutline class="h-5 w-5" />
                  Editar
                </button>

                <button
                  title="Remover exercício"
                  class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:border-red-400 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  on:click={() => openConfirm(exercicio.id_exercicio)}
                  disabled={deletingId === exercicio.id_exercicio || loading}
                >
                  <TrashBinOutline class="h-5 w-5" />
                  Remover
                </button>

              </div>

            </div>

          </Card>

        {/each}

      </div>

      {#if exercicios.length === 0}
        <div class="rounded-2xl border border-dashed border-gray-700 bg-gray-800/50 px-6 py-16 text-center">
          <h3 class="text-lg font-bold text-white">Nenhum exercício encontrado</h3>
          <p class="mt-2 text-sm text-gray-400">Não existem exercícios para exibir.</p>
        </div>
      {/if}

    </div>

  </div>

{/if}


<!-- MODAL DE CONFIRMAÇÃO -->
<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover este exercício?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
