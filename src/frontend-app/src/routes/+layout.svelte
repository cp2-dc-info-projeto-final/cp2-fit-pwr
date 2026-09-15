<script lang="ts">
	import '../app.css';
	import Menu from '../components/Menu.svelte';
	let { children } = $props();
</script>

<main class="">
  <Menu />
  <div class="">
    {@render children()}
  </div>
</main>
