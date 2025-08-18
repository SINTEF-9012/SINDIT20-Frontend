<script lang="ts">
	import { getToastState } from '$lib/components/states/toast-state.svelte';
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

<div class="text-center space-y-8 max-w-2xl mx-auto py-16 w-full text-primary-800 dark:text-primary-100 font-sans">
	<h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent mb-8">This is the about page. Currently toasting.</h1>

	<form on:submit={handleSubmit} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<label for="title">Title</label>
			<input
				class="input"
				type="text"
				id="title"
				name="title"
				placeholder="Title"
				bind:this={titleInput}
				bind:value={title}
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="message">Message</label>
			<input class="input" type="text" id="message" name="message" placeholder="Message" bind:value={message} />
		</div>

		<div class="flex flex-col gap-1">
			<label for="logLevel">Message type</label>
			<select class="input" id="logLevel" name="logLevel" bind:value={logLevel}>
				<option value="info" selected>info</option>
				<option value="warning">warning</option>
				<option value="error">error</option>
				<option value="success">success</option>
			</select>
		</div>
		<button class="btn rounded-md variant-filled-primary self-start">Add toast!</button>
	</form>
</div>

<style>
	.about-container {
		min-height: 60vh;
		box-sizing: border-box;
	}
</style>
