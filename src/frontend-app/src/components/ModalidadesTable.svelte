<script lang="ts">
  // Tabela de modalidades
  
  import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Card } from 'flowbite-svelte'; // UI
  import ConfirmModal from './ConfirmModal.svelte'; // modal de confirmação
  import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons'; // ícones genéricos mais adequados
  import { goto } from '$app/navigation'; // navegação
  import api from '$lib/api'; // API backend
  import type { ApiResponse } from '$lib/api';
  import { onMount } from 'svelte'; // ciclo de vida
  import type { Modality } from '$lib/models/Modality'; // Ajuste o caminho se necessário

  let modalities: Modality[] = []; // lista de modalidades
  let loading = true;
  let error = '';
  let deletingId: number | null = null; // id em deleção
  let confirmOpen = false; // modal aberto?
  let confirmTargetId: number | null = null; // id alvo do modal
  let filtro = "";

  async function filtraModalidades(){
    try {
      const res = await api.get(`/modalidades?nome=${encodeURIComponent(filtro)}`);
      const body = res.data as ApiResponse<Modality[]>;
      if (body.success) {
        modalities = body.data ?? [];
      } else {
        error = body.message;
      }
    } catch (e: any) {
      console.error('Erro ao carregar modalidades:', e);
      const body = e.response?.data as ApiResponse<Modality[]> | undefined;
      error = body?.message || 'Erro ao carregar modalidades';
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
      const res = await api.delete(`/modalidades/${id}`);
      const body = res.data as ApiResponse<null>;
      if (!body.success) {
        error = body.message;
        return;
      }
      modalities = modalities.filter(modality => modality.id !== id);
    } catch (e: any) {
      console.error('Erro ao deletar modalidade:', e);
      const body = e.response?.data as ApiResponse<null> | undefined;
      error = body?.message || 'Erro ao remover modalidade.';
    } finally {
      deletingId = null;
    }
  }

  onMount(async () => {
    try {
      const res = await api.get('/modalidades');
      const body = res.data as ApiResponse<Modality[]>;
      if (body.success) {
        modalities = body.data ?? [];
      } else {
        error = body.message;
      }
    } catch (e: any) {
      console.error('Erro ao carregar modalidades:', e);
      const body = e.response?.data as ApiResponse<Modality[]> | undefined;
      error = body?.message || 'Erro ao carregar modalidades';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="my-8 text-center text-gray-500">Carregando modalidades...</div>
{:else if error}
  <div class="my-8 text-center text-red-500">{error}</div>
{:else}
  <!-- Tabela para telas médias/grandes -->
  <div class="hidden xl:block">
    <!-- Busca de modalidades -->
    <div class="w-full max-w-5xl mx-auto mb-2 flex justify-start">
      <input 
        type="search" 
        id="busca" 
        placeholder="Digite o nome da modalidade" 
        bind:value={filtro} 
        on:input={filtraModalidades}
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
    </div>
    
    <Table class="w-full max-w-5xl mx-auto my-4 shadow-lg border border-gray-200 rounded-lg">
      <TableHead>
        <TableHeadCell class="w-24">ID</TableHeadCell>
        <TableHeadCell class="min-w-0">Nome da Modalidade</TableHeadCell>
        <TableHeadCell class="w-24"></TableHeadCell> <!-- coluna para editar/remover -->
      </TableHead>
      <TableBody>
        {#each modalities as modality}
          <TableBodyRow>
            <TableBodyCell>{modality.id}</TableBodyCell>
            <TableBodyCell class="font-medium text-gray-900">{modality.nome}</TableBodyCell>
            <TableBodyCell>
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/modalidades/edit/${modality.id}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(modality.id)}
                disabled={deletingId === modality.id || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>

  <!-- Cards para telas pequenas -->
  <div class="block xl:hidden">
    <div class="w-full px-4 mb-2 flex justify-center">
      <input 
        type="search" 
        id="busca-mobile" 
        placeholder="Digite o nome da modalidade" 
        bind:value={filtro} 
        on:input={filtraModalidades}
        class="w-full max-w-sm border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
    </div>

    <div class="flex flex-col items-center gap-4 my-4 max-w-3xl mx-auto md:grid md:grid-cols-2">
      {#each modalities as modality}
        <!-- Card de modalidade -->
        <Card class="max-w-sm w-full p-0 overflow-hidden shadow-lg border border-gray-200">
          <div class="px-4 py-4 bg-gray-100 text-left flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-400 text-left">ID: {modality.id}</div>
              <div class="text-lg font-semibold text-gray-800 text-left mt-0.5">{modality.nome}</div>
            </div>
            <div class="flex gap-2">
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/modalidades/edit/${modality.id}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(modality.id)}
                disabled={deletingId === modality.id || loading}
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
  message="Tem certeza que deseja remover esta modalidade?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
