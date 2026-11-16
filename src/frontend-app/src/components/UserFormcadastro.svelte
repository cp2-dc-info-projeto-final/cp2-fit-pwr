<script lang="ts">
  import {
    Card,
    Button,
    Label,
    Input,
    Heading
  } from 'flowbite-svelte';

  import api from '$lib/api';

  import type {
    ApiFieldError,
    ApiResponse
  } from '$lib/api';

  import { goto } from '$app/navigation';

  import {
    ArrowLeftOutline,
    FloppyDiskAltOutline
  } from 'flowbite-svelte-icons';

  import type {
    User,
    UserFormData
  } from '$lib/models/User';

  export let id: number | null = null;

  let user: UserFormData = {
    id: 0,
    login: '',
    email: '',
    senha: '',
    role: 'user'
  };

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
    return fieldErrors.find(
      (item) => item.field === field
    )?.message ?? null;
  }

  async function handleSubmit() {
    fieldErrors = [];

    // Validação da senha no cadastro.
    if (id === null && (!user.senha || user.senha.length < 6)) {
      fieldErrors = [{
        field: 'senha',
        message: 'Senha deve ter pelo menos 6 caracteres.'
      }];

      error = 'Senha deve ter pelo menos 6 caracteres.';
      return;
    }

    // Validação da senha na edição.
    if (id !== null && user.senha && user.senha.length < 6) {
      fieldErrors = [{
        field: 'senha',
        message: 'Senha deve ter pelo menos 6 caracteres.'
      }];

      error = 'Senha deve ter pelo menos 6 caracteres.';
      return;
    }

    loading = true;
    error = '';

    try {
      const userData = { ...user };

      // Não envia senha vazia na edição.
      if (id !== null && !userData.senha) {
        delete userData.senha;
      }

      if (id === null) {
        // Cadastro público do aluno.
        const res = await api.post(
          '/users/register',
          userData
        );

        const body = res.data as ApiResponse<{
          user: User;
          tokenCadastro: string;
        }>;

        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }

        if (!body.data?.tokenCadastro) {
          error = 'Cadastro realizado, mas não foi possível iniciar a matrícula.';
          return;
        }

        // Guarda o token provisório para concluir a matrícula.
        sessionStorage.setItem(
          'cadastro_token',
          body.data.tokenCadastro
        );

        // Encaminha o aluno para a página da matrícula.
        await goto('/matricula');

        return;

      } else {
        // Edição de usuário existente.
        const res = await api.put(
          `/users/${id}`,
          userData
        );

        const body = res.data as ApiResponse<User>;

        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }

      goto('/users/');

    } catch (e: any) {
      const body = e.response?.data as
        | ApiResponse<User>
        | undefined;

      error = body?.message || 'Erro ao salvar usuário.';
      fieldErrors = body?.errors || [];

    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/users');
  }
</script>

<Card class="mx-auto mb-8 mt-8 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-2xl">

  <!-- Cabeçalho -->
  <div class="border-b border-gray-700 bg-gray-950/60 px-6 py-7 sm:px-8">

    <div class="mb-3 flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
        Gestão da academia
      </span>
    </div>

    <Heading tag="h3" class="text-2xl font-black tracking-tight text-white">
      {id === null ? 'Cadastrar Usuário' : 'Editar Usuário'}
      <span class="text-blue-500">.</span>
    </Heading>

    <p class="mt-2 text-sm text-gray-400">
      {id === null
        ? 'Preencha os dados para cadastrar um novo usuário.'
        : 'Atualize os dados de acesso do usuário.'}
    </p>

  </div>

  <form class="flex flex-col gap-6 p-6 sm:p-8" on:submit|preventDefault={handleSubmit}>

    <!-- Erro geral -->
    {#if error}
      <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
        {error}
      </div>
    {/if}

    <!-- Login -->
    <div>
      <Label for="login" class="mb-2 block text-sm font-semibold text-gray-200">
        Login
      </Label>

      <Input
        id="login"
        bind:value={user.login}
        placeholder="Digite o login"
        required
        class="mt-1"
      />

      {#if errorOf('login')}
        <p class="mt-2 text-xs font-medium text-red-400">
          {errorOf('login')}
        </p>
      {/if}
    </div>

    <!-- Email -->
    <div>
      <Label for="email" class="mb-2 block text-sm font-semibold text-gray-200">
        E-mail
      </Label>

      <Input
        id="email"
        type="email"
        bind:value={user.email}
        placeholder="Digite o e-mail"
        required
        class="mt-1"
      />

      {#if errorOf('email')}
        <p class="mt-2 text-xs font-medium text-red-400">
          {errorOf('email')}
        </p>
      {/if}
    </div>

    <!-- Senha -->
    <div>
      <Label for="senha" class="mb-2 block text-sm font-semibold text-gray-200">
        Senha
      </Label>

      <Input
        id="senha"
        type="password"
        bind:value={user.senha}
        placeholder={id === null
          ? 'Digite a senha (mínimo 6 caracteres)'
          : 'Nova senha (opcional)'}
        required={id === null}
        minlength={6}
        class="mt-1"
      />

      {#if id !== null}
        <p class="mt-2 text-xs text-gray-500">
          Deixe vazio para manter a senha atual.
        </p>
      {/if}

      {#if errorOf('senha')}
        <p class="mt-2 text-xs font-medium text-red-400">
          {errorOf('senha')}
        </p>
      {/if}
    </div>

    <!-- Separador -->
    <div class="border-t border-gray-700"></div>

    <!-- Botões -->
    <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

      <Button
        color="light"
        type="button"
        onclick={handleCancel}
        disabled={loading}
      >
        <ArrowLeftOutline class="mr-2 inline h-5 w-5 align-text-bottom" />
        {id === null ? 'Voltar' : 'Cancelar'}
      </Button>

      <Button
        type="submit"
        color="primary"
        disabled={loading}
      >
        <FloppyDiskAltOutline class="mr-2 inline h-5 w-5 align-text-bottom" />
        {#if loading}
          Salvando...
        {:else}
          {id === null ? 'Cadastrar' : 'Salvar alterações'}
        {/if}
      </Button>

    </div>

  </form>

  <!-- Rodapé -->
  <div class="border-t border-gray-700 bg-gray-950/40 px-6 py-3">
    <p class="text-center text-xs text-gray-500">
      Sistema de gerenciamento da academia
    </p>
  </div>

</Card>
