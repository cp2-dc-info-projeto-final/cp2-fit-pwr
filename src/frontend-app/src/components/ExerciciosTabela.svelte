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
  <div class="my-8 text-center text-gray-500">Carregando exercícios...</div>
{:else if error}
  <div class="my-8 text-center text-red-500">{error}</div>
{:else}
  <!-- Tabela para telas médias/grandes -->
  <div class="hidden xl:block">
    <!-- Busca de exercícios -->
    <div class="w-full max-w-5xl mx-auto mb-2 text-left">
      <input type="search" id="busca" placeholder="Nome do exercício" bind:value={filtro} on:input={filtraExercicios} class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
    </div>
    <Table class="w-full max-w-5xl mx-auto my-4 shadow-lg border border-gray-200 rounded-lg">
      <TableHead>
        <TableHeadCell class="w-24">ID</TableHeadCell>
        <TableHeadCell class="min-w-0">Nome</TableHeadCell>
        <TableHeadCell class="w-48">Grupo Muscular</TableHeadCell>
        <TableHeadCell class="min-w-0">Descrição</TableHeadCell>
        <TableHeadCell class="w-24"></TableHeadCell> <!-- coluna para editar/remover -->
      </TableHead>
      <TableBody>
        {#each exercicios as exercicio}
          <TableBodyRow>
            <TableBodyCell>{exercicio.id_exercicio}</TableBodyCell>
            <TableBodyCell class="font-medium text-gray-900">{exercicio.nome}</TableBodyCell>
            <TableBodyCell><span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-sm">{exercicio.grupo_muscular}</span></TableBodyCell>
            <TableBodyCell class="text-sm text-gray-500 truncate max-w-xs">{exercicio.descricao || 'Sem descrição'}</TableBodyCell>
            <TableBodyCell>
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/exercicios/edit/${exercicio.id_exercicio}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(exercicio.id_exercicio)}
                disabled={deletingId === exercicio.id_exercicio || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>

  <!-- Cards para telas pequenas (Mobile) -->
  <div class="block xl:hidden">
    <div class="w-full px-4 mb-2 flex justify-center">
      <input 
        type="search" 
        id="busca-mobile" 
        placeholder="Digite o nome do exercício" 
        bind:value={filtro} 
        on:input={filtraExercicios}
        class="w-full max-w-sm border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
    </div>

    <div class="flex flex-col items-center gap-4 my-4 max-w-3xl mx-auto md:grid md:grid-cols-2">
      {#each exercicios as exercicio}
        <!-- Card de exercício -->
        <Card class="max-w-sm w-full p-0 overflow-hidden shadow-lg border border-gray-200">
          <div class="px-4 py-4 bg-gray-100 text-left flex items-start justify-between">
            <div>
              <div class="text-xs text-gray-400 text-left">ID: {exercicio.id_exercicio}</div>
              <div class="text-lg font-semibold text-gray-800 text-left mt-0.5">{exercicio.nome}</div>
              <div class="mt-1 text-left">
                <span class="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">{exercicio.grupo_muscular}</span>
              </div>
              {#if exercicio.descricao}
                <p class="text-xs text-gray-500 mt-2 text-left line-clamp-2">{exercicio.descricao}</p>
              {/if}
            </div>
            <div class="flex gap-2 shrink-0">
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/exercicios/edit/${exercicio.id_exercicio}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(exercicio.id_exercicio)}
                disabled={deletingId === exercicio.id_exercicio || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  </div>
{/if}

<!-- Modal de confirmação -->
<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover este exercício?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
