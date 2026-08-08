<script lang="ts">
	let { children } = $props();
</script>

<div id="app" class="h-dvh">
	<main>{@render children()}</main>

	<footer>
		<h2>
			This is an online game based on Inhuman Conditions, available at <a href="https://robots.management/">https://robots.management/</a>
		</h2>
		<p>
			Inhuman Conditions is available for free under Creative Commons license BY—NC—SA 4.0.
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
	}

	footer a {
		font-weight: bold;
	}

	.cc {
		max-width: 300px;
		margin: 0 auto 2em;
	}
</style>
