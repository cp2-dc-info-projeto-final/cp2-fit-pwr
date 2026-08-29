<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from 'flowbite-svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';

  type Modalidade = {
    id_modalidade: number;
    nome: string;
  };

  type Professor = {
    id: number;
    login: string;
  };

  let modalidades: Modalidade[] = [];
  let professores: Professor[] = [];

  let idModalidade = '';
  let idProfessor = '';
  let horario = '';

  let loading = true;
  let criando = false;
  let mensagem = '';
  let erro = '';

  async function carregarDados() {
  loading = true;
  erro = '';

  try {
    const [modalidadesRes, usuariosRes] = await Promise.all([
      api.get('/modalidades'),
      api.get('/users/professores')
    ]);

    const modalidadesBody =
      modalidadesRes.data as ApiResponse<Modalidade[]>;

    const usuariosBody =
      usuariosRes.data as ApiResponse<Professor[]>;

    if (modalidadesBody.success) {
      modalidades = modalidadesBody.data ?? [];
    }

    if (usuariosBody.success) {
      professores = usuariosBody.data ?? [];
    }

  } catch (e: any) {
    console.error('Erro ao carregar dados:', e);

    const body = e.response?.data as
      | ApiResponse<any>
      | undefined;

    erro =
      body?.message ||
      'Erro ao carregar modalidades e professores.';

  } finally {
    loading = false;
  }
}
  async function criarAula() {
  mensagem = '';
  erro = '';

  if (!idModalidade || !idProfessor || !horario) {
    erro = 'Preencha todos os campos.';
    return;
  }

  criando = true;

  try {
    const res = await api.post('/turmas', {
      id_modalidade: Number(idModalidade),
      id_professor: Number(idProfessor),
      horario
    });

    const body = res.data as ApiResponse<any>;

    if (!body.success) {
      erro = body.message || 'Erro ao criar aula.';
      return;
    }

    mensagem = body.message || 'Aula criada com sucesso!';

    idModalidade = '';
    idProfessor = '';
    horario = '';

  } catch (e: any) {
  console.error('ERRO:', e);
  console.error('STATUS:', e.response?.status);
  console.error('DATA:', e.response?.data);
  console.error('HEADERS:', e.response?.headers);

    const body = e.response?.data as
      | ApiResponse<any>
      | undefined;

    erro =
    e.response?.data?.message ||
    'Erro ao criar aula.';

  } finally {
    criando = false;
  }
}

  onMount(() => {
    carregarDados();
  });
</script>

<div class="max-w-3xl mx-auto px-4 py-8">

  <Card class="shadow-lg">

```
<div class="mb-6">
  <h1 class="text-2xl font-bold text-gray-800">
    Criar Aula Coletiva
  </h1>

  <p class="text-gray-500 mt-1">
    Cadastre uma nova aula para os alunos.
  </p>
</div>

{#if loading}

  <div class="text-center py-8 text-gray-500">
    Carregando dados...
  </div>

{:else}

  <div class="flex flex-col gap-5">

    <!-- Modalidade -->
    <div>
      <label
        for="modalidade"
        class="block mb-2 text-sm font-medium text-gray-700"
      >
        Modalidade
      </label>

      <select
        id="modalidade"
        bind:value={idModalidade}
        class="w-full rounded-lg border border-gray-300 p-2.5"
      >
        <option value="">
          Selecione uma modalidade
        </option>

        {#each modalidades as modalidade}
          <option value={modalidade.id_modalidade}>
            {modalidade.nome}
          </option>
        {/each}
      </select>
    </div>

    <!-- Professor -->
    <div>
      <label
        for="professor"
        class="block mb-2 text-sm font-medium text-gray-700"
      >
        Professor
      </label>

      <select
        id="professor"
        bind:value={idProfessor}
        class="w-full rounded-lg border border-gray-300 p-2.5"
      >
        <option value="">
          Selecione um professor
        </option>

        {#each professores as professor}
          <option value={professor.id}>
            {professor.login}
          </option>
        {/each}
      </select>
    </div>

    <!-- Horário -->
    <div>
      <label
        for="horario"
        class="block mb-2 text-sm font-medium text-gray-700"
      >
        Horário
      </label>

      <input
        id="horario"
        type="time"
        bind:value={horario}
        class="w-full rounded-lg border border-gray-300 p-2.5"
      />
    </div>

    {#if erro}
      <div class="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {erro}
      </div>
    {/if}

    {#if mensagem}
      <div class="rounded-lg bg-green-50 p-4 text-sm text-green-600">
        {mensagem}
      </div>
    {/if}

    <button
      type="button"
      on:click={criarAula}
      disabled={criando}
      class="w-full rounded-lg bg-primary-500 px-5 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
    >
      {#if criando}
        Criando aula...
      {:else}
        Criar aula
      {/if}
    </button>

  </div>

{/if}
```

  </Card>

</div>
