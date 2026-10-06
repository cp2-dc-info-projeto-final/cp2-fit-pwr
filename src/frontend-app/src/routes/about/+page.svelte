<script lang="ts">
  import {
    Card,
    Button,
    Heading,
    P,
    Badge
  } from 'flowbite-svelte';

  const planos = [
    {
      nome: 'Plano completo',
      preco: 'R$ 79,90',
      descricao: 'Para todos os publicos.',
      beneficios: [
        'Acesso ilimitado',
        'Treino funcional',
        'Horário comercial',
        'Aréa cardio',
        'Aulas coletivas',
        'Disponibilidade de personal trainer',
        
      ],
      cor: 'red'
    },
    
  ];

  function matricular(plano: string) {
    alert(`Você escolheu o ${plano}`);
  }
</script>



<svelte:head>
  <title>CP2FIT - Matrículas</title>
</svelte:head>
<div class="min-h-screen w-full bg-gray-900 text-gray-100 transition-colors">
  
  <!-- Título -->
  <div class="text-center mb-12">
    <Heading tag="h1" class="text-5xl font-extrabold mb-4 text-gray-900">
      Planos CP2FIT
    </Heading>


    <br>
  </div>

  <!-- Grid de planos -->
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">

    {#each planos as plano}
      <Card class="flex flex-col justify-between shadow-xl rounded-2xl border border-gray-200">

        <div>
          <!-- Badge -->
          <Badge color={plano.cor} class="mb-4 w-fit">
            Academia
          </Badge>

          <!-- Nome -->
          <Heading tag="h3" class="text-2xl font-bold mb-2">
            {plano.nome}
          </Heading>

          <!-- Preço -->
          <p class="text-4xl font-extrabold text-gray-900 mb-4">
            {plano.preco}
            <span class="text-base font-normal text-gray-500">/mês</span>
          </p>

          <!-- Descrição -->
          <P class="mb-6 text-gray-600">
            {plano.descricao}
          </P>

          <!-- Benefícios -->
          <ul class="space-y-3 mb-8">
            {#each plano.beneficios as beneficio}
              <li class="flex items-center text-gray-700">
                ✅ {beneficio}
              </li>
            {/each}
          </ul>
        </div>

        <!-- Botão -->
        <Button
          color={plano.cor}
          class="w-full"
          onclick={() => matricular(plano.nome)}
        >
          Fazer Matrícula
        </Button>

      </Card>
    {/each}

  </div>
</div>