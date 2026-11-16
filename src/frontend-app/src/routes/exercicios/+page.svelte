<script lang="ts">
  import { Heading } from 'flowbite-svelte';
  import ExerciciosTabela from '../../components/ExerciciosTabela.svelte';
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

  <div class="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
    <div class="mb-5 h-11 w-11 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
    <p class="text-sm font-semibold text-gray-200">Verificando acesso</p>
    <p class="mt-2 text-xs text-gray-500">Validando suas permissões...</p>
  </div>

{:else if canView}

  <div class="min-h-screen bg-gray-900 px-4 py-8 text-gray-100 sm:px-6 lg:px-8">

    <div class="mx-auto max-w-6xl">

      <!-- CABEÇALHO -->
      <div class="mb-8">

        <div class="flex flex-wrap items-center justify-between gap-4">

          <div>
            <div class="mb-2 flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-blue-500"></div>

              <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
                Administração
              </span>
            </div>

            <Heading tag="h2" class="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Exercícios
            </Heading>

            <p class="mt-2 text-sm text-gray-400 md:text-base">
              Gerencie o catálogo de exercícios da academia.
            </p>
          </div>

          <!-- BOTÃO ADICIONAR -->
          <button
            class="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-500 hover:shadow-blue-900/40"
            on:click={() => goto('/exercicios/new')}
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/>
            </svg>

            Adicionar exercício
          </button>

        </div>

      </div>

      <!-- CONTEÚDO -->
      <div class="space-y-6">
        <ExerciciosTabela />
      </div>

    </div>

  </div>

{/if}

