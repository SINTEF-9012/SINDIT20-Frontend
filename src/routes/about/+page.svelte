<script lang="ts">
	import { getToastState } from '$lib/components/toast-state.svelte';
	import type { LogLevel } from '$lib/types';

	const toastState = getToastState();

	let title = '';
	let message = '';
	let logLevel: LogLevel = 'info';
	let titleInput: HTMLInputElement;

	function handleLogLevelInput(input: string) {
		input = input.toLowerCase();
		if (input === 'error' || input === 'warning' || input === 'info' || input === 'success') {
			logLevel = input as LogLevel;
		} else if (input == 'warn') {
			logLevel = 'warning';
		} else {
			logLevel = 'info';
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		handleLogLevelInput(logLevel);
		toastState.add(title, message, logLevel);
		title = '';
		message = '';
		logLevel = 'info';
		titleInput.focus();
	}
</script>

<h1 class="mb-4 text-xl font-semibold">This is the about page. Currently toasting.</h1>

<form on:submit={handleSubmit} class="flex w-1/4 flex-col gap-2">
	<div class="flex flex-col gap-1">
		<label for="title">Title</label>
		<input
			class="input"
			type="text"
			placeholder="Title"
			bind:this={titleInput}
			bind:value={title}
		/>
	</div>

	<div class="flex flex-col gap-1">
		<label for="message">Message</label>
		<input class="input" type="text" placeholder="Message" bind:value={message} />
	</div>

	<div class="flex flex-col gap-1">
		<label for="logLevel">Message type (debug, info, warn, error)</label>
		<input class="input" type="text" placeholder="info" bind:value={logLevel} />
		<button class="btn rounded-md variant-filled-primary"> Add toast! </button>
	</div>
</form>
