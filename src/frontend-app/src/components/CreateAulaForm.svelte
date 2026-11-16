<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from 'flowbite-svelte';
  import { UserEditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import api from '$lib/api';
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

    if (modalidades.length === 0 || professores.length === 0) {
      await carregarDadosCriacao();
    }

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

  <!-- CABEÇALHO -->
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
        <span class="text-xs font-bold uppercase tracking-widest text-blue-400">
          Painel de gerenciamento
        </span>
      </div>

      <h1 class="text-3xl font-extrabold tracking-tight text-white">
        Minhas Aulas
      </h1>

      <p class="mt-2 text-sm text-gray-400">
        Gerencie suas aulas coletivas e acompanhe os alunos matriculados.
      </p>
    </div>

    <button
      class="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
      on:click={abrirCriacao}
    >
      <span class="text-lg">+</span>
      Criar nova aula
    </button>
  </div>

  {#if erro}
    <div class="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
      {erro}
    </div>
  {/if}

  {#if mensagem}
    <div class="mb-6 rounded-xl border border-green-500/30 bg-green-950/30 p-4 text-sm text-green-300">
      {mensagem}
    </div>
  {/if}

  {#if loading}

    <div class="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
      <div class="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      <p class="font-semibold text-gray-200">Carregando aulas...</p>
      <p class="mt-2 text-xs text-gray-500">Preparando suas informações.</p>
    </div>

  {:else if aulas.length === 0}

    <div class="rounded-2xl border border-dashed border-gray-700 bg-gray-800/50 px-6 py-16 text-center">
      <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-3xl text-blue-400">
        +
      </div>

      <h2 class="text-lg font-bold text-white">
        Nenhuma aula encontrada
      </h2>

      <p class="mx-auto mt-2 max-w-sm text-sm text-gray-400">
        Você ainda não possui aulas cadastradas. Comece criando sua primeira aula coletiva.
      </p>

      <button
        class="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
        on:click={abrirCriacao}
      >
        Criar primeira aula
      </button>
    </div>

  {:else}

    <!-- RESUMO -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500">
          Total de aulas
        </p>
        <p class="mt-3 text-3xl font-extrabold text-white">
          {aulas.length}
        </p>
        <p class="mt-1 text-xs text-gray-500">
          Aulas sob seu gerenciamento
        </p>
      </div>

      <div class="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500">
          Alunos matriculados
        </p>
        <p class="mt-3 text-3xl font-extrabold text-blue-400">
          {aulas.reduce((total, aula) => total + Number(aula.quantidade_alunos || 0), 0)}
        </p>
        <p class="mt-1 text-xs text-gray-500">
          Total de matrículas nas suas aulas
        </p>
      </div>
    </div>

    <!-- TÍTULO DA LISTAGEM -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-white">Aulas cadastradas</h2>
        <p class="mt-1 text-xs text-gray-500">
          Selecione uma aula para visualizar seus alunos.
        </p>
      </div>

      <span class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-bold text-gray-300">
        {aulas.length} registros
      </span>
    </div>

    <!-- CARDS DAS AULAS -->
    <div class="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">

      {#each aulas as aula}

        <Card class="h-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl">

          <!-- CABEÇALHO -->
          <div class="border-b border-gray-700 bg-gray-950/60 p-5">

            <div class="mb-3 flex items-center justify-between">
              <span class="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Aula coletiva
              </span>

              <span class="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                <span class="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                Cadastrada
              </span>
            </div>

            <button
              class="w-full text-left"
              on:click={() => abrirAlunos(aula)}
            >
              <h3 class="text-xl font-extrabold text-white transition hover:text-blue-400">
                {aula.nome_modalidade}
              </h3>

              <p class="mt-1 text-xs text-gray-500">
                Clique para visualizar os alunos
              </p>
            </button>

          </div>

          <!-- INFORMAÇÕES -->
          <div class="flex flex-col gap-5 p-5">

            <!-- HORÁRIO -->
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/>
                  <path stroke-linecap="round" d="M12 7v5l3 2"/>
                </svg>
              </div>

              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Horário
                </p>
                <p class="mt-1 text-sm font-semibold text-gray-200">
                  {aula.horario}
                </p>
              </div>
            </div>

            <!-- PROFESSOR -->
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 21a8 8 0 0 1 16 0"/>
                </svg>
              </div>

              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Professor
                </p>
                <p class="mt-1 truncate text-sm font-semibold text-gray-200">
                  {aula.professor}
                </p>
              </div>
            </div>

            <!-- ALUNOS MATRICULADOS -->
            <button
              class="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900/70 p-4 text-left transition hover:border-blue-500/40 hover:bg-gray-900"
              on:click={() => abrirAlunos(aula)}
            >
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Alunos matriculados
                </p>
                <p class="mt-1 text-2xl font-extrabold text-white">
                  {aula.quantidade_alunos}
                </p>
              </div>

              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 0 0-5-3.87M9 20H2v-2a4 4 0 0 1 7.5-2M15 20v-2a4 4 0 0 0-8 0v2m8-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 1a3 3 0 1 1-6 0"/>
                </svg>
              </div>
            </button>

            <!-- AÇÕES -->
            <div class="flex gap-3 border-t border-gray-700 pt-4">

              <button
                class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white"
                on:click={() => abrirEdicao(aula)}
              >
                <UserEditOutline class="h-5 w-5"/>
                Editar
              </button>

              <button
                class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm font-bold text-red-300 transition hover:border-red-400 hover:bg-red-600 hover:text-white"
                on:click={() => excluirAula(aula)}
              >
                <TrashBinOutline class="h-5 w-5"/>
                Excluir
              </button>

            </div>

          </div>

        </Card>

      {/each}

    </div>

  {/if}

{:else if modo === 'alunos'}

  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-white">
        Alunos Matriculados - {aulaSelecionada?.nome_modalidade}
      </h1>
      <p class="mt-1 text-sm text-gray-400">
        Horário: {aulaSelecionada?.horario} | Professor: {aulaSelecionada?.professor}
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-700"
      on:click={voltarLista}
    >
      Voltar
    </button>
  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
      {erro}
    </div>
  {/if}

  {#if mensagem}
    <div class="mb-5 rounded-xl border border-green-500/30 bg-green-950/30 p-4 text-sm text-green-300">
      {mensagem}
    </div>
  {/if}

  {#if loading}
    <div class="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
      <div class="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      <p class="font-semibold text-gray-200">Carregando alunos...</p>
    </div>
  {:else if alunos.length === 0}
    <div class="rounded-2xl border border-dashed border-gray-700 bg-gray-800/50 px-6 py-16 text-center">
      <h2 class="text-lg font-bold text-white">Nenhum aluno matriculado</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm text-gray-400">
        Não há alunos matriculados nesta turma no momento.
      </p>
    </div>
  {:else}
    <div class="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="border-b border-gray-700 bg-gray-950/70 text-xs uppercase text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-4">Nome / Login</th>
              <th scope="col" class="px-6 py-4">E-mail</th>
              <th scope="col" class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            {#each alunos as aluno}
              <tr class="transition hover:bg-gray-750">
                <td class="px-6 py-4 font-medium text-white">{aluno.login}</td>
                <td class="px-6 py-4 text-gray-400">{aluno.email}</td>
                <td class="px-6 py-4 text-right">
                  <button
                    class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
                    on:click={() => cancelarMatricula(aluno)}
                  >
                    Cancelar Matrícula
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

{:else if modo === 'criar'}

  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-white">
        Criar Aula
      </h1>
      <p class="mt-1 text-sm text-gray-400">
        Configure uma nova aula coletiva.
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-700"
      on:click={voltarLista}
    >
      Voltar
    </button>
  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
      {erro}
    </div>
  {/if}

  <div class="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">

    <div class="border-b border-gray-700 bg-gray-950/70 px-6 py-5">
      <h2 class="text-lg font-bold text-white">
        Informações da aula
      </h2>
      <p class="mt-1 text-sm text-gray-400">
        Preencha os dados para cadastrar a aula.
      </p>
    </div>

    <form
      on:submit|preventDefault={criarAula}
      class="space-y-6 p-6"
    >

      <div>
        <label
          for="modalidade"
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Modalidade
        </label>

        <select
          id="modalidade"
          bind:value={idModalidade}
          class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
            class="mb-2 block text-sm font-semibold text-gray-200"
          >
            Professor responsável
          </label>

          <select
            id="professor"
            bind:value={idProfessor}
            class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Horário da aula
        </label>

        <input
          id="horario"
          type="time"
          bind:value={horario}
          class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div class="border-t border-gray-700 pt-5">
        <button
          type="submit"
          disabled={criando}
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if criando}
            Criando aula...
          {:else}
            Criar Aula
          {/if}
        </button>
      </div>

    </form>
  </div>

{:else if modo === 'editar'}

  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-white">
        Editar Aula
      </h1>

      <p class="mt-1 text-sm text-gray-400">
        Atualize as informações da aula coletiva.
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-700"
      on:click={voltarLista}
    >
      Voltar
    </button>
  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
      {erro}
    </div>
  {/if}

  <div class="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">

    <div class="border-b border-gray-700 bg-gray-950/70 px-6 py-5">
      <h2 class="text-lg font-bold text-white">
        Dados da aula
      </h2>

      <p class="mt-1 text-sm text-gray-400">
        Modifique os campos desejados e salve as alterações.
      </p>
    </div>

    <form
      on:submit|preventDefault={atualizarAula}
      class="space-y-6 p-6"
    >

      <div>
        <label
          for="modalidade-editar"
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Modalidade
        </label>

        <select
          id="modalidade-editar"
          bind:value={idModalidade}
          class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
            class="mb-2 block text-sm font-semibold text-gray-200"
          >
            Professor responsável
          </label>

          <select
            id="professor-editar"
            bind:value={idProfessor}
            class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Horário da aula
        </label>

        <input
          id="horario-editar"
          type="time"
          bind:value={horario}
          class="block w-full rounded-xl border border-gray-600 bg-gray-950 p-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div class="border-t border-gray-700 pt-5">
        <button
          type="submit"
          disabled={criando}
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if criando}
            Salvando alterações...
          {:else}
            Salvar alterações
          {/if}
        </button>
      </div>

    </form>
  </div>

{/if}