<script lang="ts">
  // Tabela de turmas
  
  import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Card } from 'flowbite-svelte'; // UI
  import ConfirmModal from './ConfirmModal.svelte'; // modal de confirmação
  import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons'; // ícones
  import { goto } from '$app/navigation'; // navegação
  import api from '$lib/api'; // API backend
  import type { ApiResponse } from '$lib/api';
  import { onMount } from 'svelte'; // ciclo de vida

  // Interfaces locais para mapeamento das chaves estrangeiras
  interface ClassItem {
    id_turma: number;
    id_professor: number;
    id_modalidade: number;
    horario: string;
  }

  let classes: ClassItem[] = []; // lista de turmas
  let loading = true;
  let error = '';
  let deletingId: number | null = null; // id em deleção
  let confirmOpen = false; // modal aberto?
  let confirmTargetId: number | null = null; // id alvo do modal
  let filtro = "";

  // Dicionários para mapear os códigos para nomes legíveis
  let teacherMap: Record<number, string> = {};
  let modalityMap: Record<number, string> = {};

  async function filtraTurmas(){
    try {
      // Filtra turmas passando o horário ou critério aceito pela sua API
      const res = await api.get(`/turmas?horario=${encodeURIComponent(filtro)}`);
      const body = res.data as ApiResponse<ClassItem[]>;
      if (body.success) {
        classes = body.data ?? [];
      } else {
        error = body.message;
      }
    } catch (e: any) {
      console.error('Erro ao filtrar turmas:', e);
      const body = e.response?.data as ApiResponse<ClassItem[]> | undefined;
      error = body?.message || 'Erro ao carregar turmas';
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
      const res = await api.delete(`/turmas/${id}`);
      const body = res.data as ApiResponse<null>;
      if (!body.success) {
        error = body.message;
        return;
      }
      classes = classes.filter(c => c.id_turma !== id);
    } catch (e: any) {
      console.error('Erro ao deletar turma:', e);
      const body = e.response?.data as ApiResponse<null> | undefined;
      error = body?.message || 'Erro ao remover turma.';
    } finally {
      deletingId = null;
    }
  }

  onMount(async () => {
    try {
      // 1. Carrega dados auxiliares (professores) do endpoint /users
      const resTeachers = await api.get('/users');
      const bodyTeachers = resTeachers.data as ApiResponse<any[]>;
      if (bodyTeachers.success && bodyTeachers.data) {
        bodyTeachers.data.forEach(u => {
          teacherMap[u.id] = u.login; // Vincula ID do utilizador ao seu login/nome
        });
      }

      // 2. Carrega dados auxiliares (modalidades)
      const resModalities = await api.get('/modalidades');
      const bodyModalities = resModalities.data as ApiResponse<any[]>;
      if (bodyModalities.success && bodyModalities.data) {
        bodyModalities.data.forEach(m => {
          modalityMap[m.id_modalidade] = m.nome;
        });
      }

      // 3. Carrega a listagem principal de turmas
      const resClasses = await api.get('/turmas');
      const bodyClasses = resClasses.data as ApiResponse<ClassItem[]>;
      if (bodyClasses.success) {
        classes = bodyClasses.data ?? [];
      } else {
        error = bodyClasses.message;
      }
    } catch (e: any) {
      console.error('Erro ao carregar turmas:', e);
      const body = e.response?.data as ApiResponse<ClassItem[]> | undefined;
      error = body?.message || 'Erro ao carregar turmas';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="my-8 text-center text-gray-500">Carregando turmas...</div>
{:else if error}
  <div class="my-8 text-center text-red-500">{error}</div>
{:else}
  <!-- Tabela para telas médias/grandes -->
  <div class="hidden xl:block">
    <!-- Busca de turmas -->
    <div class="w-full max-w-5xl mx-auto mb-2 flex justify-start">
      <input 
        type="search" 
        id="busca" 
        placeholder="Digite o horário da turma" 
        bind:value={filtro} 
        on:input={filtraTurmas}
        class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
    </div>

    <Table class="w-full max-w-5xl mx-auto my-4 shadow-lg border border-gray-200 rounded-lg">
      <TableHead>
        <TableHeadCell class="w-16">Aula</TableHeadCell>
        <TableHeadCell class="w-48">Professor</TableHeadCell>
        <TableHeadCell class="min-w-0">Modalidade</TableHeadCell>
        <TableHeadCell class="min-w-0">Horário</TableHeadCell>
        <TableHeadCell class="w-24"></TableHeadCell> <!-- coluna para editar/remover -->
      </TableHead>
      <TableBody>
        {#each classes as c}
          <TableBodyRow>
            <TableBodyCell>{c.id_turma}</TableBodyCell>
            <TableBodyCell>{teacherMap[c.id_professor] || `ID: ${c.id_professor}`}</TableBodyCell>
            <TableBodyCell class="font-medium text-gray-900">{modalityMap[c.id_modalidade] || `ID: ${c.id_modalidade}`}</TableBodyCell>
            <TableBodyCell>{c.horario}</TableBodyCell>
            <TableBodyCell>
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/turmas/edit/${c.id_turma}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(c.id_turma)}
                disabled={deletingId === c.id_turma || loading}
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
        placeholder="Digite o horário da turma" 
        bind:value={filtro} 
        on:input={filtraTurmas}
        class="w-full max-w-sm border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
    </div>

    <div class="flex flex-col items-center gap-4 my-4 max-w-3xl mx-auto md:grid md:grid-cols-2">
      {#each classes as c}
        <!-- Card da turma -->
        <Card class="max-w-sm w-full p-0 overflow-hidden shadow-lg border border-gray-200">
          <div class="px-4 pt-4 pb-2 bg-gray-100 text-left flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold text-gray-800 text-left">{modalityMap[c.id_modalidade] || `Modalidade: ${c.id_modalidade}`}</div>
              <div class="text-xs text-gray-400 text-left">ID Turma: {c.id_turma}</div>
            </div>
            <div class="flex gap-2">
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/turmas/edit/${c.id_turma}`)}
              >
                <EditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(c.id_turma)}
                disabled={deletingId === c.id_turma || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
          <div class="px-4 pb-4 pt-2 flex flex-col gap-2 text-left">
            <div class="text-sm text-gray-700">
              <span class="font-medium">Professor:</span> {teacherMap[c.id_professor] || `ID: ${c.id_professor}`}
            </div>
            <div class="text-xs text-gray-500">
              Horário: {c.horario}
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
  message="Tem certeza que deseja remover esta turma?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>