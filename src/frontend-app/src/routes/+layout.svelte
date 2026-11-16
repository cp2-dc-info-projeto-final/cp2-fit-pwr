<script lang="ts">
    import '../app.css';
    import Menu from '../components/Menu.svelte';

    let { children } = $props();
</script>

<div class="min-h-screen w-full bg-gray-900 text-gray-100">
    <Menu />
    <main class="w-full">
        {@render children()}
    </main>
</div>