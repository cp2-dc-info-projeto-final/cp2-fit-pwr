<script lang="ts">
  // Formulário de turma
  import { Card, Button, Label, Heading, Select } from 'flowbite-svelte'; // UI
  import { onMount } from 'svelte'; // ciclo de vida
  import api from '$lib/api'; // API backend
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation'; // navegação
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons'; // ícones

  export let id: number | null = null; // id da turma

  let classData: ClassFormData = { id_professor: '', id_modalidade: '', horario: '' }; // dados do form
  
  let usersOptions: { value: string; name: string }[] = []; // lista de professores (users) para o select
  let modalities: { value: string; name: string }[] = []; // lista de modalidades para o select

  let scheduleOptions = [
    { value: 'manhã', name: 'Manhã' },
    { value: 'tarde', name: 'Tarde' },
    { value: 'noite', name: 'Noite' }
  ];

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  // Carrega dados iniciais (utilizadores, modalidades e a turma se for edição)
  onMount(async () => {
    loading = true;
    try {
      // 1. Carrega os utilizadores gerais e filtra quem tem o papel de professor
      const resUsers = await api.get('/users');
      const bodyUsers = resUsers.data as ApiResponse<User[]>;
      if (bodyUsers.success && bodyUsers.data) {
        usersOptions = bodyUsers.data
          .filter(u => u.role === 'professor')
          .map(u => ({ value: u.id.toString(), name: u.login }));
      }

      // 2. Carrega as modalidades para popular o select
      const resModalities = await api.get('/modalidades');
      const bodyModalities = resModalities.data as ApiResponse<Modality[]>;
      if (bodyModalities.success && bodyModalities.data) {
        modalities = bodyModalities.data.map(m => ({ value: m.id_modalidade.toString(), name: m.nome }));
      }

      // 3. Se for edição, carrega os dados da turma específica
      if (id !== null) {
        const resClass = await api.get(`/turmas/${id}`);
        const bodyClass = resClass.data as ApiResponse<any[]>;
        if (bodyClass.success && bodyClass.data && bodyClass.data.length > 0) {
          const fetchedClass = bodyClass.data[0];
          classData = {
            id_professor: fetchedClass.id_professor.toString(),
            id_modalidade: fetchedClass.id_modalidade.toString(),
            horario: fetchedClass.horario
          };
        } else {
          error = bodyClass.message;
        }
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados iniciais:', e);
      error = 'Erro ao carregar dados do formulário.';
    } finally {
      loading = false;
    }
  });

  // Submissão do formulário
  async function handleSubmit() {
    fieldErrors = [];
    loading = true;
    error = '';
    
    try {
      const payload = {
        id_professor: parseInt(classData.id_professor),
        id_modalidade: parseInt(classData.id_modalidade),
        horario: classData.horario
      };
      
      if (id === null) {
        const res = await api.post('/turmas', payload);
        const body = res.data as ApiResponse<any[]>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      } else {
        const res = await api.put(`/turmas/${id}`, payload);
        const body = res.data as ApiResponse<any[]>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }
      goto('/turmas');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<any[]> | undefined;
      error = body?.message || 'Erro ao salvar turma.';
      fieldErrors = body?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/turmas');
  }
</script>

<!-- Card do formulário -->
<Card class="max-w-md mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <!-- Formulário principal -->
  <form class="flex flex-col gap-6 p-6" on:submit|preventDefault={handleSubmit}>
    <!-- Título -->
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Turma' : 'Editar Turma'}
    </Heading>
    
    <!-- Mensagem de erro geral -->
    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}
    
    <!-- Campo professor -->
    <div>
      <Label for="id_professor">Professor</Label>
      <Select id="id_professor" items={usersOptions} bind:value={classData.id_professor} placeholder="Selecione um professor..." required class="mt-1" />
      {#if errorOf('id_professor')}
        <div class="mt-1 text-sm text-red-500">{errorOf('id_professor')}</div>
      {/if}
    </div>

    <!-- Campo modalidade -->
    <div>
      <Label for="id_modalidade">Modalidade</Label>
      <Select id="id_modalidade" items={modalities} bind:value={classData.id_modalidade} placeholder="Selecione uma modalidade..." required class="mt-1" />
      {#if errorOf('id_modalidade')}
        <div class="mt-1 text-sm text-red-500">{errorOf('id_modalidade')}</div>
      {/if}
    </div>

    <!-- Campo horário -->
    <div>
      <Label for="horario">Horário da Turma</Label>
      <Select id="horario" items={scheduleOptions} bind:value={classData.horario} placeholder="Selecione o turno..." required class="mt-1" />
      {#if errorOf('horario')}
        <div class="mt-1 text-sm text-red-500">{errorOf('horario')}</div>
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