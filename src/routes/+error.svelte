<script>
    import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';

    import { resetState } from '$lib/stateHandler.svelte';

    afterNavigate(resetState)
</script>

<h1>
	Identity Crisis
</h1>
<h2>
	HTTP Error
</h2>
<p>Status: {page.status}</p>
<p>Message: {page.error?.message}</p>
<p>Return to the <a href="/" class="underline">home page</a></p>