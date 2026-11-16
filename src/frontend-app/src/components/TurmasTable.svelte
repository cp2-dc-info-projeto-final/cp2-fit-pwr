<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from 'flowbite-svelte';
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

  interface Turma {
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

  let turmas: Turma[] = [];
  let turmaSelecionada: Turma | null = null;
  let alunos: Aluno[] = [];
  let turmaEditando: Turma | null = null;

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
      const [usuarioResponse, turmasResponse] = await Promise.all([
        api.get<ApiResponse<UsuarioLogado>>('/users/me'),
        api.get<ApiResponse<Turma[]>>('/turmas')
      ]);

      if (
        usuarioResponse.data.success &&
        usuarioResponse.data.data
      ) {
        usuarioLogado = usuarioResponse.data.data;
      }

      if (
        turmasResponse.data.success &&
        turmasResponse.data.data
      ) {
        turmas = turmasResponse.data.data;
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao carregar suas turmas.';
    } finally {
      loading = false;
    }
  }

  async function carregarDadosCriacao() {
    try {
      const [modalidadesResponse, professoresResponse] =
        await Promise.all([
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

    idModalidade = '';
    idProfessor = '';
    horario = '';

    modo = 'criar';

    await carregarDadosCriacao();
  }

  function voltarLista() {
    modo = 'lista';
    turmaSelecionada = null;
    turmaEditando = null;
    alunos = [];
    erro = '';
    mensagem = '';
  }

  async function abrirAlunos(turma: Turma) {
    loading = true;
    erro = '';
    mensagem = '';
    turmaSelecionada = turma;

    try {
      const response = await api.get<ApiResponse<Aluno[]>>(
        `/turmas/${turma.id_turma}/alunos`
      );

      if (
        response.data.success &&
        response.data.data
      ) {
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
    if (!turmaSelecionada) return;

    const confirmar = confirm(
      `Deseja cancelar a matrícula de ${aluno.login}?`
    );

    if (!confirmar) return;

    try {
      erro = '';
      mensagem = '';

      await api.delete(
        `/turmas/${turmaSelecionada.id_turma}/alunos/${aluno.id}`
      );

      alunos = alunos.filter(
        (item) => item.id !== aluno.id
      );

      turmas = turmas.map((turma) =>
        turma.id_turma === turmaSelecionada?.id_turma
          ? {
              ...turma,
              quantidade_alunos: Math.max(
                0,
                turma.quantidade_alunos - 1
              )
            }
          : turma
      );

      if (turmaSelecionada) {
        turmaSelecionada = {
          ...turmaSelecionada,
          quantidade_alunos: Math.max(
            0,
            turmaSelecionada.quantidade_alunos - 1
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

  async function criarTurma() {
    erro = '';
    mensagem = '';

    if (!idModalidade || !horario) {
      erro = 'Preencha todos os campos.';
      return;
    }

    if (
      usuarioLogado?.role !== 'professor' &&
      !idProfessor
    ) {
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

        mensagem = 'Turma criada com sucesso.';

        await carregarPagina();

        modo = 'lista';
      }
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao criar a turma.';
    } finally {
      criando = false;
    }
  }

  async function abrirEdicao(turma: Turma) {
    erro = '';
    mensagem = '';

    turmaEditando = turma;

    if (
      modalidades.length === 0 ||
      professores.length === 0
    ) {
      await carregarDadosCriacao();
    }

    idModalidade = String(
      modalidades.find(
        (modalidade) =>
          modalidade.nome === turma.nome_modalidade
      )?.id_modalidade ?? ''
    );

    idProfessor = String(
      professores.find(
        (professor) =>
          professor.login === turma.professor
      )?.id ?? ''
    );

    horario = turma.horario;

    modo = 'editar';
  }

  async function excluirTurma(turma: Turma) {
    const confirmar = confirm(
      `Deseja realmente excluir a turma de ${turma.nome_modalidade} às ${turma.horario}?`
    );

    if (!confirmar) return;

    try {
      erro = '';
      mensagem = '';

      await api.delete(`/turmas/${turma.id_turma}`);

      turmas = turmas.filter(
        (item) => item.id_turma !== turma.id_turma
      );

      mensagem = 'Turma excluída com sucesso.';
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao excluir a turma.';
    }
  }

  async function atualizarTurma() {
    if (!turmaEditando) return;

    erro = '';
    mensagem = '';

    if (!idModalidade || !horario) {
      erro = 'Preencha todos os campos.';
      return;
    }

    if (
      usuarioLogado?.role !== 'professor' &&
      !idProfessor
    ) {
      erro = 'Selecione um professor.';
      return;
    }

    criando = true;

    try {
      const professorId =
        usuarioLogado?.role === 'professor'
          ? usuarioLogado.id
          : Number(idProfessor);

      await api.put(
        `/turmas/${turmaEditando.id_turma}`,
        {
          id_modalidade: Number(idModalidade),
          id_professor: professorId,
          horario
        }
      );

      mensagem = 'Turma atualizada com sucesso.';

      await carregarPagina();

      turmaEditando = null;
      modo = 'lista';

      idModalidade = '';
      idProfessor = '';
      horario = '';
    } catch (error: any) {
      erro =
        error?.response?.data?.message ||
        'Erro ao atualizar a turma.';
    } finally {
      criando = false;
    }
  }
</script>

{#if modo === 'lista'}

  <div class="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg sm:flex-row sm:items-center sm:p-8">
    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
        <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Área administrativa
        </span>
      </div>

      <h1 class="text-3xl font-bold tracking-tight text-white">
        Turmas
      </h1>

      <p class="mt-2 text-sm text-gray-400">
        Gerencie suas modalidades, professores e alunos.
      </p>
    </div>

    <button
      class="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/20"
      on:click={abrirCriacao}
    >
      + Criar turma
    </button>
  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
      {erro}
    </div>
  {/if}

  {#if mensagem}
    <div class="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-medium text-green-400">
      {mensagem}
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800 py-16">
      <div class="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      <p class="text-sm text-gray-400">Carregando turmas...</p>
    </div>

  {:else if turmas.length === 0}
    <Card class="border border-gray-700 bg-gray-800 shadow-lg">
      <div class="p-10 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-700 bg-gray-900">
          <span class="text-3xl">🏋️</span>
        </div>

        <h2 class="text-xl font-bold text-white">
          Nenhuma turma encontrada
        </h2>

        <p class="mt-2 text-sm text-gray-400">
          Você ainda não possui turmas cadastradas.
        </p>
      </div>
    </Card>

  {:else}

    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-white">
          Suas turmas
        </h2>
        <p class="mt-1 text-sm text-gray-400">
          Selecione uma turma para visualizar os alunos.
        </p>
      </div>

      <span class="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400">
        {turmas.length} cadastradas
      </span>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

      {#each turmas as turma}

        <Card class="h-full overflow-hidden border border-gray-700 bg-gray-800 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl">

          <div class="p-5">

            <button
              class="w-full text-left"
              on:click={() => abrirAlunos(turma)}
            >

              <div class="mb-4 flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
                  Modalidade
                </span>

                <div class="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-xl">
                  🏋️
                </div>
              </div>

              <h2 class="text-xl font-bold text-white transition-colors group-hover:text-blue-400">
                {turma.nome_modalidade}
              </h2>

              <div class="mt-5 space-y-4">

                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-lg">
                    🕒
                  </div>

                  <div>
                    <p class="text-xs text-gray-500">Horário</p>
                    <p class="mt-1 text-sm font-semibold text-gray-200">
                      {turma.horario}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-lg">
                    👨‍🏫
                  </div>

                  <div>
                    <p class="text-xs text-gray-500">Professor</p>
                    <p class="mt-1 text-sm font-semibold text-gray-200">
                      {turma.professor}
                    </p>
                  </div>
                </div>

              </div>

              <div class="mt-5 flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <div>
                  <p class="text-xs font-medium text-gray-400">
                    Alunos matriculados
                  </p>

                  <p class="mt-1 text-2xl font-bold text-blue-400">
                    {turma.quantidade_alunos}
                  </p>
                </div>

                <div class="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-gray-900 text-xl">
                  👥
                </div>

              </div>

              <p class="mt-4 text-center text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300">
                Visualizar alunos →
              </p>

            </button>

            <div class="mt-5 flex gap-3 border-t border-gray-700 pt-4">

              <button
                class="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition-all hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                on:click={() => abrirEdicao(turma)}
              >
                Editar
              </button>

              <button
                class="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:border-red-500 hover:bg-red-600 hover:text-white"
                on:click={() => excluirTurma(turma)}
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

  <div class="mb-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg sm:flex-row sm:items-center">

    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
        <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Gestão de alunos
        </span>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-white">
        {turmaSelecionada?.nome_modalidade}
      </h1>

      <p class="mt-2 text-sm text-gray-400">
        Horário: <span class="font-semibold text-gray-200">{turmaSelecionada?.horario}</span>
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
      on:click={voltarLista}
    >
      ← Voltar
    </button>

  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
      {erro}
    </div>
  {/if}

  {#if mensagem}
    <div class="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-medium text-green-400">
      {mensagem}
    </div>
  {/if}

  {#if loading}

    <div class="rounded-2xl border border-gray-700 bg-gray-800 p-10 text-center text-sm text-gray-400">
      Carregando...
    </div>

  {:else if alunos.length === 0}

    <Card class="border border-gray-700 bg-gray-800 shadow-lg">
      <div class="p-10 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-700 bg-gray-900">
          <span class="text-2xl">👥</span>
        </div>

        <h2 class="text-lg font-bold text-white">
          Nenhum aluno matriculado
        </h2>
      </div>
    </Card>

  {:else}

    <div class="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-lg">

      <table class="w-full text-left text-sm text-gray-400">

        <thead class="border-b border-gray-700 bg-gray-900/70 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            <th class="px-6 py-4 font-semibold">Aluno</th>
            <th class="px-6 py-4 font-semibold">E-mail</th>
            <th class="px-6 py-4 text-right font-semibold">Ação</th>
          </tr>
        </thead>

        <tbody>

          {#each alunos as aluno}

            <tr class="border-b border-gray-700/70 transition-colors hover:bg-gray-700/30">

              <td class="px-6 py-5 font-semibold text-gray-100">
                {aluno.login}
              </td>

              <td class="px-6 py-5 text-gray-400">
                {aluno.email}
              </td>

              <td class="px-6 py-5 text-right">

                <button
                  class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:border-red-500 hover:bg-red-600 hover:text-white"
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

  <div class="mb-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg sm:flex-row sm:items-center">

    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
        <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Área administrativa
        </span>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-white">
        Criar Turma
      </h1>

      <p class="mt-2 text-sm text-gray-400">
        Cadastre uma nova turma na academia.
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
      on:click={voltarLista}
    >
      ← Voltar
    </button>

  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
      {erro}
    </div>
  {/if}

  <Card class="overflow-hidden border border-gray-700 bg-gray-800 shadow-lg">

    <form
      on:submit|preventDefault={criarTurma}
      class="space-y-6 p-6 sm:p-8"
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
          class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

      {#if usuarioLogado?.role !== 'professor'}

        <div>

          <label
            for="professor"
            class="mb-2 block text-sm font-semibold text-gray-200"
          >
            Professor
          </label>

          <select
            id="professor"
            bind:value={idProfessor}
            class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

      {/if}

      <div>

        <label
          for="horario"
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Horário
        </label>

        <input
          id="horario"
          type="time"
          bind:value={horario}
          class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

      </div>

      <div class="border-t border-gray-700 pt-5">

        <button
          type="submit"
          disabled={criando}
          class="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {criando ? 'Criando...' : 'Criar Turma'}
        </button>

      </div>

    </form>

  </Card>

{:else if modo === 'editar'}

  <div class="mb-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg sm:flex-row sm:items-center">

    <div>
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-blue-500"></span>
        <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Área administrativa
        </span>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-white">
        Editar Turma
      </h1>

      <p class="mt-2 text-sm text-gray-400">
        Atualize as informações da turma.
      </p>
    </div>

    <button
      class="rounded-xl border border-gray-600 bg-gray-900 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
      on:click={voltarLista}
    >
      ← Voltar
    </button>

  </div>

  {#if erro}
    <div class="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
      {erro}
    </div>
  {/if}

  <Card class="overflow-hidden border border-gray-700 bg-gray-800 shadow-lg">

    <form
      on:submit|preventDefault={atualizarTurma}
      class="space-y-6 p-6 sm:p-8"
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
          class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

      {#if usuarioLogado?.role !== 'professor'}

        <div>

          <label
            for="professor-editar"
            class="mb-2 block text-sm font-semibold text-gray-200"
          >
            Professor
          </label>

          <select
            id="professor-editar"
            bind:value={idProfessor}
            class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

      {/if}

      <div>

        <label
          for="horario-editar"
          class="mb-2 block text-sm font-semibold text-gray-200"
        >
          Horário
        </label>

        <input
          id="horario-editar"
          type="time"
          bind:value={horario}
          class="block w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

      </div>

      <div class="border-t border-gray-700 pt-5">

        <button
          type="submit"
          disabled={criando}
          class="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {criando ? 'Salvando...' : 'Salvar alterações'}
        </button>

      </div>

    </form>

  </Card>

{/if}