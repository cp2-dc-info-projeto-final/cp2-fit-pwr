<script lang="ts">
  // Formulário de modalidade
  import { Card, Button, Label, Input, Heading } from 'flowbite-svelte'; // UI
  import { onMount } from 'svelte'; // ciclo de vida
  import api from '$lib/api'; // API backend
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation'; // navegação
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons'; // ícones
  import type { Modality, ModalityFormData } from '$lib/models/Modality'; // Adapte o caminho do seu model se necessário

  export let id: number | null = null; // id da modalidade

  // Correção: Inicializa usando a estrutura correta (apenas nome para o formulário)
  let modality: ModalityFormData = { nome: '' }; // dados do form
  
  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  // Carrega modalidade se for edição
  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        const res = await api.get(`/modalidades/${id}`);
        const body = res.data as ApiResponse<Modality[]>; // Correção: Backend agora retorna um array
        console.log(body);
        if (body.success && body.data && body.data.length > 0) {
          // Correção: Acessa a primeira posição do array retornado pelo PG
          modality = { nome: body.data[0].nome };
        } else {
          error = body.message;
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<Modality[]> | undefined;
        error = body?.message || 'Erro ao carregar modalidade.';
      } finally {
        loading = false;
      }
    } 
  });

  // Submissão do formulário
  async function handleSubmit() {
    fieldErrors = [];
    loading = true;
    error = '';
    
    try {
      // Correção: Envia apenas o payload que o backend espera (nome)
      const modalityData = { nome: modality.nome };
      
      if (id === null) {
        const res = await api.post('/modalidades', modalityData);
        const body = res.data as ApiResponse<Modality[]>; // Correção: Tipado para array
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      } else {
        const res = await api.put(`/modalidades/${id}`, modalityData);
        const body = res.data as ApiResponse<Modality[]>; // Correção: Tipado para array
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }
      goto('/modalidades');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<Modality[]> | undefined;
      error = body?.message || 'Erro ao salvar modalidade.';
      fieldErrors = body?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/modalidades');
  }
</script>

<!-- Card do formulário -->
<Card class="mx-auto mt-8 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-2xl">

  <!-- Cabeçalho do formulário -->
  <div class="border-b border-gray-700 bg-gray-950/60 px-6 py-5 sm:px-8">
    <div class="mb-2 flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-blue-500"></span>
      <span class="text-xs font-bold uppercase tracking-widest text-blue-400">
        Gerenciamento de modalidades
      </span>
    </div>

    <Heading tag="h3" class="text-xl font-bold text-white">
      {id === null ? 'Cadastrar Modalidade' : 'Editar Modalidade'}
    </Heading>

    <p class="mt-1 text-sm text-gray-400">
      Preencha as informações para configurar a modalidade.
    </p>
  </div>

  <!-- Formulário principal -->
  <form class="flex flex-col gap-5 p-6 sm:p-8" on:submit|preventDefault={handleSubmit}>

    <!-- Mensagem de erro geral -->
    {#if error}
      <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
        <div class="flex items-center gap-2">
          <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/20 font-bold">!</span>
          {error}
        </div>
      </div>
    {/if}

    <!-- Campo nome -->
    <div>
      <Label for="nome" class="mb-2 block text-sm font-semibold text-gray-200">
        Nome da Modalidade
      </Label>

      <Input
        id="nome"
        bind:value={modality.nome}
        placeholder="Ex: Musculação, Ginástica..."
        required
        class="mt-1"
      />

      {#if errorOf('nome')}
        <div class="mt-2 text-sm font-medium text-red-400">
          {errorOf('nome')}
        </div>
      {/if}
    </div>

    <!-- Divisor -->
    <div class="border-t border-gray-700 pt-5"></div>

    <!-- Botões de ação -->
    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

      <!-- Botão cancelar/voltar -->
      <Button
        color="dark"
        type="button"
        onclick={handleCancel}
        disabled={loading}
        class="w-full sm:w-auto"
      >
        <ArrowLeftOutline class="mr-2 inline h-5 w-5" />
        {id === null ? 'Voltar' : 'Cancelar'}
      </Button>

      <!-- Botão salvar -->
      <Button
        type="submit"
        color="blue"
        disabled={loading}
        class="w-full sm:w-auto"
      >
        <FloppyDiskAltOutline class="mr-2 inline h-5 w-5" />
        {loading ? 'Salvando...' : id === null ? 'Cadastrar' : 'Salvar alterações'}
      </Button>

    </div>

  </form>
</Card>
