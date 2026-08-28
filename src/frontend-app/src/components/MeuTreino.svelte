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


<div class="max-w-6xl mx-auto px-4 py-8">

    <div class="mb-8">

        <Heading tag="h2" class="text-2xl font-bold text-gray-800">
            Meu Treino
        </Heading>

        <p class="mt-2 text-gray-500">
            Acompanhe sua ficha de treino
        </p>

    </div>


    {#if loading}

        <div class="flex justify-center py-12">

            <div class="text-gray-500">
                Carregando treino...
            </div>

        </div>


    {:else if error}

        <div class="my-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center">

            <p class="text-red-600">
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

        <!-- Dias da semana -->

        <div class="mb-8 flex gap-2 overflow-x-auto pb-2">

            {#each dias as dia}

                <Button
                    color={diaSelecionado === dia ? 'primary' : 'light'}
                    class="min-w-[100px] capitalize"
                    onclick={() => selecionarDia(dia)}
                >
                    {dia}
                </Button>

            {/each}

        </div>


        {#if treinoSelecionado}

            <!-- Cabeçalho do treino -->

            <div class="mb-6">

                <div class="flex flex-wrap items-center gap-3">

                    <Heading tag="h3" class="text-xl font-bold text-gray-800">
                        {treinoSelecionado.nome}
                    </Heading>

                    <Badge color="blue">
                        {treinoSelecionado.dia_semana}
                    </Badge>

                </div>

            </div>


            <!-- Exercícios -->

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                {#each treinoSelecionado.exercicios as exercicio}

                    <Card
                        class="w-full overflow-hidden border border-gray-200 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >

                        <div class="flex flex-col gap-5">

                            <!-- Nome -->

                            <div>

                                <h4 class="text-xl font-bold text-gray-800">
                                    {exercicio.nome}
                                </h4>

                                <Badge color="gray" class="mt-2">
                                    {exercicio.grupo_muscular}
                                </Badge>

                            </div>


                            <!-- Séries e repetições -->

                            <div class="grid grid-cols-2 gap-3">

                                <div class="rounded-lg bg-gray-100 p-3 text-center">

                                    <p class="text-xs text-gray-400">
                                        Séries
                                    </p>

                                    <p class="text-lg font-bold text-gray-700">
                                        {exercicio.series}
                                    </p>

                                </div>


                                <div class="rounded-lg bg-gray-100 p-3 text-center">

                                    <p class="text-xs text-gray-400">
                                        Repetições
                                    </p>

                                    <p class="text-lg font-bold text-gray-700">
                                        {exercicio.repeticoes}
                                    </p>

                                </div>

                            </div>


                            <!-- Carga -->

                            <div class="flex items-center justify-between border-b border-gray-100 pb-3">

                                <span class="text-sm text-gray-500">
                                    Carga
                                </span>

                                <span class="font-semibold text-gray-700">

                                    {#if exercicio.carga !== null}

                                        {exercicio.carga} kg

                                    {:else}

                                        Livre

                                    {/if}

                                </span>

                            </div>


                            <!-- Descanso -->

                            <div class="flex items-center justify-between border-b border-gray-100 pb-3">

                                <span class="text-sm text-gray-500">
                                    Descanso
                                </span>

                                <span class="font-semibold text-gray-700">
                                    {formatarDescanso(exercicio.descanso)}
                                </span>

                            </div>


                            <!-- Observação -->

                            {#if exercicio.observacao}

                                <div>

                                    <p class="text-xs text-gray-400">
                                        Observação
                                    </p>

                                    <p class="mt-1 text-sm text-gray-600">
                                        {exercicio.observacao}
                                    </p>

                                </div>

                            {/if}


                            <!-- Botão -->

                            <Button
                                color="light"
                                class="w-full"
                            >
                                Ver exercício
                            </Button>

                        </div>

                    </Card>

                {/each}

            </div>


        {:else}

            <div class="py-12 text-center">

                <p class="text-gray-500">
                    Nenhum treino cadastrado para este dia.
                </p>

            </div>

        {/if}

    {/if}

</div>