<script lang="ts">
  import * as Field from "$lib/components/ui/field/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		Identity Crisis
	</h1>

	<div class="w-full max-w-md">
  <form>
    <Field.Group>
        <Field.Legend>Begin Interrogation</Field.Legend>
          <Field.Field>
            <Field.Label for="session-id"
              >Room Number</Field.Label
            >
            <Input
              id="session-id"
              required
            />
          </Field.Field>
      <Field.Field orientation="horizontal">
        <Button type="submit">Set Up Room</Button>
        <Button type="submit">Join Room</Button>
      </Field.Field>
    </Field.Group>
  </form>
</div>
          
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
</style>
