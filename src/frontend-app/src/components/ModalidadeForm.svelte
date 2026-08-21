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

  let modality: ModalityFormData = { id: 0, nome: '' }; // dados do form
  
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
        const body = res.data as ApiResponse<Modality>;
        console.log(body);
        if (body.success && body.data) {
          modality = { ...body.data };
        } else {
          error = body.message;
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<Modality> | undefined;
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
      const modalityData = { ...modality };
      
      if (id === null) {
        const res = await api.post('/modalidades', modalityData);
        const body = res.data as ApiResponse<Modality>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      } else {
        const res = await api.put(`/modalidades/${id}`, modalityData);
        const body = res.data as ApiResponse<Modality>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }
      goto('/modalidades');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<Modality> | undefined;
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
<Card class="max-w-md mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <!-- Formulário principal -->
  <form class="flex flex-col gap-6 p-6" on:submit|preventDefault={handleSubmit}>
    <!-- Título -->
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Modalidade' : 'Editar Modalidade'}
    </Heading>
    
    <!-- Mensagem de erro geral -->
    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}
    
    <!-- Campo nome -->
    <div>
      <Label for="nome">Nome da Modalidade</Label>
      <Input id="nome" bind:value={modality.nome} placeholder="Ex: Futebol, Natação..." required class="mt-1" />
      {#if errorOf('nome')}
        <div class="mt-1 text-sm text-red-500">{errorOf('nome')}</div>
      {/if}
    </div>
    
    <!-- Botões de ação -->
    <div class="flex gap-4 justify-end mt-4">
      <!-- Botão cancelar/voltar -->
      <Button color="light" type="button" onclick={handleCancel} disabled={loading}>
        <ArrowLeftOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {id === null ? 'Voltar' : 'Cancelar'}
      </Button>
      <!-- Botão salvar -->
      <Button type="submit" color="primary" disabled={loading}>
        <FloppyDiskAltOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {id === null ? 'Cadastrar' : 'Salvar'}
      </Button>
    </div>
  </form>
</Card>