<script lang="ts">
  // Importa o componente de formulário de turma
  import TurmaForm from '../../../../components/TurmaForm.svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Captura o parâmetro 'id' da URL
  const { id } = get(page).params;
</script>

<!-- Utiliza o componente TurmaForm passando id -->
<TurmaForm id={Number(id)} />
