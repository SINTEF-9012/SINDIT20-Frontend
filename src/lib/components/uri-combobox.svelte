<script lang="ts">
	import { onDestroy, beforeUpdate } from 'svelte';

	// ---- Props ----
	/** The bound URI value */
	export let value: string = '';
	/** id for the <input> element */
	export let id: string = '';
	/** placeholder text */
	export let placeholder: string = '';
	/** Extra CSS classes forwarded to the wrapper */
	export let className: string = '';

	/**
	 * Static list of suggestions (label + uri).
	 * Used for client-side filtering (e.g. data types).
	 */
	export let staticItems: Array<{ uri: string; label: string }> = [];

	/**
	 * Async search function. When provided it is used instead of staticItems
	 * (e.g. unit search backed by the backend).
	 * Should return Array<{ uri: string; label: string }>.
	 */
	export let searchFn: ((q: string) => Promise<Array<{ uri: string; label: string }>>) | null = null;

	// ---- State ----
	let inputEl: HTMLInputElement;
	let wrapperEl: HTMLDivElement;
	let query = '';          // tracks what the user is typing (may differ from value)
	let suggestions: Array<{ uri: string; label: string }> = [];
	let open = false;
	let activeIndex = -1;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let prevValue = value;  // track last externally-set value

	// Sync query only when value is changed from outside (e.g. prefill / reset),
	// not when the user is typing (which updates value via handleInput).
	beforeUpdate(() => {
		if (value !== prevValue) {
			query = value;
			prevValue = value;
		}
	});

	function filterStatic(q: string) {
		if (!q.trim()) return staticItems.slice(0, 20);
		const lower = q.toLowerCase();
		return staticItems
			.filter(
				(item) =>
					item.label.toLowerCase().includes(lower) ||
					item.uri.toLowerCase().includes(lower)
			)
			.slice(0, 20);
	}

	// Opens the full unfiltered list and highlights the current value if it's in the list.
	function openFullList(focusInput = false) {
		if (staticItems.length === 0) return;
		suggestions = [...staticItems];
		const match = suggestions.findIndex((item) => item.uri === value);
		activeIndex = match;
		open = true;
		if (focusInput) inputEl?.focus();
		if (match >= 0) {
			setTimeout(() => {
				wrapperEl?.querySelector<HTMLElement>(`[data-idx="${match}"]`)?.scrollIntoView({ block: 'nearest' });
			}, 0);
		}
	}

	async function handleInput() {
		value = query; // keep bound value in sync as user types
		activeIndex = -1;

		if (!query.trim()) {
			// Cleared input — show the full list
			openFullList();
			return;
		}

		if (searchFn) {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				try {
					suggestions = await searchFn!(query);
					// Fall back to static filter if searchFn returned nothing
					if (suggestions.length === 0 && staticItems.length > 0) {
						suggestions = filterStatic(query);
					}
					open = suggestions.length > 0;
				} catch {
					suggestions = filterStatic(query);
					open = suggestions.length > 0;
				}
			}, 250);
		} else {
			suggestions = filterStatic(query);
			open = suggestions.length > 0;
		}
	}

	function toggleOpen() {
		if (open) {
			open = false;
		} else {
			openFullList(true);
		}
	}

	function selectItem(item: { uri: string; label: string }) {
		value = item.uri;
		query = item.uri;
		prevValue = item.uri;
		open = false;
		suggestions = [];
		activeIndex = -1;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			selectItem(suggestions[activeIndex]);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}

	function handleBlur(e: FocusEvent) {
		// Delay so click on suggestion registers first
		setTimeout(() => {
			if (!wrapperEl?.contains(document.activeElement)) {
				open = false;
			}
		}, 150);
	}

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
	});
</script>

<div class="uri-combobox {className}" bind:this={wrapperEl}>
	<div class="input-row">
		<input
			{id}
			type="text"
			bind:this={inputEl}
			bind:value={query}
			{placeholder}
			class="field-input"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			autocomplete="off"
			on:input={handleInput}
			on:keydown={handleKeyDown}
			on:blur={handleBlur}
			on:focus={() => openFullList()}
		/>
		<button
			type="button"
			class="chevron-btn"
			tabindex="-1"
			aria-label="Toggle list"
			on:mousedown|preventDefault={toggleOpen}
		>
			<svg
				class="chevron-icon"
				class:rotated={open}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				width="16"
				height="16"
			>
				<path
					fill-rule="evenodd"
					d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>

	{#if open && suggestions.length > 0}
		<ul class="suggestions" role="listbox">
			{#each suggestions as item, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class="suggestion-item"
					class:active={i === activeIndex}
					role="option"
					aria-selected={i === activeIndex}
					data-idx={i}
					on:mousedown|preventDefault={() => selectItem(item)}
					on:mousemove={() => (activeIndex = i)}
				>
					<span class="suggestion-label">{item.label}</span>
					<span class="suggestion-uri">{item.uri}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.uri-combobox {
		position: relative;
		width: 100%;
	}

	.input-row {
		display: flex;
		align-items: stretch;
		width: 100%;
	}

	/* Match RightPanel .field-input styles (scoped CSS can't cross component boundaries) */
	.field-input {
		flex: 1;
		min-width: 0;
		padding: 8px 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-right: none;
		border-radius: 8px 0 0 8px;
		font-size: 14px;
		color: #1e293b;
		transition: border-color 0.15s, box-shadow 0.15s;
		outline: none;
		box-sizing: border-box;
	}

	.field-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
		position: relative;
		z-index: 1;
	}

	:global(.dark) .field-input {
		background: #334155;
		border-color: #475569;
		color: #f1f5f9;
	}

	:global(.dark) .field-input:focus {
		border-color: #60a5fa;
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
	}

	.chevron-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 10px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-left: none;
		border-radius: 0 8px 8px 0;
		color: #64748b;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		flex-shrink: 0;
	}

	.chevron-btn:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	:global(.dark) .chevron-btn {
		background: #334155;
		border-color: #475569;
		color: #94a3b8;
	}

	:global(.dark) .chevron-btn:hover {
		background: #475569;
		color: #f1f5f9;
	}

	.chevron-icon {
		transition: transform 0.2s;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	.suggestions {
		position: absolute;
		top: calc(100% + 2px);
		left: 0;
		right: 0;
		z-index: 9999;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
		max-height: 220px;
		overflow-y: auto;
		padding: 4px 0;
		margin: 0;
		list-style: none;
	}

	:global(.dark) .suggestions {
		background: #1e293b;
		border-color: #475569;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
	}

	.suggestion-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 7px 12px;
		cursor: pointer;
		transition: background 0.1s;
	}

	.suggestion-item:hover,
	.suggestion-item.active {
		background: #f1f5f9;
	}

	:global(.dark) .suggestion-item:hover,
	:global(.dark) .suggestion-item.active {
		background: #334155;
	}

	.suggestion-label {
		font-size: 13px;
		font-weight: 500;
		color: #1e293b;
	}

	:global(.dark) .suggestion-label {
		color: #f1f5f9;
	}

	.suggestion-uri {
		font-size: 11px;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .suggestion-uri {
		color: #94a3b8;
	}
</style>
