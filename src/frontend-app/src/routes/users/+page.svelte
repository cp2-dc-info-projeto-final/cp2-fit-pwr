<script lang="ts">
  import { Heading } from 'flowbite-svelte';
  import UsersTable from '../../components/UsersTable.svelte';
  import { UserAddOutline  } from 'flowbite-svelte-icons';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCurrentUser } from '$lib/auth';

  let checkingAccess = true;
  let canView = false;

  /**
   * se não existir usuário redireciona para a página de login
   * se não for admin redireciona para a página inicial
   */
  onMount(async () => {
    const user = await getCurrentUser();
    if (!user) {
      await goto('/login');
      return;
    } else if (user.role !== 'admin') {
      await goto('/');
      return;
    }

    canView = true;
    checkingAccess = false;
  });
</script>

{#if checkingAccess}

  <div class="flex min-h-[300px] items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <div class="h-9 w-9 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      <p class="text-sm font-medium text-gray-400">Verificando acesso...</p>
    </div>
  </div>

{:else if canView}

  <div class="min-h-screen bg-gray-900 px-4 py-8 text-gray-100 sm:px-6 lg:px-8">

    <div class="mx-auto max-w-6xl">

      <!-- Cabeçalho da página -->
      <div class="mb-7 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">

        <div class="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">

          <div>
            <div class="mb-3 flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
              <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Gestão da academia
              </span>
            </div>

            <Heading tag="h2" class="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Usuários<span class="text-blue-500">.</span>
            </Heading>

            <p class="mt-2 text-sm text-gray-400">
              Gerencie os usuários, permissões e acessos da plataforma.
            </p>
          </div>

          <!-- Botão adicionar -->
          <button
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/20"
            on:click={() => goto('/users/new')}
          >
            <UserAddOutline class="h-5 w-5" />
            Adicionar usuário
          </button>

        </div>

        <div class="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400/50 to-transparent"></div>

      </div>

      <!-- Conteúdo da tabela -->
      <div class="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-xl sm:p-6">

        <UsersTable />

      </div>

    </div>

  </div>

{/if}
