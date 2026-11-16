
<script lang="ts">
  import { Card, Button, Input, Label, Alert } from 'flowbite-svelte';
  import { goto } from '$app/navigation';
  import { login as authLogin } from '$lib/auth';

  let login = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleCadastro() {
    await goto('/cadastro');
  }

  async function handleLogin() {
    if (!login.trim() || !password) {
      error = 'Por favor, preencha todos os campos';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await authLogin({
        login: login.trim(),
        password
      });

      if (result.success) {
        await goto('/');
      } else {
        error = result.message || 'Credenciais inválidas';
      }

    } catch (err) {
      console.error('Erro no login:', err);
      error = 'Erro interno do servidor';

    } finally {
      loading = false;
    }
  }
</script>


<svelte:head>
  <title>Login - CP2FIT</title>
</svelte:head>

<div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-950 px-4 py-6 text-gray-100">

  <!-- Elementos decorativos -->
  <div class="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"></div>
  <div class="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>

  <!-- Conteúdo centralizado -->
  <div class="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">

    <!-- Marca -->
    <div class="mb-8 text-center">

      <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-xl shadow-blue-950/40">
        <svg class="h-11 w-11 text-blue-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.5 6.5v11m11-11v11M3 9v6m18-6v6M6.5 12h11"/>
        </svg>
      </div>

      <h1 class="text-4xl font-black tracking-tight text-white">
        CP2<span class="text-blue-500">FIT</span>
      </h1>

      <div class="mx-auto mt-3 h-1 w-12 rounded-full bg-blue-500"></div>

      <p class="mt-4 text-sm text-gray-400">
        Sua evolução começa aqui.
      </p>

    </div>

    <!-- Card de login -->
    <Card class="w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-2xl">

      <!-- Cabeçalho do formulário -->
      <div class="border-b border-gray-700 bg-gray-950/50 px-6 py-6 sm:px-8">

        <div class="mb-2 flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-blue-500"></span>
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Área do usuário
          </span>
        </div>

        <h2 class="text-2xl font-bold text-white">
          Bem-vindo de volta!
        </h2>

        <p class="mt-2 text-sm text-gray-400">
          Entre com suas credenciais para acessar sua conta.
        </p>

      </div>

      <!-- Formulário -->
      <form
        onsubmit={(event) => {
          event.preventDefault();
          handleLogin();
        }}
        class="space-y-6 p-6 sm:p-8"
      >

        <!-- Login -->
        <div>
          <Label for="login" class="mb-2 block text-sm font-semibold text-gray-200">
            Login
          </Label>

          <Input
            id="login"
            type="text"
            bind:value={login}
            placeholder="Digite seu login"
            required
          />
        </div>

        <!-- Senha -->
        <div>
          <Label for="password" class="mb-2 block text-sm font-semibold text-gray-200">
            Senha
          </Label>

          <Input
            id="password"
            type="password"
            bind:value={password}
            placeholder="Digite sua senha"
            required
          />
        </div>

        <!-- Erro -->
        {#if error}
          <Alert color="red" class="rounded-xl">
            {error}
          </Alert>
        {/if}

        <!-- Entrar -->
        <Button
          type="submit"
          class="w-full justify-center rounded-xl py-3 font-bold shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5"
          disabled={loading}
        >
          {#if loading}
            Entrando...
          {:else}
            Entrar na plataforma
          {/if}
        </Button>

        <!-- Divisor -->
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-700"></div>
          <span class="text-xs font-medium uppercase tracking-wider text-gray-500">
            Novo por aqui?
          </span>
          <div class="h-px flex-1 bg-gray-700"></div>
        </div>

        <!-- Cadastro -->
        <Button
          type="button"
          color="light"
          class="w-full justify-center rounded-xl border border-gray-600 bg-gray-900 py-3 font-semibold text-gray-200 transition-all hover:border-blue-500 hover:bg-gray-700"
          onclick={handleCadastro}
        >
          Criar minha conta
        </Button>

      </form>

    </Card>

    <!-- Rodapé -->
    <div class="mt-8 text-center">
      <p class="text-xs font-medium tracking-wider text-gray-500">
        CP2FIT · SISTEMA DE GESTÃO FITNESS
      </p>

      <p class="mt-2 text-xs text-gray-600">
        Sua disciplina constrói seus resultados.
      </p>
    </div>

  </div>

</div>
