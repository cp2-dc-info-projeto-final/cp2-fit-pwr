<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from 'flowbite-svelte';
  import api  from '$lib/api';
  import type { ApiResponse } from '$lib/api';

  interface Modalidade {
    id_modalidade: number;
    nome: string;
  }

  interface Professor {
    id: number;
    login: string;
  }

  interface UsuarioLogado {
    id: number;
    login: string;
    role: string;
  }

  interface Aula {
    id_turma: number;
    horario: string;
    nome_modalidade: string;
    professor: string;
    quantidade_alunos: number;
  }

  interface Aluno {
    id: number;
    login: string;
    email: string;
  }

  let modo: 'lista' | 'alunos' | 'criar' | 'editar' = 'lista';
  let aulas: Aula[] = [];
  let aulaSelecionada: Aula | null = null;
  let alunos: Aluno[] = [];
  let aulaEditando: Aula | null = null;

  let modalidades: Modalidade[] = [];
  let professores: Professor[] = [];
  let usuarioLogado: UsuarioLogado | null = null;

  let idModalidade = '';
  let idProfessor = '';
  let horario = '';

  let loading = false;
  let criando = false;
  let erro = '';
  let mensagem = '';

  onMount(() => {
    carregarPagina();
  });

  async function carregarPagina() {
    loading = true;
    erro = '';

    try {
      const [usuarioResponse, aulasResponse] = await Promise.all([
        api.get<ApiResponse<UsuarioLogado>>('/users/me'),
        api.get<ApiResponse<Aula[]>>('/aulas/professor')
      ]);

      if (usuarioResponse.data.success && usuarioResponse.data.data) {
        usuarioLogado = usuarioResponse.data.data;
      }

      if (aulasResponse.data.success && aulasResponse.data.data) {
        aulas = aulasResponse.data.data;
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao carregar suas aulas.';
    } finally {
      loading = false;
    }
  }

  async function carregarDadosCriacao() {
    try {
      const [modalidadesResponse, professoresResponse] = await Promise.all([
        api.get<ApiResponse<Modalidade[]>>('/modalidades'),
        api.get<ApiResponse<Professor[]>>('/users/professores')
      ]);

      if (
        modalidadesResponse.data.success &&
        modalidadesResponse.data.data
      ) {
        modalidades = modalidadesResponse.data.data;
      }

      if (
        professoresResponse.data.success &&
        professoresResponse.data.data
      ) {
        professores = professoresResponse.data.data;
      }

      if (usuarioLogado?.role === 'professor') {
        idProfessor = String(usuarioLogado.id);
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao carregar os dados.';
    }
  }

  async function abrirCriacao() {
    erro = '';
    mensagem = '';
    modo = 'criar';

    await carregarDadosCriacao();
  }

  function voltarLista() {
    modo = 'lista';
    aulaSelecionada = null;
    alunos = [];
    erro = '';
    mensagem = '';
  }

  async function abrirAlunos(aula: Aula) {
    loading = true;
    erro = '';
    mensagem = '';
    aulaSelecionada = aula;

    try {
      const response = await api.get<ApiResponse<Aluno[]>>(
        `/aulas/${aula.id_turma}/alunos`
      );

      if (response.data.success && response.data.data) {
        alunos = response.data.data;
        modo = 'alunos';
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao carregar os alunos.';
    } finally {
      loading = false;
    }
  }

  async function cancelarMatricula(aluno: Aluno) {
    if (!aulaSelecionada) return;

    const confirmar = confirm(
      `Deseja cancelar a matrícula de ${aluno.login}?`
    );

    if (!confirmar) return;

    try {
      await api.delete(
        `/aulas/${aulaSelecionada.id_turma}/alunos/${aluno.id}`
      );

      alunos = alunos.filter((item) => item.id !== aluno.id);

      aulas = aulas.map((aula) =>
        aula.id_turma === aulaSelecionada?.id_turma
          ? {
              ...aula,
              quantidade_alunos: Math.max(
                0,
                aula.quantidade_alunos - 1
              )
            }
          : aula
      );

      if (aulaSelecionada) {
        aulaSelecionada = {
          ...aulaSelecionada,
          quantidade_alunos: Math.max(
            0,
            aulaSelecionada.quantidade_alunos - 1
          )
        };
      }

      mensagem = 'Matrícula cancelada com sucesso.';
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao cancelar a matrícula.';
    }
  }

  async function criarAula() {
    erro = '';
    mensagem = '';

    if (!idModalidade || !horario) {
      erro = 'Preencha todos os campos.';
      return;
    }

    if (usuarioLogado?.role !== 'professor' && !idProfessor) {
      erro = 'Selecione um professor.';
      return;
    }

    criando = true;

    try {
      const professorId =
        usuarioLogado?.role === 'professor'
          ? usuarioLogado.id
          : Number(idProfessor);

      const response = await api.post('/turmas', {
        id_modalidade: Number(idModalidade),
        id_professor: professorId,
        horario
      });

      if (response.data.success) {
        idModalidade = '';
        idProfessor = '';
        horario = '';

        mensagem = 'Aula criada com sucesso.';

        await carregarPagina();

        modo = 'lista';
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao criar a aula.';
    } finally {
      criando = false;
    }
  }

  async function abrirEdicao(aula: Aula) {
  erro = '';
  mensagem = '';

  aulaEditando = aula;

  idModalidade = String(
    modalidades.find(
      (modalidade) => modalidade.nome === aula.nome_modalidade
    )?.id_modalidade ?? ''
  );

  idProfessor = String(
    professores.find(
      (professor) => professor.login === aula.professor
    )?.id ?? ''
  );

  horario = aula.horario;

  if (modalidades.length === 0 || professores.length === 0) {
    await carregarDadosCriacao();

    idModalidade = String(
      modalidades.find(
        (modalidade) => modalidade.nome === aula.nome_modalidade
      )?.id_modalidade ?? ''
    );

    idProfessor = String(
      professores.find(
        (professor) => professor.login === aula.professor
      )?.id ?? ''
    );
  }

  modo = 'editar';
}

async function excluirAula(aula: Aula) {
  const confirmar = confirm(
    `Deseja realmente excluir a aula de ${aula.nome_modalidade} às ${aula.horario}?`
  );

  if (!confirmar) return;

  try {
    erro = '';
    mensagem = '';

    await api.delete(`/turmas/${aula.id_turma}`);

    aulas = aulas.filter(
      (item) => item.id_turma !== aula.id_turma
    );

    mensagem = 'Aula excluída com sucesso.';
  } catch (error: any) {
    erro =
      error?.response?.data?.message ||
      'Erro ao excluir a aula.';
  }
}

async function atualizarAula() {
  if (!aulaEditando) return;

  erro = '';
  mensagem = '';

  if (!idModalidade || !horario) {
    erro = 'Preencha todos os campos.';
    return;
  }

  if (usuarioLogado?.role !== 'professor' && !idProfessor) {
    erro = 'Selecione um professor.';
    return;
  }

  criando = true;

  try {
    const professorId =
      usuarioLogado?.role === 'professor'
        ? usuarioLogado.id
        : Number(idProfessor);

    await api.put(`/turmas/${aulaEditando.id_turma}`, {
      id_modalidade: Number(idModalidade),
      id_professor: professorId,
      horario
    });

    mensagem = 'Aula atualizada com sucesso.';

    await carregarPagina();

    aulaEditando = null;
    modo = 'lista';

    idModalidade = '';
    idProfessor = '';
    horario = '';
  } catch (error: any) {
    erro =
      error?.response?.data?.message ||
      'Erro ao atualizar a aula.';
  } finally {
    criando = false;
  }
}
</script>

{#if modo === 'lista'}
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">Minhas Aulas</h1>

    <button
      class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      on:click={abrirCriacao}
    >
      + Criar
    </button>
  </div>

  {#if erro}
    <div class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
      {erro}
    </div>
  {/if}

  {#if loading}
    <p>Carregando...</p>
  {:else if aulas.length === 0}
    <Card>
      <div class="p-6 text-center">
        <h2 class="text-lg font-semibold">Nenhuma aula encontrada</h2>
        <p class="mt-2 text-gray-500">
          Você ainda não possui aulas cadastradas.
        </p>
      </div>
    </Card>
  {:else}
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {#each aulas as aula}
        <Card class="h-full transition hover:shadow-lg">
          <div class="p-2">
            <button
              class="w-full text-left"
              on:click={() => abrirAlunos(aula)}
            >
              <h2 class="text-xl font-bold">
                {aula.nome_modalidade}
              </h2>

              <p class="mt-3 text-gray-600">
                Horário: {aula.horario}
              </p>

              <p class="text-gray-600">
                Professor: {aula.professor}
              </p>

              <p class="mt-3 font-medium">
                Alunos matriculados:
                {aula.quantidade_alunos}
              </p>
            </button>

            <div class="mt-5 flex gap-3 border-t pt-4">
              <button
                class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                on:click={() => abrirEdicao(aula)}
              >
                Editar
              </button>

              <button
                class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                on:click={() => excluirAula(aula)}
              >
                Excluir
              </button>
            </div>
          </div>
        </Card>
      {/each}
</div>
  {/if}

{:else if modo === 'alunos'}
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">
        {aulaSelecionada?.nome_modalidade}
      </h1>

      <p class="text-gray-600">
        Horário: {aulaSelecionada?.horario}
      </p>
    </div>

    <button
      class="rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
      on:click={voltarLista}
    >
      Voltar
    </button>
  </div>

  {#if erro}
    <div class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
      {erro}
    </div>
  {/if}

  {#if mensagem}
    <div class="mb-4 rounded-lg bg-green-100 p-4 text-green-700">
      {mensagem}
    </div>
  {/if}

  {#if alunos.length === 0}
    <Card>
      <div class="p-6 text-center">
        <h2 class="text-lg font-semibold">
          Nenhum aluno matriculado
        </h2>
      </div>
    </Card>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-gray-500">
        <thead class="bg-gray-100 text-xs uppercase text-gray-700">
          <tr>
            <th class="px-6 py-3">Aluno</th>
            <th class="px-6 py-3">E-mail</th>
            <th class="px-6 py-3 text-right">Ação</th>
          </tr>
        </thead>

        <tbody>
          {#each alunos as aluno}
            <tr class="border-b bg-white">
              <td class="px-6 py-4 font-medium text-gray-900">
                {aluno.login}
              </td>

              <td class="px-6 py-4">
                {aluno.email}
              </td>

              <td class="px-6 py-4 text-right">
                <button
                  class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  on:click={() => cancelarMatricula(aluno)}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

{:else if modo === 'criar'}
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Criar Aula</h1>

    <button
      class="rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
      on:click={voltarLista}
    >
      Voltar
    </button>
  </div>

  {#if erro}
    <div class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
      {erro}
    </div>
  {/if}

  <Card>
    <form on:submit|preventDefault={criarAula} class="space-y-5">
      <div>
        <label
          for="modalidade"
          class="mb-2 block text-sm font-medium text-gray-900"
        >
          Modalidade
        </label>

        <select
          id="modalidade"
          bind:value={idModalidade}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
        >
          <option value="">Selecione uma modalidade</option>

          {#each modalidades as modalidade}
            <option value={modalidade.id_modalidade}>
              {modalidade.nome}
            </option>
          {/each}
        </select>
      </div>

      {#if usuarioLogado?.role !== 'professor'}
        <div>
          <label
            for="professor"
            class="mb-2 block text-sm font-medium text-gray-900"
          >
            Professor
          </label>

          <select
            id="professor"
            bind:value={idProfessor}
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
          >
            <option value="">Selecione um professor</option>

            {#each professores as professor}
              <option value={professor.id}>
                {professor.login}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <label
          for="horario"
          class="mb-2 block text-sm font-medium text-gray-900"
        >
          Horário
        </label>

        <input
          id="horario"
          type="time"
          bind:value={horario}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={criando}
        class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {criando ? 'Criando...' : 'Criar Aula'}
      </button>
    </form>
  </Card>

  {:else if modo === 'editar'}
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Editar Aula</h1>

      <button
        class="rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        on:click={voltarLista}
      >
        Voltar
      </button>
    </div>

    {#if erro}
      <div class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
        {erro}
      </div>
    {/if}

    <Card>
      <form on:submit|preventDefault={atualizarAula} class="space-y-5">
        <div>
          <label
            for="modalidade-editar"
            class="mb-2 block text-sm font-medium text-gray-900"
          >
            Modalidade
          </label>

          <select
            id="modalidade-editar"
            bind:value={idModalidade}
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
          >
            <option value="">Selecione uma modalidade</option>

            {#each modalidades as modalidade}
              <option value={modalidade.id_modalidade}>
                {modalidade.nome}
              </option>
            {/each}
          </select>
        </div>

        {#if usuarioLogado?.role !== 'professor'}
          <div>
            <label
              for="professor-editar"
              class="mb-2 block text-sm font-medium text-gray-900"
            >
              Professor
            </label>

            <select
              id="professor-editar"
              bind:value={idProfessor}
              class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
            >
              <option value="">Selecione um professor</option>

              {#each professores as professor}
                <option value={professor.id}>
                  {professor.login}
                </option>
              {/each}
            </select>
          </div>
        {/if}

        <div>
          <label
            for="horario-editar"
            class="mb-2 block text-sm font-medium text-gray-900"
          >
            Horário
          </label>

          <input
            id="horario-editar"
            type="time"
            bind:value={horario}
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={criando}
          class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {criando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </Card>
{/if}