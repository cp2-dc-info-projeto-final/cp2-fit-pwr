<script lang="ts">
    import { Card, Button, Badge, Heading } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';

    type Exercicio = {
        id_exercicio: number;
        nome: string;
        grupo_muscular: string;
        series: number;
        repeticoes: number;
        carga: number | null;
        descanso: number;
        observacao?: string;
    };

    type Treino = {
        id_treino: number;
        nome: string;
        dia_semana: string;
        exercicios: Exercicio[];
    };

    let treinos: Treino[] = [];

    let treinoSelecionado: Treino | null = null;

    let loading = true;
    let error = '';

    const dias = [
        'segunda',
        'terça',
        'quarta',
        'quinta',
        'sexta',
        'sábado'
    ];

    let diaSelecionado = 'segunda';

    async function carregarTreinos() {
        loading = true;
        error = '';

        try {
            const res = await api.get('/treinos');

            const body = res.data as ApiResponse<Treino[]>;

            if (body.success) {
                treinos = body.data ?? [];

                selecionarTreino();
            } else {
                error = body.message || 'Erro ao carregar treinos.';
            }

        } catch (e: any) {

            console.error('Erro ao carregar treinos:', e);

            const body = e.response?.data as ApiResponse<Treino[]> | undefined;

            error = body?.message || 'Erro ao carregar treinos.';

        } finally {
            loading = false;
        }
    }

    function selecionarTreino() {
        treinoSelecionado =
            treinos.find(
                treino =>
                    treino.dia_semana.toLowerCase() ===
                    diaSelecionado.toLowerCase()
            ) ?? null;
    }

    function selecionarDia(dia: string) {
        diaSelecionado = dia;
        selecionarTreino();
    }

    function formatarDescanso(segundos: number) {

        if (segundos < 60) {
            return `${segundos}s`;
        }

        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;

        if (segundosRestantes === 0) {
            return `${minutos} min`;
        }

        return `${minutos}min ${segundosRestantes}s`;
    }

    onMount(() => {
        carregarTreinos();
    });
