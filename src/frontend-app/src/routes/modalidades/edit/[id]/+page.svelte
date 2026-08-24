<script lang="ts">
  // Importa o componente de formulário de modalidade
  import ModalidadeForm from '../../../../components/ModalidadeForm.svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Captura o parâmetro 'id' da URL
  const { id } = get(page).params;
</script>

<!-- Utiliza o componente ModalidadeForm passando id -->
<UserForm id={Number(id)} />
