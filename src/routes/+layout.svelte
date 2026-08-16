<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<div id="app" class="relative min-h-dvh">
	<main>{@render children()}</main>

	<footer class="bottom-0 mt-auto">
		<p>
			This is an online game based on Inhuman Conditions, available at <a href="https://robots.management/">https://robots.management/</a>
		</p>
		<p>
			Inhuman Conditions and Identity Crisis are available for free under a <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en">Creative Commons license BY—NC—SA 4.0</a>.
		</p>
		<p>
			You can share or change it all you want, but you must give credit, include this license, and you can't sell it.
		</p>
		<img class="cc" src="/images/Cc.svg" alt="Creative Commons BY—NC—SA 4.0">
	</footer>
</div>

<style>
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
		margin: auto auto 1em;
	}

	footer a {
		font-weight: bold;
	}

	.cc {
		max-width: 200px;
		margin: 2em auto 2em;
	}
</style>