</script>
<div class="min-h-screen w-full bg-gray-900 px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">

        <!-- Cabeçalho -->
        <div class="mb-8">
            <div class="flex flex-wrap items-center justify-between gap-4">

                <div>
                    <div class="mb-2 flex items-center gap-2">
                        <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span class="text-xs font-semibold uppercase tracking-widest text-blue-400">
                            Área de treinamento
                        </span>
                    </div>

                    <Heading tag="h2" class="text-3xl font-bold tracking-tight text-white md:text-4xl">
                        Meu Treino
                    </Heading>

                    <p class="mt-2 text-sm text-gray-400 md:text-base">
                        Acompanhe sua ficha e evolua a cada treino.
                    </p>
                </div>

                <div class="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3">
                    <p class="text-xs text-gray-400">
                        Sua rotina
                    </p>
                    <p class="mt-1 text-sm font-semibold text-white">
                        Plano de treinamento
                    </p>
                </div>

            </div>
        </div>


        {#if loading}

            <div class="flex flex-col items-center justify-center py-20">
                <div class="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>

                <p class="text-sm text-gray-400">
                    Carregando seus treinos...
                </p>
            </div>


        {:else if error}

            <div class="my-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                <p class="text-sm text-red-400">
                    {error}
                </p>

                <Button
                    color="light"
                    class="mt-4"
                    onclick={carregarTreinos}
                >
                    Tentar novamente
                </Button>
            </div>


        {:else}

            <!-- Navegação semanal -->
            <div class="mb-8">

                <div class="mb-3 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-white">
                        Dias da semana
                    </h3>

                    <span class="text-xs text-gray-500">
                        Selecione seu treino
                    </span>
                </div>

                <div class="p-4 flex gap-2 overflow-x-auto pb-3">
                    {#each dias as dia}
                        <Button
                            color={diaSelecionado === dia ? 'blue' : 'dark'}
                            class="min-w-[110px] shrink-0 capitalize"
                            onclick={() => selecionarDia(dia)}
                        >
                            {dia}
                        </Button>
                    {/each}
                </div>

            </div>


            {#if treinoSelecionado}

                <!-- Resumo do treino -->
                <div class="mb-8 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-lg">

                    <div class="border-b border-gray-700 p-5 sm:p-6">

                        <div class="flex flex-wrap items-center justify-between gap-4">

                            <div>
                                <div class="mb-3 flex items-center gap-2">
                                    <Badge color="blue">
                                        {treinoSelecionado.dia_semana}
                                    </Badge>

                                    <span class="text-xs text-gray-500">
                                        Ficha de treinamento
                                    </span>
                                </div>

                                <Heading tag="h3" class="text-2xl font-bold text-white">
                                    {treinoSelecionado.nome}
                                </Heading>

                                <p class="mt-2 text-sm text-gray-400">
                                    Seu planejamento de exercícios para este dia.
                                </p>
                            </div>

                            <div class="rounded-xl border border-gray-700 bg-gray-900/70 px-5 py-4 text-center">
                                <p class="text-3xl font-bold text-blue-400">
                                    {treinoSelecionado.exercicios.length}
                                </p>

                                <p class="mt-1 text-xs text-gray-400">
                                    Exercícios
                                </p>
                            </div>

                        </div>

                    </div>

                    <div class="grid grid-cols-2 divide-x divide-gray-700">

                        <div class="p-4 text-center">
                            <p class="text-xs text-gray-500">
                                Modalidade
                            </p>
                            <p class="mt-1 text-sm font-semibold text-gray-200">
                                Musculação
                            </p>
                        </div>

                        <div class="p-4 text-center">
                            <p class="text-xs text-gray-500">
                                Status
                            </p>
                            <div class="mt-1 flex items-center justify-center gap-2">
                                <span class="h-2 w-2 rounded-full bg-green-500"></span>
                                <span class="text-sm font-semibold text-gray-200">
                                    Programado
                                </span>
                            </div>
                        </div>

                    </div>

                </div>


                <!-- Título dos exercícios -->
                <div class="mb-5 flex items-center justify-between">

                    <div>
                        <Heading tag="h3" class="text-xl font-bold text-white">
                            Exercícios
                        </Heading>

                        <p class="mt-1 text-sm text-gray-400">
                            Confira os detalhes da sua execução.
                        </p>
                    </div>

                    <Badge color="gray">
                        {treinoSelecionado.exercicios.length} no total
                    </Badge>

                </div>


                <!-- Lista de exercícios -->
                <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {#each treinoSelecionado.exercicios as exercicio, index}

                        <Card class="group w-full overflow-hidden border border-gray-700 bg-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl p-5">

                            <div class="flex flex-col gap-5">

                                <!-- Identificação -->
                                <div class="flex items-start justify-between gap-3">

                                    <div class="min-w-0">

                                        <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-400">
                                            Exercício {index + 1}
                                        </span>

                                        <h4 class="text-lg font-bold text-white transition-colors group-hover:text-blue-400">
                                            {exercicio.nome}
                                        </h4>

                                        <div class="mt-2">
                                            <Badge color="gray">
                                                {exercicio.grupo_muscular}
                                            </Badge>
                                        </div>

                                    </div>

                                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-blue-400">
                                        <span class="text-sm font-bold">
                                            {index + 1}
                                        </span>
                                    </div>

                                </div>


                                <!-- Séries e repetições -->
                                <div class="grid grid-cols-2 gap-3">

                                    <div class="rounded-xl border border-gray-700 bg-gray-900/70 p-4">

                                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Séries
                                        </p>

                                        <p class="mt-2 text-2xl font-bold text-white">
                                            {exercicio.series}
                                        </p>

                                    </div>

                                    <div class="rounded-xl border border-gray-700 bg-gray-900/70 p-4">

                                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Repetições
                                        </p>

                                        <p class="mt-2 text-2xl font-bold text-white">
                                            {exercicio.repeticoes}
                                        </p>

                                    </div>

                                </div>


                                <!-- Informações adicionais -->
                                <div class="space-y-3">

                                    <div class="flex items-center justify-between border-b border-gray-700 pb-3">

                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-500">⚖</span>
                                            <span class="text-sm text-gray-400">
                                                Carga
                                            </span>
                                        </div>

                                        <span class="text-sm font-semibold text-gray-200">
                                            {#if exercicio.carga !== null}
                                                {exercicio.carga} kg
                                            {:else}
                                                Livre
                                            {/if}
                                        </span>

                                    </div>


                                    <div class="flex items-center justify-between border-b border-gray-700 pb-3">

                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-500">◷</span>
                                            <span class="text-sm text-gray-400">
                                                Descanso
                                            </span>
                                        </div>

                                        <span class="text-sm font-semibold text-gray-200">
                                            {formatarDescanso(exercicio.descanso)}
                                        </span>

                                    </div>

                                </div>


                                <!-- Observação -->
                                {#if exercicio.observacao}

                                    <div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">

                                        <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                                            Observação
                                        </p>

                                        <p class="text-sm leading-relaxed text-gray-300">
                                            {exercicio.observacao}
                                        </p>

                                    </div>

                                {/if}

                            </div>

                        </Card>

                    {/each}

                </div>


            {:else}

                <!-- Estado vazio -->
                <div class="rounded-2xl border border-dashed border-gray-700 bg-gray-800/50 px-6 py-16 text-center">

                    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-700 bg-gray-800">
                        <span class="text-2xl text-gray-500">🏋️</span>
                    </div>

                    <h3 class="text-lg font-semibold text-white">
                        Nenhum treino encontrado
                    </h3>

                    <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
                        Não existe nenhum treino cadastrado para este dia. Selecione outro dia da semana.
                    </p>

                </div>

            {/if}

        {/if}

    </div>
</div>