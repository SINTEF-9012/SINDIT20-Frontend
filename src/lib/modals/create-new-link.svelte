<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getLinksState } from '$lib/components/states/links-state.svelte';
	import { createRelationship } from '$apis/sindit-backend/kg';
	import { getBackendUri } from '$lib/utils/uri';
	import { selectedNodes } from '$lib/stores';
	import type { RelationshipNodeType, VisualizableNode } from '$lib/types';
	import { get } from 'svelte/store';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodesState = getNodesState();
	const linksState = getLinksState();

	const RELATIONSHIP_OPTIONS: Array<{
		nodeType: RelationshipNodeType;
		relationshipType: string;
		label: string;
	}> = [
		{ nodeType: 'ConsistOfRelationship', relationshipType: 'consistsOf', label: 'Consists Of' },
		{ nodeType: 'PartOfRelationship', relationshipType: 'partOf', label: 'Part Of' },
		{ nodeType: 'ConnectedToRelationship', relationshipType: 'connectedTo', label: 'Connected To' },
		{ nodeType: 'DependsOnRelationship', relationshipType: 'dependsOn', label: 'Depends On' },
		{ nodeType: 'DerivedFromRelationship', relationshipType: 'derivedFrom', label: 'Derived From' },
		{ nodeType: 'MonitorsRelationship', relationshipType: 'monitors', label: 'Monitors' },
		{ nodeType: 'ControlsRelationship', relationshipType: 'controls', label: 'Controls' },
		{ nodeType: 'SimulatesRelationship', relationshipType: 'simulates', label: 'Simulates' },
		{ nodeType: 'UsesRelationship', relationshipType: 'uses', label: 'Uses' },
		{
			nodeType: 'CommunicatesWithRelationship',
			relationshipType: 'communicatesWith',
			label: 'Communicates With'
		},
		{ nodeType: 'IsTypeOfRelationship', relationshipType: 'isTypeOf', label: 'Is Type Of' }
	];

	let allNodes: VisualizableNode[] = [];
	let sourceNodeId = '';
	let targetNodeId = '';
	let relationshipType = RELATIONSHIP_OPTIONS[0].nodeType;
	let description = '';

	onMount(() => {
		allNodes = nodesState.getAllVisualizableNodes();
		// Pre-fill from selected nodes if exactly two are selected
		const currentSelection = get(selectedNodes);
		if (currentSelection.length >= 2) {
			sourceNodeId = currentSelection[0];
			targetNodeId = currentSelection[1];
		} else if (currentSelection.length === 1) {
			sourceNodeId = currentSelection[0];
		}
	});

	function getNodeDisplayName(node: VisualizableNode): string {
		if (node.nodeType === 'AbstractAsset') return node.nodeName;
		if (node.nodeType === 'SINDITKG') return node.label;
		return (node as any).propertyName ?? node.id;
	}

	$: selectedRelOption =
		RELATIONSHIP_OPTIONS.find((r) => r.nodeType === relationshipType) ?? RELATIONSHIP_OPTIONS[0];
	$: isFormValid =
		sourceNodeId.length > 0 && targetNodeId.length > 0 && sourceNodeId !== targetNodeId;

	async function handleCreate() {
		if (!isFormValid) return;
		const relId = crypto.randomUUID();
		const sourceUri = getBackendUri(sourceNodeId);
		const targetUri = getBackendUri(targetNodeId);
		const rel: any = {
			id: relId,
			nodeType: selectedRelOption.nodeType,
			relationshipType: selectedRelOption.relationshipType,
			relationshipDescription: description.trim() || undefined,
			relationshipSource: { uri: sourceUri },
			relationshipTarget: { uri: targetUri }
		};
		try {
			await createRelationship(rel);
			// Add to local state so the canvas updates immediately
			linksState.addRelationship({
				...rel,
				relationshipSource: { uri: sourceUri },
				relationshipTarget: { uri: targetUri }
			});
			selectedNodes.set([]);
			toastState.add(
				'Relationship Created',
				`${selectedRelOption.label} relationship created.`,
				'info'
			);
			modalStore.close();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to create relationship: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div
		class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto"
	>
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">New Relationship</h2>

		{#if allNodes.length === 0}
			<p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
				No nodes loaded. Load the knowledge graph first.
			</p>
		{:else}
			<div class="space-y-4">
				<!-- Source Node -->
				<div>
					<label
						for="rel-source"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
					>
						Source Node <span class="text-red-500">*</span>
					</label>
					<select
						id="rel-source"
						bind:value={sourceNodeId}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— Select source node —</option>
						{#each allNodes as node}
							<option value={node.id}>{getNodeDisplayName(node)} ({node.nodeType})</option>
						{/each}
					</select>
				</div>

				<!-- Relationship Type -->
				<div>
					<label
						for="rel-type"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
					>
						Relationship Type <span class="text-red-500">*</span>
					</label>
					<select
						id="rel-type"
						bind:value={relationshipType}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each RELATIONSHIP_OPTIONS as opt}
							<option value={opt.nodeType}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Target Node -->
				<div>
					<label
						for="rel-target"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
					>
						Target Node <span class="text-red-500">*</span>
					</label>
					<select
						id="rel-target"
						bind:value={targetNodeId}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— Select target node —</option>
						{#each allNodes as node}
							<option value={node.id}>{getNodeDisplayName(node)} ({node.nodeType})</option>
						{/each}
					</select>
					{#if sourceNodeId && targetNodeId && sourceNodeId === targetNodeId}
						<p class="text-red-500 text-xs mt-1">Source and target must be different nodes.</p>
					{/if}
				</div>

				<!-- Description -->
				<div>
					<label
						for="rel-description"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
					>
						Description
					</label>
					<input
						id="rel-description"
						name="rel-description"
						type="text"
						bind:value={description}
						placeholder="Optional description..."
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
		{/if}

		<div class="flex justify-end gap-3 mt-8">
			<button
				type="button"
				on:click={handleCancel}
				class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={handleCreate}
				disabled={!isFormValid || allNodes.length === 0}
				class="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Create Relationship
			</button>
		</div>
	</div>
{/if}

