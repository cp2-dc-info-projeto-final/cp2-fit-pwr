<script lang="ts">
    import { Heading, P, Button } from 'flowbite-svelte';
    import { goto } from '$app/navigation';
    import Menu from '../components/Menu.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { getCurrentUser } from '$lib/auth';

    let usuarioLogado = $state(false);
    let imagemAtual = $state(0);
    let intervalId: ReturnType<typeof setInterval>;

    const imagens = [
        {
            src: '/images/esteira.jpg',
            alt: 'Alunos fazendo esteira'
        },
        {
            src: '/images/musculação.webp',
            alt: 'Alunos praticando musculação'
        }
    ];

    onMount(async () => {
        const user = await getCurrentUser();
        usuarioLogado = !!user;

        intervalId = setInterval(() => {
            proximaImagem();
        }, 5000);
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });

    async function handleAcao() {
        if (usuarioLogado) {
            await goto('/matricula');
        } else {
            await goto('/login');
        }
    }

    function proximaImagem() {
        imagemAtual = (imagemAtual + 1) % imagens.length;
    }

    function imagemAnterior() {
        imagemAtual = (imagemAtual - 1 + imagens.length) % imagens.length;
    }

    function selecionarImagem(index: number) {
        imagemAtual = index;
    }
</script>

<!-- COR DE FUNDO  -->
<div class="min-h-screen w-full bg-gray-90 text-gray-100 transition-colors">
    <Menu />

    <!-- HERO -->
    <section class="relative pt-20">
        <div class="mx-auto max-w-7xl px-4">

            <!-- CARROSSEL -->
            <div class="relative h-[500px] overflow-hidden rounded-3xl shadow-2xl md:h-[600px]">

                <!-- IMAGENS -->
                {#each imagens as imagem, index}
                    <img
                        src={imagem.src}
                        alt={imagem.alt}
                        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700
                        {index === imagemAtual ? 'opacity-100' : 'opacity-0'}"
                    />
                {/each}

                <!-- CONTROLES DO CARROSSEL -->
                <button
                    onclick={imagemAnterior}
                    aria-label="Imagem anterior"
                    class="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition hover:bg-black/70"
                >
                    &#10094;
                </button>
                <button
                    onclick={proximaImagem}
                    aria-label="Próxima imagem"
                    class="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white transition hover:bg-black/70"
                >
                    &#10095;
                </button>

                <!-- INDICADORES -->
                <div class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 space-x-2">
                    {#each imagens as _, index}
                        <button
                            onclick={() => selecionarImagem(index)}
                            aria-label={`Ir para slide ${index + 1}`}
                            class="h-3 rounded-full transition-all {index === imagemAtual ? 'bg-white w-6' : 'bg-white/50 w-3'}"
                        ></button>
                    {/each}
                </div>

                <!-- OVERLAY DE CONTEÚDO -->
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-center px-6">
                    <div class="max-w-4xl text-white">

                        <p class="mb-4 text-sm md:text-base font-bold uppercase tracking-[0.3em] text-blue-400">
                            CP2FIT
                        </p>

                        <h1 class="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                            Movimente-se.<br />
                            <span class="text-blue-400">Supere-se.</span>
                            <br class="md:hidden" />
                            Faça parte.
                        </h1>

                        <p class="mx-auto mb-8 max-w-2xl text-lg md:text-xl text-gray-200">
                            Conecte-se com outros alunos do CP2 através do esporte,
                            da atividade física e de uma vida mais saudável.
                        </p>

                        <Button
                            size="xl"
                            color={usuarioLogado ? 'green' : 'blue'}
                            onclick={handleAcao}
                            class="px-8 py-3 text-lg font-bold"
                        >
                            {#if usuarioLogado}
                                Fazer Matrícula
                            {:else}
                                Entrar e se Matricular
                            {/if}
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- APRESENTAÇÃO -->
    <section class="mx-auto max-w-6xl px-6 py-20 text-center">

        <p class="mb-3 text-sm font-bold uppercase tracking-widest text-blue-400">
            Sobre o CP2FIT
        </p>

        <Heading
            tag="h2"
            class="mb-6 text-3xl font-extrabold text-white md:text-4xl"
        >
            O esporte conecta. O CP2FIT transforma.
        </Heading>

        <P class="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300">
            O CP2FIT é uma rede acadêmica criada para aproximar os alunos
            do Colégio Pedro II através da prática de atividades físicas.
            Encontre novos esportes, conheça pessoas e faça parte dessa comunidade.
        </P>

    </section>

    <!-- CARDS DE RECURSOS -->
    <section class="px-6 py-16">

        <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">

            <div class="rounded-2xl bg-gray-800 p-8 text-center shadow-lg border border-gray-700">
                <div class="mb-4 text-4xl">🏀</div>

                <h3 class="mb-3 text-xl font-bold text-white">
                    Pratique esportes
                </h3>

                <p class="text-gray-300">
                    Encontre atividades e modalidades para se manter ativo
                    dentro do ambiente escolar.
                </p>
            </div>

            <div class="rounded-2xl bg-gray-800 p-8 text-center shadow-lg border border-gray-700">
                <div class="mb-4 text-4xl">🤝</div>

                <h3 class="mb-3 text-xl font-bold text-white">
                    Conheça pessoas
                </h3>

                <p class="text-gray-300">
                    Conecte-se com outros alunos que também gostam
                    de praticar atividades físicas.
                </p>
            </div>

            <div class="rounded-2xl bg-gray-800 p-8 text-center shadow-lg border border-gray-700">
                <div class="mb-4 text-4xl">💪</div>

                <h3 class="mb-3 text-xl font-bold text-white">
                    Seja mais ativo
                </h3>

                <p class="text-gray-300">
                    Transforme a atividade física em parte da sua rotina
                    e cuide melhor da sua saúde.
                </p>
            </div>

        </div>

    </section>

    <!-- CTA FINAL -->
    <section class="px-6 py-20 text-center">

        <Heading
            tag="h2"
            class="mb-4 text-3xl font-extrabold text-white"
        >
            Pronto para fazer parte?
        </Heading>

        <P class="mx-auto mb-8 max-w-2xl text-gray-300">
            Entre para o CP2FIT e descubra novas formas de praticar
            esportes dentro do CP2.
        </P>


    </section>
</div>