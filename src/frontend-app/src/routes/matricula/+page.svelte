
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';

  let cadastroToken = '';
  let titular = '';

  // Dados fictícios para a demonstração.
  let numeroCartao = '0000 0000 0000 0000';
  let validade = '12/30';
  let cvv = '123';

  let loading = false;
  let error = '';
  let sucesso = false;

  onMount(() => {
    cadastroToken = sessionStorage.getItem('cadastro_token') || '';

    if (!cadastroToken) {
      goto('/cadastro');
    }
  });

  async function finalizarMatricula() {
    error = '';

    if (!titular.trim()) {
      error = 'Informe o nome do titular.';
      return;
    }

    if (
      !numeroCartao.trim() ||
      !validade.trim() ||
      !cvv.trim()
    ) {
      error = 'Preencha os dados demonstrativos do cartão.';
      return;
    }

    loading = true;

    try {
      const response = await api.post(
        '/matricula/confirmar',
        {
          titular,
          metodo: 'cartao_simulado'
        },
        {
          headers: {
            Authorization: `Bearer ${cadastroToken}`
          }
        }
      );

      const body = response.data as ApiResponse<unknown>;

      if (!body.success) {
        error = body.message;
        return;
      }

      sessionStorage.removeItem('cadastro_token');
      sucesso = true;

    } catch (e: any) {
      error =
        e.response?.data?.message ||
        'Não foi possível concluir a matrícula.';

    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Plano CP2FIT - Matrícula</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 px-4 py-12 text-gray-100">

  <div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">

    <!-- Informações do plano -->
    <section class="rounded-2xl border border-gray-700 bg-gray-800 p-7 shadow-xl">

      <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
        CP2FIT
      </p>

      <h1 class="mb-2 text-3xl font-bold">
        Plano único
      </h1>

      <p class="mb-6 text-gray-300">
        Tudo o que você precisa para treinar na academia.
      </p>

      <div class="mb-6">
        <span class="text-4xl font-extrabold">
          R$ 80,00
        </span>

        <span class="text-gray-400">
          / mês
        </span>
      </div>

      <ul class="space-y-4 text-gray-200">
        <li>✓ Acesso ilimitado à academia</li>
        <li>✓ Aulas coletivas</li>
        <li>✓ Área cardio</li>
        <li>✓ Acesso durante todo o horário de funcionamento</li>
        <li>✓ Acompanhamento de personal trainer</li>
      </ul>

      <div class="mt-8 rounded-lg bg-gray-700/70 p-4 text-sm text-gray-300">
        Ao finalizar, sua matrícula será ativada e você poderá entrar no sistema com seu login e senha.
      </div>

    </section>

    <!-- Pagamento -->
    <section class="rounded-2xl border border-gray-700 bg-gray-800 p-7 shadow-xl">

      {#if sucesso}

        <div class="flex h-full flex-col justify-center text-center">

          <div class="mb-4 text-5xl">
            ✓
          </div>

          <h2 class="mb-3 text-2xl font-bold text-green-400">
            Matrícula concluída!
          </h2>

          <p class="mb-8 text-gray-300">
            O pagamento simulado foi aprovado. Sua matrícula está ativa.
          </p>

          <button
            class="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
            onclick={() => goto('/login')}
          >
            Ir para o login
          </button>

        </div>

      {:else}

        <h2 class="mb-2 text-2xl font-bold">
          Finalizar matrícula
        </h2>

        <p class="mb-6 text-sm text-gray-400">
          Pagamento demonstrativo — nenhuma cobrança será realizada.
        </p>

        <form
          class="space-y-4"
          onsubmit={(event) => {
            event.preventDefault();
            finalizarMatricula();
          }}
        >

          <div>
            <label
              class="mb-1 block text-sm font-medium"
              for="titular"
            >
              Nome do titular
            </label>

            <input
              id="titular"
              bind:value={titular}
              required
              class="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
              placeholder="Nome para a simulação"
            />
          </div>

          <div>
            <label
              class="mb-1 block text-sm font-medium"
              for="numeroCartao"
            >
              Número demonstrativo
            </label>

            <input
              id="numeroCartao"
              bind:value={numeroCartao}
              required
              class="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">

            <div>
              <label
                class="mb-1 block text-sm font-medium"
                for="validade"
              >
                Validade fictícia
              </label>

              <input
                id="validade"
                bind:value={validade}
                required
                class="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label
                class="mb-1 block text-sm font-medium"
                for="cvv"
              >
                Código fictício
              </label>

              <input
                id="cvv"
                bind:value={cvv}
                required
                maxlength="4"
                class="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white"
              />
            </div>

          </div>

          <p class="rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-xs text-yellow-200">
            Use somente os dados fictícios exibidos. Não informe dados de um cartão verdadeiro. Esses campos não são enviados nem armazenados.
          </p>

          {#if error}
            <p class="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
              {error}
            </p>
          {/if}

          <button
            type="submit"
            disabled={loading || !cadastroToken}
            class="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Processando...'
              : 'Finalizar matrícula — R$ 80,00'}
          </button>

        </form>

      {/if}

    </section>

  </div>

</div>
