<script lang="ts">
  // Formulário de usuário
  import { Card, Button, Label, Input, Heading, Select } from 'flowbite-svelte'; // UI
  import { onMount } from 'svelte'; // ciclo de vida
  import api from '$lib/api'; // API backend
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation'; // navegação
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons'; // ícones
  import type { User, UserFormData } from '$lib/models/User';

  export let id: number | null = null; // id do usuário

  let user: UserFormData = { id: 0, login: '', email: '', senha: '', role: 'user' }; // dados do form
  
  // Opções de roles
  const roleOptions = [
    { value: 'user', name: 'Usuário' },
    { value: 'admin', name: 'Administrador' },
    { value: 'professor', name: 'professor' }

  ];
   
  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  // Carrega usuário se for edição
  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        const res = await api.get(`/users/${id}`);
        const body = res.data as ApiResponse<User>;
          console.log(body)
        if (body.success && body.data) {
          user = { ...body.data, senha: '' }; // não carrega senha na edição
        } else {
          error = body.message;
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<User> | undefined;
        error = body?.message || 'Erro ao carregar usuário.';
      } finally {
        loading = false;
      }
    } 
  });

  // Submissão do formulário
  async function handleSubmit() {
    fieldErrors = [];

    // Validação de senha
    if (id === null && (!user.senha || user.senha.length < 6)) {
      fieldErrors = [{ field: 'senha', message: 'Senha deve ter pelo menos 6 caracteres.' }];
      error = 'Senha deve ter pelo menos 6 caracteres.';
      return;
    }
    
    if (id !== null && user.senha && user.senha.length < 6) {
      fieldErrors = [{ field: 'senha', message: 'Senha deve ter pelo menos 6 caracteres.' }];
      error = 'Senha deve ter pelo menos 6 caracteres.';
      return;
    }

    loading = true;
    error = '';
    try {
      const userData = { ...user };
      // Remove senha vazia na edição para não sobrescrever indevidamente
      if (id !== null && !userData.senha) {
        delete userData.senha;
      }
      
      if (id === null) {
        const res = await api.post('/users', userData);
        const body = res.data as ApiResponse<User>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      } else {
        const res = await api.put(`/users/${id}`, userData);
        const body = res.data as ApiResponse<User>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }
      goto('/users');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<User> | undefined;
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


<!-- Card do formulário -->
<Card class="mb-8 mx-auto mt-8 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 p-0 shadow-2xl">

  <!-- Cabeçalho do formulário -->
  <div class="border-b border-gray-700 bg-gray-950/60 px-6 py-7 sm:px-8">

    <div class="mb-3 flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
        Gestão da academia
      </span>
    </div>

    <Heading tag="h3" class="text-2xl font-black tracking-tight text-white">
      {id === null ? 'Cadastrar usuário' : 'Editar usuário'}
      <span class="text-blue-500">.</span>
    </Heading>

    <p class="mt-2 text-sm text-gray-400">
      {id === null
        ? 'Preencha os dados para criar um novo acesso à plataforma.'
        : 'Atualize as informações e permissões deste usuário.'}
    </p>

  </div>

  <!-- Formulário principal -->
  <form class="flex flex-col gap-6 p-6 sm:p-8" on:submit|preventDefault={handleSubmit}>

    <!-- Mensagem de erro -->
    {#if error}
      <div class="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">!</span>
        <p class="text-sm font-medium leading-relaxed text-red-300">{error}</p>
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
        <p class="mt-2 text-xs font-medium text-red-400">{errorOf('login')}</p>
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
        placeholder="Digite o endereço de e-mail"
        required
        class="mt-1"
      />

      {#if errorOf('email')}
        <p class="mt-2 text-xs font-medium text-red-400">{errorOf('email')}</p>
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
        placeholder={id === null ? 'Mínimo de 6 caracteres' : 'Nova senha (opcional)'}
        required={id === null}
        minlength={6}
        class="mt-1"
      />

      {#if id !== null}
        <p class="mt-2 text-xs text-gray-500">
          Deixe em branco para manter a senha atual.
        </p>
      {/if}

      {#if errorOf('senha')}
        <p class="mt-2 text-xs font-medium text-red-400">{errorOf('senha')}</p>
      {/if}
    </div>

    <!-- Perfil -->
    <div>
      <Label for="role" class="mb-2 block text-sm font-semibold text-gray-200">
        Perfil de acesso
      </Label>

      <Select
        id="role"
        bind:value={user.role}
        items={roleOptions}
        class="mt-1"
      />

      {#if errorOf('role')}
        <p class="mt-2 text-xs font-medium text-red-400">{errorOf('role')}</p>
      {/if}
    </div>

    <!-- Separador -->
    <div class="border-t border-gray-700"></div>

    <!-- Botões -->
    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

      <Button
        color="light"
        type="button"
        onclick={handleCancel}
        disabled={loading}
        class="justify-center"
      >
        <ArrowLeftOutline class="mr-2 h-5 w-5" />
        {id === null ? 'Voltar' : 'Cancelar'}
      </Button>

      <Button
        type="submit"
        color="primary"
        disabled={loading}
        class="justify-center"
      >
        <FloppyDiskAltOutline class="mr-2 h-5 w-5" />
        {#if loading}
          Salvando...
        {:else}
          {id === null ? 'Cadastrar usuário' : 'Salvar alterações'}
        {/if}
      </Button>

    </div>

  </form>

  <!-- Rodapé -->
  <div class="border-t border-gray-700 bg-gray-950/40 px-6 py-3 sm:px-8">
    <p class="text-center text-xs text-gray-500">
      Sistema de gerenciamento da academia
    </p>
  </div>

</Card>
