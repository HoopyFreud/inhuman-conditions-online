<script lang="ts">
	import Header from './Header.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>{@render children()}</main>

	<footer>
		<h2>
			This is an online game based on Inhuman COnditions, available at <a href="https://robots.management/">https://robots.management/</a>
		</h2>
		<p>
			Inhuman Conditions is available for free under Creative Commons license BY—NC—SA 4.0.
		</p>
		<img class="cc" src="./src/lib/images/Cc.svg" alt="Creative Commons BY—NC—SA 4.0">
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
