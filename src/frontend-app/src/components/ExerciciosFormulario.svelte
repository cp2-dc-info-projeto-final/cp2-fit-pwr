<script lang="ts">
  // Formulário de exercício
  import { Card, Button, Label, Input, Textarea, Heading } from 'flowbite-svelte'; // UI
  import { onMount } from 'svelte'; // ciclo de vida
  import api from '\$lib/api'; // API backend
  import type { ApiFieldError, ApiResponse } from '\$lib/api';
  import { goto } from '\$app/navigation'; // navegação
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons'; // ícones
  import type { Exercicio, ExercicioFormData } from '\$lib/models/Exercicio'; // Caminho para as suas interfaces de Exercício

  export let id: number | null = null; // id_exercicio

  let exercicio: ExercicioFormData = { 
    nome: '',
    grupo_muscular: '',
    descricao: '',
    imagem: ''
  }; 
  
  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  // Carrega o exercício se for edição
  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        const res = await api.get(`/exercicios/${id}`);
        const body = res.data as ApiResponse<Exercicio[]>; // Retorna o array do banco
        
        if (body.success && body.data && body.data.length > 0) {
          const dadosDoBanco = body.data[0];
          exercicio = { 
            nome: dadosDoBanco.nome,
            grupo_muscular: dadosDoBanco.grupo_muscular,
            descricao: dadosDoBanco.descricao ?? '',
            imagem: dadosDoBanco.imagem ?? ''
          };
        } else {
          error = body.message;
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<Exercicio[]> | undefined;
        error = body?.message || 'Erro ao carregar exercício.';
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
      // Payload estruturado exatamente para a tabela 'exercicio'
      const exercicioData = { 
        nome: exercicio.nome,
        grupo_muscular: exercicio.grupo_muscular,
        descricao: exercicio.descricao || null, // Garante que string vazia vá como NULL para o banco
        imagem: exercicio.imagem || null        // Garante que string vazia vá como NULL para o banco
      };
      
      if (id === null) {
        const res = await api.post('/exercicios', exercicioData);
        const body = res.data as ApiResponse<Exercicio[]>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors || [];
          return;
        }
      } else {
        const res = await api.put(`/exercicios/${id}`, exercicioData);
        const body = res.data as ApiResponse<Exercicio[]>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors || [];
          return;
        }
      }
      goto('/exercicios');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<Exercicio[]> | undefined;
      error = body?.message || 'Erro ao salvar exercício.';
      fieldErrors = body?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/exercicios');
  }
</script>

<!-- Card do formulário -->
<Card class="max-w-md mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <!-- Formulário principal -->
  <form class="flex flex-col gap-5 p-6" on:submit|preventDefault={handleSubmit}>
    <!-- Título -->
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Exercício' : 'Editar Exercício'}
    </Heading>
    
    <!-- Mensagem de erro geral -->
    {#if error}
      <div class="text-red-500 text-center text-sm font-medium">{error}</div>
    {/if}
    
    <!-- Campo nome -->
    <div>
      <Label for="nome">Nome do Exercício</Label>
      <Input id="nome" bind:value={exercicio.nome} placeholder="Ex: Supino Reto, Agachamento Livre..." required class="mt-1" />
      {#if errorOf('nome')}
        <div class="mt-1 text-sm text-red-500">{errorOf('nome')}</div>
      {/if}
    </div>

    <!-- Campo Grupo Muscular -->
    <div>
      <Label for="grupo_muscular">Grupo Muscular</Label>
      <Input id="grupo_muscular" bind:value={exercicio.grupo_muscular} placeholder="Ex: Peito, Pernas, Costas..." required class="mt-1" />
      {#if errorOf('grupo_muscular')}
        <div class="mt-1 text-sm text-red-500">{errorOf('grupo_muscular')}</div>
      {/if}
    </div>

    <!-- Campo Descrição -->
    <div>
      <Label for="descricao">Descrição / Instruções (Opcional)</Label>
      <Textarea id="descricao" bind:value={exercicio.descricao} placeholder="Instruções de execução do exercício..." rows="3" class="mt-1" />
      {#if errorOf('descricao')}
        <div class="mt-1 text-sm text-red-500">{errorOf('descricao')}</div>
      {/if}
    </div>

    <!-- Campo Imagem -->
    <div>
      <Label for="imagem">URL da Imagem / GIF (Opcional)</Label>
      <Input id="imagem" type="url" bind:value={exercicio.imagem} placeholder="https://exemplo.com" class="mt-1" />
      {#if errorOf('imagem')}
        <div class="mt-1 text-sm text-red-500">{errorOf('imagem')}</div>
      {/if}
    </div>
    
    <!-- Botões de ação -->
    <div class="flex gap-4 justify-end mt-4">
      <!-- Botão cancelar/voltar -->
      <Button color="light" type="button" on:click={handleCancel} disabled={loading}>
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
