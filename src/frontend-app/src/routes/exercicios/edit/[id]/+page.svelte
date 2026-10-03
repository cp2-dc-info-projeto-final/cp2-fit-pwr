<script lang="ts">
  // Importa o componente de formulário de usuário
  import ExerciciosFormulario from '../../../../components/ExerciciosFormulario.svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Captura o parâmetro 'id' da URL
  const { id } = get(page).params;
</script>
<div class="mt-60">
  <ExerciciosFormulario id={Number(id)} />
</div>
