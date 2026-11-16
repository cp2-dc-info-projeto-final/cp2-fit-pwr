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
<Card class="mx-auto mt-8 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-2xl">

  <!-- Cabeçalho do formulário -->
  <div class="border-b border-gray-700 bg-gray-950/60 px-6 py-5 sm:px-8">
    <div class="mb-2 flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-blue-500"></span>
      <span class="text-xs font-bold uppercase tracking-widest text-blue-400">
        Gerenciamento de exercícios
      </span>
    </div>

    <Heading tag="h3" class="text-xl font-bold text-white">
      {id === null ? 'Cadastrar Exercício' : 'Editar Exercício'}
    </Heading>

    <p class="mt-1 text-sm text-gray-400">
      Preencha as informações para configurar o exercício.
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
        Nome do Exercício
      </Label>

      <Input
        id="nome"
        bind:value={exercicio.nome}
        placeholder="Ex: Supino Reto, Agachamento Livre..."
        required
        class="mt-1"
      />

      {#if errorOf('nome')}
        <div class="mt-2 text-sm font-medium text-red-400">
          {errorOf('nome')}
        </div>
      {/if}
    </div>

    <!-- Campo Grupo Muscular -->
    <div>
      <Label for="grupo_muscular" class="mb-2 block text-sm font-semibold text-gray-200">
        Grupo Muscular
      </Label>

      <Input
        id="grupo_muscular"
        bind:value={exercicio.grupo_muscular}
        placeholder="Ex: Peito, Pernas, Costas..."
        required
        class="mt-1"
      />

      {#if errorOf('grupo_muscular')}
        <div class="mt-2 text-sm font-medium text-red-400">
          {errorOf('grupo_muscular')}
        </div>
      {/if}
    </div>

    <!-- Campo Descrição -->
    <div>
      <Label for="descricao" class="mb-2 block text-sm font-semibold text-gray-200">
        Descrição / Instruções
        <span class="ml-1 text-xs font-normal text-gray-500">(Opcional)</span>
      </Label>

      <Textarea
        id="descricao"
        bind:value={exercicio.descricao}
        placeholder="Instruções de execução do exercício..."
        rows="4"
        class="mt-1"
      />

      {#if errorOf('descricao')}
        <div class="mt-2 text-sm font-medium text-red-400">
          {errorOf('descricao')}
        </div>
      {/if}
    </div>

    <!-- Campo Imagem -->
    <div>
      <Label for="imagem" class="mb-2 block text-sm font-semibold text-gray-200">
        URL da Imagem / GIF
        <span class="ml-1 text-xs font-normal text-gray-500">(Opcional)</span>
      </Label>

      <Input
        id="imagem"
        type="url"
        bind:value={exercicio.imagem}
        placeholder="https://exemplo.com"
        class="mt-1"
      />

      {#if errorOf('imagem')}
        <div class="mt-2 text-sm font-medium text-red-400">
          {errorOf('imagem')}
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
        on:click={handleCancel}
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
