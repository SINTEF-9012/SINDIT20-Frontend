<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { rightPanelState, selectedNodes, backendNodesData, kgRefreshTrigger } from '$lib/stores';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getLinksState } from '$lib/components/states/links-state.svelte';
	import { getConnectionsState } from '$lib/components/states/connections.svelte';
	import {
		createRelationship,
		deleteRelationship,
		deleteNode,
		addPropertyToAssetNode,
		createAbstractNode,
		createAbstractPropertyNode,
		createSINDITKGNode,
		createDatabasePropertyNode,
		createStreamingPropertyNode,
		createTimeseriesPropertyNode,
		createS3PropertyNode,
		createPropertyCollectionNode,
		updateNode,
		getNode
	} from '$apis/sindit-backend/kg';
	import { getBackendUri, getApiBaseUri, getNodeIdFromBackendUri } from '$lib/utils/uri';
	import { getWorkspace } from '$apis/sindit-backend/workspace';
	import { getAllDataTypes, getAllUnits, searchUnits } from '$apis/sindit-backend/metamodel';
	import UriCombobox from '$lib/components/uri-combobox.svelte';
	import type { RelationshipNodeType, VisualizableNode, Connection, ReturnedDataTypeAllDataTypes, ReturnedDataTypeAllUnits } from '$lib/types';

	const toastState = getToastState();
	const nodesState = getNodesState();
	const linksState = getLinksState();
	const connectionsState = getConnectionsState();

	// ---- Shared ----
	function closePanel() {
		rightPanelState.set({ type: null, mode: 'create' });
	}

	// ---- Node form ----
	type NodeTypeOption =
		| 'SINDITKG'
		| 'AbstractAsset'
		| 'AbstractAssetProperty'
		| 'DatabaseProperty'
		| 'StreamingProperty'
		| 'TimeseriesProperty'
		| 'S3ObjectProperty'
		| 'PropertyCollection';

	const NODE_TYPE_OPTIONS: Array<{ value: NodeTypeOption; label: string }> = [
		{ value: 'SINDITKG', label: 'KG Root (SINDITKG)' },
		{ value: 'AbstractAsset', label: 'Asset (AbstractAsset)' },
		{ value: 'AbstractAssetProperty', label: 'Generic Property' },
		{ value: 'DatabaseProperty', label: 'Database Property' },
		{ value: 'StreamingProperty', label: 'Streaming Property (MQTT)' },
		{ value: 'TimeseriesProperty', label: 'Timeseries Property (InfluxDB)' },
		{ value: 'S3ObjectProperty', label: 'S3 Object Property' },
		{ value: 'PropertyCollection', label: 'Property Collection' }
	];

	let selectedNodeType: NodeTypeOption = 'AbstractAsset';
	let formSubmitting = false;
	let uriPrefix = '';
	let uriManuallyEdited = false;

	// Shared URI
	let formUri = '';

	// AbstractAsset fields
	let assetLabel = '';
	let assetDescription = '';
	let assetType = '';
	let assetLinkedPropertyIds: string[] = []; // IDs of existing properties linked to this asset
	let collectionLinkedPropertyIds: string[] = []; // IDs of properties in a PropertyCollection
	let allPropertyNodes: VisualizableNode[] = []; // available properties for selection

	// SINDITKG fields
	let kgLabel = '';
	let kgLinkedAssetIds: string[] = [];
	let allAssetNodes: VisualizableNode[] = [];

	function toggleKGAsset(id: string, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		if (checked) {
			kgLinkedAssetIds = [...kgLinkedAssetIds, id];
		} else {
			kgLinkedAssetIds = kgLinkedAssetIds.filter((x) => x !== id);
		}
	}

	function toggleLinkedProperty(id: string, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		if (checked) {
			assetLinkedPropertyIds = [...assetLinkedPropertyIds, id];
		} else {
			assetLinkedPropertyIds = assetLinkedPropertyIds.filter((x) => x !== id);
		}
	}

	function toggleCollectionProperty(id: string, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		if (checked) {
			collectionLinkedPropertyIds = [...collectionLinkedPropertyIds, id];
		} else {
			collectionLinkedPropertyIds = collectionLinkedPropertyIds.filter((x) => x !== id);
		}
	}

	function getPropertyDisplayName(prop: VisualizableNode): string {
		return (prop as any).propertyName ?? prop.id;
	}

	// Shared property fields (all non-AbstractAsset types)
	let propertyName = '';
	let propertyDescription = '';
	let propertyValue = '';
	let propertyValueTimestamp = '';
	let propertySemanticID = '';
	let propertyDataTypeUri = '';
	let propertyUnitUri = '';
	let propertyConnectionId = ''; // local ID of selected connection

	// DatabaseProperty / TimeseriesProperty
	let dbQuery = '';

	// StreamingProperty
	let streamingTopic = '';
	let streamingPath = '';

	// TimeseriesProperty
	let tsIdentifiersJson = '';
	let tsRetrievalMethod = '';
	let tsTagsJson = '';
	let tsIdentifiersError = '';
	let tsTagsError = '';

	// S3ObjectProperty
	let s3Bucket = '';
	let s3Key = '';
	let s3UrlMode = '';

	// Available connections for dropdowns
	let allConnections: Connection[] = [];

	// Available data types and units from backend metamodel
	let availableDataTypes: ReturnedDataTypeAllDataTypes[] = [];
	let availableUnits: ReturnedDataTypeAllUnits[] = [];

	async function loadMetamodel() {
		try {
			[availableDataTypes, availableUnits] = await Promise.all([getAllDataTypes(), getAllUnits()]);
		} catch {
			// Non-critical — user can still type URIs manually
		}
	}

	// Adapter: data type items for UriCombobox
	$: dataTypeItems = availableDataTypes.map((dt) => ({ uri: dt.uri, label: dt.label }));

	// Adapter: unit items for UriCombobox initial/fallback list
	$: unitItems = availableUnits.map((u) => ({
		uri: u.uri,
		label: `${u.prefName}${u.code ? ' [' + u.code + ']' : ''}`
	}));

	// Adapter: unit search function for UriCombobox (uses backend search endpoint)
	async function unitSearchFn(q: string): Promise<Array<{ uri: string; label: string }>> {
		const results = await searchUnits(q);
		return results.map((u) => ({
			uri: u.uri,
			label: `${u.prefName}${u.symbol ? ' (' + u.symbol + ')' : u.code ? ' [' + u.code + ']' : ''}`
		}));
	}

	function slugify(text: string): string {
		return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	}

	function onNameInput() {
		if (!uriManuallyEdited && uriPrefix) {
			const name = selectedNodeType === 'SINDITKG' ? kgLabel
				: selectedNodeType === 'AbstractAsset' ? assetLabel : propertyName;
			const slug = slugify(name) || 'node';
			formUri = `${uriPrefix}${slug}`;
		}
	}

	function onUriInput() {
		uriManuallyEdited = true;
	}

	function onNodeTypeChange() {
		// Reset type-specific fields when switching types
		assetType = '';
		propertyValue = '';
		propertyValueTimestamp = '';
		propertySemanticID = '';
		dbQuery = '';
		streamingTopic = '';
		streamingPath = '';
		tsIdentifiersJson = '';
		tsRetrievalMethod = '';
		tsTagsJson = '';
		tsIdentifiersError = '';
		tsTagsError = '';
		s3Bucket = '';
		s3Key = '';
		s3UrlMode = '';
		propertyConnectionId = '';
		uriManuallyEdited = false;
		// Regenerate URI slug from whichever name is set
		onNameInput();
	}

	const CONNECTION_TYPE_TO_NODE_TYPE: Record<string, NodeTypeOption> = {
		MQTT: 'StreamingProperty',
		InfluxDB: 'TimeseriesProperty',
		S3: 'S3ObjectProperty',
		PostgreSQL: 'DatabaseProperty'
	};

	function onConnectionChange() {
		if (!propertyConnectionId) return;
		const conn = allConnections.find((c) => c.id === propertyConnectionId);
		if (!conn) return;
		const mapped = CONNECTION_TYPE_TO_NODE_TYPE[conn.connectionType];
		if (mapped && mapped !== selectedNodeType) {
			selectedNodeType = mapped;
			// Reset the type-specific fields but keep the chosen connection
			dbQuery = '';
			streamingTopic = '';
			streamingPath = '';
			tsIdentifiersJson = '';
			tsRetrievalMethod = '';
			tsTagsJson = '';
			tsIdentifiersError = '';
			tsTagsError = '';
			s3Bucket = '';
			s3Key = '';
			s3UrlMode = '';
		}
	}

	/** Coerce any backend value to a plain string suitable for an <input> */
	function toInputString(v: unknown): string {
		if (v == null) return '';
		if (typeof v === 'string') return v;
		if (typeof v === 'object') {
			// RDF literal objects may carry the actual value in a "@value" key
			const lit = v as Record<string, unknown>;
			if ('@value' in lit) return String(lit['@value']);
			if ('value' in lit) return String(lit['value']);
		}
		return String(v);
	}

	function prefillFormFromNode(node: any) {
		selectedNodeType = (node.nodeType ?? 'AbstractAsset') as NodeTypeOption;
		formUri = node.id ?? '';
		uriManuallyEdited = true;

		if (selectedNodeType === 'SINDITKG') {
			kgLabel = node.label ?? node.nodeName ?? '';
			kgLinkedAssetIds = (node.assets ?? []).map((a: any) => {
				const uri = typeof a === 'string' ? a : (a?.uri ?? '');
				return getNodeIdFromBackendUri(uri);
			}).filter(Boolean);
		} else if (selectedNodeType === 'AbstractAsset') {
			assetLabel = node.nodeName ?? node.label ?? '';
			assetDescription = node.description ?? '';
			assetType = node.assetType ?? '';
			// Populate linked properties from assetProperties array
			assetLinkedPropertyIds = (node.assetProperties ?? []).map((p: any) => {
				const uri = typeof p === 'string' ? p : (p?.uri ?? '');
				return getNodeIdFromBackendUri(uri);
			}).filter(Boolean);
		} else {
			propertyName = node.propertyName ?? '';
			propertyDescription = node.description ?? '';
			// Populate linked properties for PropertyCollection
			if (selectedNodeType === 'PropertyCollection') {
				collectionLinkedPropertyIds = (node.collectionProperties ?? []).map((p: any) => {
					const uri = typeof p === 'string' ? p : (p?.uri ?? '');
					return getNodeIdFromBackendUri(uri);
				}).filter(Boolean);
			} else {
				collectionLinkedPropertyIds = [];
			}
			propertyValue = toInputString(node.propertyValue);
			propertyValueTimestamp = toInputString(node.propertyValueTimestamp);
			propertySemanticID = node.propertySemanticID?.uri ?? node.propertySemanticID ?? '';
			propertyDataTypeUri = node.propertyDataType?.uri ?? '';
			propertyUnitUri = node.propertyUnit?.uri ?? '';
			propertyConnectionId = node.propertyConnection?.uri
				? getNodeIdFromBackendUri(node.propertyConnection.uri)
				: '';

			// DatabaseProperty / TimeseriesProperty
			dbQuery = node.query ?? '';

			// StreamingProperty
			streamingTopic = node.streamingTopic ?? '';
			streamingPath = node.streamingPath ?? '';

			// TimeseriesProperty
			tsIdentifiersJson = node.timeseriesIdentifiers
				? JSON.stringify(node.timeseriesIdentifiers, null, 2)
				: '';
			tsRetrievalMethod = node.timeseriesRetrievalMethod ?? '';
			tsTagsJson = node.timeseriesTags ? JSON.stringify(node.timeseriesTags, null, 2) : '';
			tsIdentifiersError = '';
			tsTagsError = '';

			// S3ObjectProperty
			s3Bucket = node.bucket ?? '';
			s3Key = node.key ?? '';
			s3UrlMode = node.urlMode ?? '';
		}
	}

	function prefillRelationshipFromData(rel: any) {
		// Use relationshipType (the semantic string) to find the matching dropdown option
		const match = RELATIONSHIP_OPTIONS.find((r) => r.relationshipType === rel.relationshipType)
			?? RELATIONSHIP_OPTIONS.find((r) => r.nodeType === rel.nodeType);
		if (match && match.nodeType !== 'AbstractRelationship') {
			relType = match.nodeType;
			relCustomType = '';
		} else {
			// Unknown type — fall back to custom
			relType = 'AbstractRelationship';
			relCustomType = rel.relationshipType ?? '';
		}
		relDescription = rel.relationshipDescription ?? '';
		relSemanticID = (rel.relationshipSemanticID as any)?.uri ?? rel.relationshipSemanticID ?? '';
		relValue = rel.relationshipValue != null ? String(rel.relationshipValue) : '';
		relUnit = (rel.relationshipUnit as any)?.uri ?? rel.relationshipUnit ?? '';
		relSourceId = rel.relationshipSource?.uri
			? getNodeIdFromBackendUri(rel.relationshipSource.uri)
			: '';
		relTargetId = rel.relationshipTarget?.uri
			? getNodeIdFromBackendUri(rel.relationshipTarget.uri)
			: '';
	}

	async function loadWorkspacePrefix() {
		try {
			const workspaceResponse = await getWorkspace();
			const wsUri: string =
				(workspaceResponse as any)?.uri ??
				(workspaceResponse as any)?.workspace_uri ??
				'';
			if (wsUri) {
				const sepIdx = Math.max(wsUri.lastIndexOf('#'), wsUri.lastIndexOf('/'));
				uriPrefix = sepIdx >= 0 ? wsUri.substring(0, sepIdx + 1) : wsUri + '#';
				if (!uriManuallyEdited) formUri = `${uriPrefix}node`;
			}
		} catch (_) {
			try {
				uriPrefix = getApiBaseUri();
				if (!uriManuallyEdited) formUri = `${uriPrefix}node`;
			} catch (_) {}
		}
	}

	$: isPropertyType = selectedNodeType !== 'AbstractAsset';
	$: requiresConnection =
		selectedNodeType === 'StreamingProperty' || selectedNodeType === 'TimeseriesProperty';

	$: isNodeFormValid = (() => {
		if (!formUri.trim()) return false;
		if (selectedNodeType === 'SINDITKG') return kgLabel.trim().length > 0;
		if (selectedNodeType === 'AbstractAsset') return assetLabel.trim().length > 0;
		if (!propertyName.trim()) return false;
		if (selectedNodeType === 'StreamingProperty') {
			return (
				streamingTopic.trim().length > 0 &&
				streamingPath.trim().length > 0 &&
				propertyConnectionId.length > 0
			);
		}
		if (selectedNodeType === 'TimeseriesProperty') return propertyConnectionId.length > 0;
		if (selectedNodeType === 'S3ObjectProperty') {
			return s3Bucket.trim().length > 0 && s3Key.trim().length > 0;
		}
		return true;
	})();

	function parseJsonField(value: string, errorVar: 'tsIdentifiersError' | 'tsTagsError'): Record<string, any> | undefined {
		if (!value.trim()) return undefined;
		try {
			const parsed = JSON.parse(value);
			if (errorVar === 'tsIdentifiersError') tsIdentifiersError = '';
			else tsTagsError = '';
			return parsed;
		} catch (_) {
			if (errorVar === 'tsIdentifiersError') tsIdentifiersError = 'Invalid JSON';
			else tsTagsError = 'Invalid JSON';
			return undefined;
		}
	}

	async function handleCreateNode() {
		if (!isNodeFormValid) return;
		formSubmitting = true;
		try {
			const position =
				$rightPanelState.position ?? {
					x: Math.random() * 800 + 100,
					y: Math.random() * 600 + 100
				};
			const uri = formUri.trim();
			const localId = getNodeIdFromBackendUri(uri);

			if (selectedNodeType === 'SINDITKG') {
				await createSINDITKGNode(uri, kgLabel.trim(), kgLinkedAssetIds);
				nodesState.addSINDITKGNode(
					localId,
					kgLabel.trim(),
					uri,
					kgLinkedAssetIds.map((id) => ({ uri: getBackendUri(id) }))
				);
			} else if (selectedNodeType === 'AbstractAsset') {
				const linkedProps = assetLinkedPropertyIds.map((id) => ({ uri: getBackendUri(id) }));
				await createAbstractNode(uri, assetLabel.trim(), assetDescription.trim());
				// Link selected properties via API
				for (const propId of assetLinkedPropertyIds) {
					try { await addPropertyToAssetNode(localId, propId); } catch (_) {}
				}
				nodesState.addVisualizableNode({
					id: localId,
					nodeType: 'AbstractAsset',
					nodeName: assetLabel.trim(),
					description: assetDescription.trim(),
					position,
					assetProperties: linkedProps,
					assetType: assetType.trim() || undefined
				});
			} else if (selectedNodeType === 'AbstractAssetProperty') {
				const prop: any = {
					id: localId,
					nodeType: 'AbstractAssetProperty',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || '',
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: propertyConnectionId ? { uri: propertyConnectionId } : undefined,
					position
				};
				await createAbstractPropertyNode(prop);
				nodesState.addVisualizableNode(prop);
			} else if (selectedNodeType === 'DatabaseProperty') {
				const prop: any = {
					id: localId,
					nodeType: 'DatabaseProperty',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: propertyConnectionId ? { uri: propertyConnectionId } : { uri: '' },
					query: dbQuery.trim() || undefined,
					position
				};
				await createDatabasePropertyNode(prop);
				nodesState.addVisualizableNode(prop);
			} else if (selectedNodeType === 'StreamingProperty') {
				const prop: any = {
					id: localId,
					nodeType: 'StreamingProperty',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: { uri: propertyConnectionId },
					streamingTopic: streamingTopic.trim(),
					streamingPath: streamingPath.trim(),
					position
				};
				await createStreamingPropertyNode(prop);
				nodesState.addVisualizableNode(prop);
			} else if (selectedNodeType === 'TimeseriesProperty') {
				const tsIdentifiers = parseJsonField(tsIdentifiersJson, 'tsIdentifiersError');
				const tsTags = parseJsonField(tsTagsJson, 'tsTagsError');
				if (tsIdentifiersError || tsTagsError) {
					toastState.add('Validation Error', 'Fix JSON fields before submitting.', 'error');
					return;
				}
				const prop: any = {
					id: localId,
					nodeType: 'TimeseriesProperty',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: { uri: propertyConnectionId },
					query: dbQuery.trim() || undefined,
					timeseriesIdentifiers: tsIdentifiers,
					timeseriesRetrievalMethod: tsRetrievalMethod.trim() || undefined,
					timeseriesTags: tsTags,
					position
				};
				await createTimeseriesPropertyNode(prop);
				nodesState.addVisualizableNode(prop);
			} else if (selectedNodeType === 'S3ObjectProperty') {
				const prop: any = {
					id: localId,
					nodeType: 'S3ObjectProperty',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: propertyConnectionId ? { uri: propertyConnectionId } : { uri: '' },
					bucket: s3Bucket.trim(),
					key: s3Key.trim(),
					urlMode: s3UrlMode || undefined,
					position
				};
				await createS3PropertyNode(prop);
				nodesState.addVisualizableNode(prop);
			} else if (selectedNodeType === 'PropertyCollection') {
				const prop: any = {
					id: localId,
					nodeType: 'PropertyCollection',
					propertyName: propertyName.trim(),
					description: propertyDescription.trim(),
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					collectionProperties: collectionLinkedPropertyIds.map((id) => ({ uri: getBackendUri(id) })),
					position
				};
				await createPropertyCollectionNode(prop);
				nodesState.addVisualizableNode(prop);
			}

			const displayName =
				selectedNodeType === 'SINDITKG' ? kgLabel.trim()
				: selectedNodeType === 'AbstractAsset' ? assetLabel.trim() : propertyName.trim();
			toastState.add(
				'Node Created',
				`${selectedNodeType} "${displayName}" has been created.`,
				'info'
			);
			// Sync the data inspector by fetching the freshly-created node from the backend
			try {
				const backendNode = await getNode(localId);
				if (backendNode) {
					backendNodesData.update((nodes) => [...nodes, backendNode]);
				}
			} catch (_) { /* non-fatal — inspector will update on next full reload */ }
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to create node: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			formSubmitting = false;
		}
	}

	// ---- Relationship form ----
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
		{ nodeType: 'IsTypeOfRelationship', relationshipType: 'isTypeOf', label: 'Is Type Of' },
		{ nodeType: 'AbstractRelationship', relationshipType: '', label: 'Custom…' }
	];

	let allNodes: VisualizableNode[] = [];
	let relSourceId = '';
	let relTargetId = '';
	let relType: RelationshipNodeType = RELATIONSHIP_OPTIONS[0].nodeType;
	let relCustomType = ''; // used when relType === 'AbstractRelationship'
	let relDescription = '';
	let relSemanticID = '';
	let relValue = '';
	let relUnit = '';
	let relFormSubmitting = false;

	function getNodeDisplayName(node: VisualizableNode): string {
		if (node.nodeType === 'AbstractAsset') return node.nodeName;
		if (node.nodeType === 'SINDITKG') return node.label;
		return (node as any).propertyName ?? node.id;
	}

	$: selectedRelOption =
		RELATIONSHIP_OPTIONS.find((r) => r.nodeType === relType) ?? RELATIONSHIP_OPTIONS[0];

	// The actual relationshipType string sent to the backend
	$: effectiveRelType =
		relType === 'AbstractRelationship' ? relCustomType.trim() : selectedRelOption.relationshipType;

	$: isRelFormValid =
		relSourceId.length > 0 &&
		relTargetId.length > 0 &&
		relSourceId !== relTargetId &&
		(relType !== 'AbstractRelationship' || relCustomType.trim().length > 0);

	async function handleCreateRelationship() {
		if (!isRelFormValid) return;
		relFormSubmitting = true;
		try {
			const relId = crypto.randomUUID();
			const sourceUri = getBackendUri(relSourceId);
			const targetUri = getBackendUri(relTargetId);
			const rel: any = {
				id: relId,
				nodeType: selectedRelOption.nodeType,
				relationshipType: effectiveRelType,
				relationshipDescription: relDescription.trim() || undefined,
				relationshipSemanticID: relSemanticID.trim() ? { uri: relSemanticID.trim() } : undefined,
				relationshipValue: relValue.trim() || undefined,
				relationshipUnit: relUnit.trim() ? { uri: relUnit.trim() } : undefined,
				relationshipSource: { uri: sourceUri },
				relationshipTarget: { uri: targetUri }
			};
			await createRelationship(rel);
			linksState.addRelationship({
				...rel,
				relationshipSource: { uri: sourceUri },
				relationshipTarget: { uri: targetUri }
			});
			selectedNodes.set([]);
			toastState.add(
				'Relationship Created',
				`${relType === 'AbstractRelationship' ? relCustomType.trim() : selectedRelOption.label} relationship created.`,
				'info'
			);
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to create relationship: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			relFormSubmitting = false;
		}
	}

	async function handleUpdateNode() {
		if (!isNodeFormValid) return;
		formSubmitting = true;
		try {
			const originalNode = $rightPanelState.data;
			const nodeId = originalNode.id;
			let updatedNode: any;

			if (selectedNodeType === 'SINDITKG') {
				updatedNode = {
					uri: originalNode.uri ?? originalNode.id,
					label: kgLabel.trim(),
					assets: kgLinkedAssetIds.length > 0
						? kgLinkedAssetIds.map((id) => ({ uri: getBackendUri(id) }))
						: null
				};
			} else if (selectedNodeType === 'AbstractAsset') {
				// Build only backend-accepted fields (extra="forbid" on model)
				updatedNode = {
					uri: originalNode.uri ?? originalNode.id,
					label: assetLabel.trim(),
					assetDescription: assetDescription.trim() || undefined,
					assetType: assetType.trim() || undefined,
					assetProperties: assetLinkedPropertyIds.map((id) => ({ uri: getBackendUri(id) }))
				};
			} else {
				// Build a clean object — do NOT spread originalNode to avoid
				// sending frontend-only fields (position, description, etc.)
				updatedNode = {
					uri: originalNode.uri ?? originalNode.id,
					nodeType: selectedNodeType,
					label: propertyName.trim(),
					propertyName: propertyName.trim(),
					propertyDescription: propertyDescription.trim() || undefined,
					propertyValue: propertyValue.trim() || undefined,
					propertyValueTimestamp: propertyValueTimestamp.trim() || undefined,
					propertySemanticID: propertySemanticID.trim() ? { uri: propertySemanticID.trim() } : undefined,
					propertyDataType: propertyDataTypeUri.trim() ? { uri: propertyDataTypeUri.trim() } : undefined,
					propertyUnit: propertyUnitUri.trim() ? { uri: propertyUnitUri.trim() } : undefined,
					propertyConnection: propertyConnectionId ? { uri: getBackendUri(propertyConnectionId) } : undefined
				};
				if (selectedNodeType === 'AbstractAssetProperty') {
					updatedNode.propertyValue = propertyValue.trim() || '';
				} else if (selectedNodeType === 'DatabaseProperty') {
					updatedNode.query = dbQuery.trim() || undefined;
				} else if (selectedNodeType === 'StreamingProperty') {
					updatedNode.streamingTopic = streamingTopic.trim();
					updatedNode.streamingPath = streamingPath.trim();
				} else if (selectedNodeType === 'TimeseriesProperty') {
					const tsIdentifiers = parseJsonField(tsIdentifiersJson, 'tsIdentifiersError');
					const tsTags = parseJsonField(tsTagsJson, 'tsTagsError');
					if (tsIdentifiersError || tsTagsError) {
						toastState.add('Validation Error', 'Fix JSON fields before submitting.', 'error');
						return;
					}
					updatedNode.query = dbQuery.trim() || undefined;
					updatedNode.timeseriesIdentifiers = tsIdentifiers;
					updatedNode.timeseriesRetrievalMethod = tsRetrievalMethod.trim() || undefined;
					updatedNode.timeseriesTags = tsTags;
				} else if (selectedNodeType === 'S3ObjectProperty') {
					updatedNode.bucket = s3Bucket.trim();
					updatedNode.key = s3Key.trim();
					updatedNode.urlMode = s3UrlMode || undefined;
				} else if (selectedNodeType === 'PropertyCollection') {
					updatedNode.collectionProperties = collectionLinkedPropertyIds.length > 0
						? collectionLinkedPropertyIds.map((id) => ({ uri: getBackendUri(id) }))
						: null;
				}
			}

			await updateNode(updatedNode, true);
			nodesState.updateNode(nodeId, updatedNode);

			const displayName =
				selectedNodeType === 'SINDITKG' ? kgLabel.trim()
				: selectedNodeType === 'AbstractAsset' ? assetLabel.trim() : propertyName.trim();
			toastState.add('Node Updated', `"${displayName}" has been updated.`, 'info');
			// Sync the data inspector by fetching the freshly-updated node from the backend
			try {
				const backendNode = await getNode(nodeId);
				if (backendNode) {
					const nodeUri = backendNode.uri ?? getBackendUri(nodeId);
					backendNodesData.update((nodes) =>
						nodes.map((n: any) => (n.uri === nodeUri ? backendNode : n))
					);
				}
			} catch (_) { /* non-fatal */ }
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to update node: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			formSubmitting = false;
		}
	}

	async function handleUpdateRelationship() {
		if (!isRelFormValid) return;
		relFormSubmitting = true;
		try {
			const originalRel = $rightPanelState.data;
			const sourceUri = getBackendUri(relSourceId);
			const targetUri = getBackendUri(relTargetId);
			// Delete old relationship first, then recreate with a new UUID to avoid
			// any URI collision in the triple store (same URI with different class)
			await deleteRelationship(originalRel.id);
			const newRelId = crypto.randomUUID();
			const updatedRel: any = {
				id: newRelId,
				nodeType: selectedRelOption.nodeType,
				relationshipType: effectiveRelType,
				relationshipDescription: relDescription.trim() || undefined,
				relationshipSemanticID: relSemanticID.trim() ? { uri: relSemanticID.trim() } : undefined,
				relationshipValue: relValue.trim() || undefined,
				relationshipUnit: relUnit.trim() ? { uri: relUnit.trim() } : undefined,
				relationshipSource: { uri: sourceUri },
				relationshipTarget: { uri: targetUri }
			};
			await createRelationship(updatedRel);
			// Replace old relationship in local state with the newly created one
			const rels = get(linksState.relationships);
			const idx = rels.findIndex((r) => r.id === originalRel.id);
			if (idx >= 0) {
				linksState.relationships.update((arr) => [
					...arr.slice(0, idx),
					updatedRel,
					...arr.slice(idx + 1)
				]);
			} else {
				linksState.addRelationship(updatedRel);
			}
			toastState.add(
				'Relationship Updated',
				`${relType === 'AbstractRelationship' ? relCustomType.trim() : selectedRelOption.label} relationship updated.`,
				'info'
			);
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to update relationship: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			relFormSubmitting = false;
		}
	}

	async function handleDeleteNode() {
		formSubmitting = true;
		try {
			const node = $rightPanelState.data;
			await deleteNode(node.id);
			nodesState.deleteNode(node.id);
			toastState.add('Node Deleted', 'Node removed.', 'info');
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to delete node: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			formSubmitting = false;
		}
	}

	async function handleDeleteRelationship() {
		relFormSubmitting = true;
		try {
			const rel = $rightPanelState.data;
			await deleteRelationship(rel.id);
			linksState.relationships.update((arr) => arr.filter((r) => r.id !== rel.id));
			toastState.add('Relationship Deleted', 'Relationship removed.', 'info');
			kgRefreshTrigger.update((n) => n + 1);
			closePanel();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to delete relationship: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		} finally {
			relFormSubmitting = false;
		}
	}

	// ---- Init when panel type changes ----
	let prevPanelType: string | null = null;
	let prevPanelMode: string | null = null;
	let prevPanelData: any = null;

	$: if ($rightPanelState.type !== prevPanelType || $rightPanelState.mode !== prevPanelMode || $rightPanelState.data !== prevPanelData) {
		prevPanelType = $rightPanelState.type;
		prevPanelMode = $rightPanelState.mode;
		prevPanelData = $rightPanelState.data;
		if ($rightPanelState.type === 'node') {
			allConnections = connectionsState.getAllConnectionNodes();
			allAssetNodes = nodesState.getAllVisualizableNodes().filter((n) =>
				n.nodeType === 'AbstractAsset'
			);
			allPropertyNodes = nodesState.getAllVisualizableNodes().filter((n) =>
				n.nodeType === 'AbstractAssetProperty' ||
				n.nodeType === 'StreamingProperty' ||
				n.nodeType === 'TimeseriesProperty' ||
				n.nodeType === 'S3ObjectProperty' ||
				n.nodeType === 'PropertyCollection'
			);
			loadWorkspacePrefix();
			if (availableDataTypes.length === 0) loadMetamodel();
			if ($rightPanelState.mode === 'update' && $rightPanelState.data) {
				// Pre-fill from existing node data
				prefillFormFromNode($rightPanelState.data);
			} else {
				// Reset all node form state for create
				selectedNodeType = 'AbstractAsset';
				formUri = uriPrefix ? `${uriPrefix}node` : '';
				kgLabel = '';
				kgLinkedAssetIds = [];
				assetLabel = '';
				assetDescription = '';
				assetType = '';
				assetLinkedPropertyIds = [];
				collectionLinkedPropertyIds = [];
				propertyName = '';
				propertyDescription = '';
				propertyValue = '';
				propertyValueTimestamp = '';
				propertySemanticID = '';
				propertyDataTypeUri = '';
				propertyUnitUri = '';
				propertyConnectionId = '';
				dbQuery = '';
				streamingTopic = '';
				streamingPath = '';
				tsIdentifiersJson = '';
				tsRetrievalMethod = '';
				tsTagsJson = '';
				tsIdentifiersError = '';
				tsTagsError = '';
				s3Bucket = '';
				s3Key = '';
				s3UrlMode = '';
				uriManuallyEdited = false;
			}
		} else if ($rightPanelState.type === 'relationship') {
			// Reset relationship form
			allNodes = nodesState.getAllVisualizableNodes();
			if ($rightPanelState.mode === 'update' && $rightPanelState.data) {
				prefillRelationshipFromData($rightPanelState.data);
			} else {
				relType = RELATIONSHIP_OPTIONS[0].nodeType;
				relCustomType = '';
				relDescription = '';
				relSemanticID = '';
				relValue = '';
				relUnit = '';
				// Pre-fill from selected nodes if available
				const sel = get(selectedNodes);
				relSourceId = sel[0] ?? '';
				relTargetId = sel[1] ?? '';
			}
		}
	}

	onMount(() => {
		// Initial load if panel is already open
		if ($rightPanelState.type === 'node') {
			allConnections = connectionsState.getAllConnectionNodes();
			loadWorkspacePrefix();
			loadMetamodel();
		} else if ($rightPanelState.type === 'relationship') {
			allNodes = nodesState.getAllVisualizableNodes();
			const sel = get(selectedNodes);
			relSourceId = sel[0] ?? '';
			relTargetId = sel[1] ?? '';
		}
	});
</script>

{#if $rightPanelState.type !== null}
	<aside
		class="right-panel"
		transition:fly={{ x: 360, duration: 220 }}
	>
		<!-- Header -->
		<div class="panel-header">
			<h3 class="panel-title">
				{#if $rightPanelState.type === 'node'}
					{$rightPanelState.mode === 'create' ? 'New Node' : 'Edit Node'}
				{:else if $rightPanelState.type === 'relationship'}
					{$rightPanelState.mode === 'create' ? 'New Relationship' : 'Edit Relationship'}
				{/if}
			</h3>
			<button class="close-btn" on:click={closePanel} title="Close panel">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Body -->
		<div class="panel-body">
			<!-- ---- Node Form ---- -->
			{#if $rightPanelState.type === 'node'}
				<div class="space-y-4">
					<!-- Node Type Selector -->
					<div class="field">
						<label for="rp-node-type" class="field-label">
							Node Type <span class="required">*</span>
						</label>
						<select
							id="rp-node-type"
							bind:value={selectedNodeType}
							on:change={onNodeTypeChange}
							class="field-select"
						>
							{#each NODE_TYPE_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>

					<!-- Node URI (always shown) -->
					<div class="field">
						<label for="rp-uri" class="field-label">
							Node URI <span class="required">*</span>
						</label>
						<input
							id="rp-uri"
							type="text"
							bind:value={formUri}
							on:input={onUriInput}
							placeholder="http://sindit.sintef.no/2.0#my-node"
							class="field-input"
						/>
					</div>

					<!-- AbstractAsset-specific fields -->
					{#if selectedNodeType === 'SINDITKG'}
						<div class="field">
							<label for="rp-kg-label" class="field-label">
								Label <span class="required">*</span>
							</label>
							<input
								id="rp-kg-label"
								type="text"
								bind:value={kgLabel}
								on:input={onNameInput}
								placeholder="My Knowledge Graph"
								autofocus
								class="field-input"
							/>
						</div>
						{#if allAssetNodes.length > 0}
						<div class="field">
							<span class="field-label">Linked Assets</span>
							<div class="prop-list">
								{#each allAssetNodes as asset}
									<label class="prop-list-item">
										<input
											type="checkbox"
											value={asset.id}
											checked={kgLinkedAssetIds.includes(asset.id)}
											on:change={(e) => toggleKGAsset(asset.id, e)}
										/>
										<span class="prop-list-name">{getNodeDisplayName(asset)}</span>
										<span class="prop-list-type">{asset.nodeType}</span>
									</label>
								{/each}
							</div>
						</div>
						{/if}
					{:else if selectedNodeType === 'AbstractAsset'}
						<div class="field">
							<label for="rp-asset-label" class="field-label">
								Label <span class="required">*</span>
							</label>
							<input
								id="rp-asset-label"
								type="text"
								bind:value={assetLabel}
								on:input={onNameInput}
								placeholder="My Sensor"
								autofocus
								class="field-input"
							/>
						</div>
						<div class="field">
							<label for="rp-asset-desc" class="field-label">Description</label>
							<input
								id="rp-asset-desc"
								type="text"
								bind:value={assetDescription}
								placeholder="Optional description..."
								class="field-input"
							/>
						</div>
						<div class="field">
							<label for="rp-asset-type" class="field-label">Asset Type</label>
							<input
								id="rp-asset-type"
								type="text"
								bind:value={assetType}
								placeholder="e.g. Sensor, Motor, Controller..."
								class="field-input"
							/>
						</div>
						{#if allPropertyNodes.length > 0}
						<div class="field">
							<span class="field-label">Linked Properties</span>
							<div class="prop-list">
								{#each allPropertyNodes as prop}
									<label class="prop-list-item">
										<input
											type="checkbox"
											value={prop.id}
											checked={assetLinkedPropertyIds.includes(prop.id)}
											on:change={(e) => toggleLinkedProperty(prop.id, e)}
										/>
										<span class="prop-list-name">{getPropertyDisplayName(prop)}</span>
										<span class="prop-list-type">{prop.nodeType}</span>
									</label>
								{/each}
							</div>
						</div>
						{/if}

					<!-- All property types share these base fields -->
					{:else}
						<div class="field">
							<label for="rp-prop-name" class="field-label">
								Property Name <span class="required">*</span>
							</label>
							<input
								id="rp-prop-name"
								type="text"
								bind:value={propertyName}
								on:input={onNameInput}
								placeholder="temperature"
								autofocus
								class="field-input"
							/>
						</div>
						<div class="field">
							<label for="rp-prop-desc" class="field-label">Description</label>
							<input
								id="rp-prop-desc"
								type="text"
								bind:value={propertyDescription}
								placeholder="Optional description..."
								class="field-input"
							/>
						</div>

						<!-- Property Value (available for all property types) -->
						<div class="field">
							<label for="rp-prop-val" class="field-label">Property Value</label>
							<input
								id="rp-prop-val"
								type="text"
								bind:value={propertyValue}
								placeholder="e.g. 42.5"
								class="field-input"
							/>
						</div>

						<!-- Value Timestamp -->
						<div class="field">
							<label for="rp-prop-ts" class="field-label">Value Timestamp</label>
							<input
								id="rp-prop-ts"
								type="text"
								bind:value={propertyValueTimestamp}
								placeholder="e.g. 2024-01-01T00:00:00Z"
								class="field-input"
							/>
						</div>

						<!-- Shared metadata fields -->
						<div class="field">
							<label for="rp-prop-datatype" class="field-label">Data Type URI</label>
							<UriCombobox
								id="rp-prop-datatype"
								bind:value={propertyDataTypeUri}
								staticItems={dataTypeItems}
								placeholder="urn:samm:org.eclipse.esmf.samm:unit:2.1.0#..."
							/>
						</div>
						<div class="field">
							<label for="rp-prop-unit" class="field-label">Unit URI</label>
							<UriCombobox
								id="rp-prop-unit"
								bind:value={propertyUnitUri}
								staticItems={unitItems}
								searchFn={unitSearchFn}
								placeholder="Search by name, e.g. metre, pascal..."
							/>
						</div>
						<div class="field">
							<label for="rp-prop-semantic" class="field-label">Semantic ID URI</label>
							<input
								id="rp-prop-semantic"
								type="text"
								bind:value={propertySemanticID}
								placeholder="urn:samm:sindit.sintef.no:1.0.0#..."
								class="field-input"
							/>
						</div>

						<!-- Connection dropdown (shown for all property types except PropertyCollection) -->
						{#if selectedNodeType !== 'PropertyCollection'}
							<div class="field">
								<label for="rp-prop-conn" class="field-label">
									Connection{requiresConnection ? '' : ' (optional)'}
									{#if requiresConnection}<span class="required">*</span>{/if}
								</label>
								<select
									id="rp-prop-conn"
									bind:value={propertyConnectionId}
									on:change={onConnectionChange}
									class="field-select"
								>
									<option value="">— None —</option>
									{#each allConnections as conn}
										<option value={conn.id}>{conn.connectionName} ({conn.connectionType})</option>
									{/each}
								</select>
								{#if requiresConnection && !propertyConnectionId}
									<p class="hint-text">A connection is required for this property type.</p>
								{/if}
							</div>
						{/if}

						<!-- PropertyCollection: contained properties checklist -->
						{#if selectedNodeType === 'PropertyCollection' && allPropertyNodes.length > 0}
							<div class="field">
								<span class="field-label">Contained Properties</span>
								<div class="prop-list">
									{#each allPropertyNodes.filter((p) => p.id !== formUri) as prop}
										<label class="prop-list-item">
											<input
												type="checkbox"
												value={prop.id}
												checked={collectionLinkedPropertyIds.includes(prop.id)}
												on:change={(e) => toggleCollectionProperty(prop.id, e)}
											/>
											<span class="prop-list-name">{getPropertyDisplayName(prop)}</span>
											<span class="prop-list-type">{prop.nodeType}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}

						<!-- StreamingProperty: topic + path -->
						{#if selectedNodeType === 'StreamingProperty'}
							<div class="field">
								<label for="rp-stream-topic" class="field-label">
									Streaming Topic <span class="required">*</span>
								</label>
								<input
									id="rp-stream-topic"
									type="text"
									bind:value={streamingTopic}
									placeholder="sensor/temperature"
									class="field-input"
								/>
							</div>
							<div class="field">
								<label for="rp-stream-path" class="field-label">
									Streaming Path <span class="required">*</span>
								</label>
								<input
									id="rp-stream-path"
									type="text"
									bind:value={streamingPath}
									placeholder="$.value"
									class="field-input"
								/>
							</div>
						{/if}

						<!-- DatabaseProperty + TimeseriesProperty: query -->
						{#if selectedNodeType === 'DatabaseProperty' || selectedNodeType === 'TimeseriesProperty'}
							<div class="field">
								<label for="rp-db-query" class="field-label">Query</label>
								<textarea
									id="rp-db-query"
									bind:value={dbQuery}
									placeholder="SELECT * FROM measurement WHERE ..."
									rows="3"
									class="field-textarea"
								></textarea>
							</div>
						{/if}

						<!-- TimeseriesProperty-specific fields -->
						{#if selectedNodeType === 'TimeseriesProperty'}
							<div class="field">
								<label for="rp-ts-method" class="field-label">Retrieval Method</label>
								<input
									id="rp-ts-method"
									type="text"
									bind:value={tsRetrievalMethod}
									placeholder="e.g. last, mean, sum..."
									class="field-input"
								/>
							</div>
							<div class="field">
								<label for="rp-ts-identifiers" class="field-label">TS Identifiers (JSON)</label>
								<textarea
									id="rp-ts-identifiers"
									bind:value={tsIdentifiersJson}
									placeholder={`{"measurement": "sensor_data"}`}
									rows="2"
									class="field-textarea"
								></textarea>
								{#if tsIdentifiersError}<p class="error-hint">{tsIdentifiersError}</p>{/if}
							</div>
							<div class="field">
								<label for="rp-ts-tags" class="field-label">TS Tags (JSON)</label>
								<textarea
									id="rp-ts-tags"
									bind:value={tsTagsJson}
									placeholder={`{"sensor_id": "s01"}`}
									rows="2"
									class="field-textarea"
								></textarea>
								{#if tsTagsError}<p class="error-hint">{tsTagsError}</p>{/if}
							</div>
						{/if}

						<!-- S3ObjectProperty-specific fields -->
						{#if selectedNodeType === 'S3ObjectProperty'}
							<div class="field">
								<label for="rp-s3-bucket" class="field-label">
									Bucket <span class="required">*</span>
								</label>
								<input
									id="rp-s3-bucket"
									type="text"
									bind:value={s3Bucket}
									placeholder="my-bucket"
									class="field-input"
								/>
							</div>
							<div class="field">
								<label for="rp-s3-key" class="field-label">
									Key <span class="required">*</span>
								</label>
								<input
									id="rp-s3-key"
									type="text"
									bind:value={s3Key}
									placeholder="path/to/object.csv"
									class="field-input"
								/>
							</div>
							<div class="field">
								<label for="rp-s3-mode" class="field-label">URL Mode</label>
								<select id="rp-s3-mode" bind:value={s3UrlMode} class="field-select">
									<option value="">— None —</option>
									<option value="upload">Upload</option>
									<option value="download">Download</option>
								</select>
							</div>
						{/if}
					{/if}
				</div>

				<div class="panel-actions">
					<button type="button" on:click={closePanel} class="btn-secondary">Cancel</button>
					{#if $rightPanelState.mode === 'update'}
						<button
							type="button"
							on:click={handleDeleteNode}
							disabled={formSubmitting}
							class="btn-danger"
						>
							{formSubmitting ? 'Deleting…' : 'Delete'}
						</button>
					{/if}
					<button
						type="button"
						on:click={$rightPanelState.mode === 'update' ? handleUpdateNode : handleCreateNode}
						disabled={!isNodeFormValid || formSubmitting}
						class="btn-primary"
					>
						{formSubmitting
							? ($rightPanelState.mode === 'update' ? 'Saving…' : 'Creating…')
							: ($rightPanelState.mode === 'update' ? 'Save Changes' : 'Create Node')}
					</button>
				</div>

			<!-- ---- Relationship Form ---- -->
			{:else if $rightPanelState.type === 'relationship'}
				{#if allNodes.length === 0}
					<p class="empty-hint">No nodes loaded. Load the knowledge graph first.</p>
				{:else}
					<div class="space-y-4">
						<!-- Source Node -->
						<div class="field">
							<label for="rp-rel-source" class="field-label">
								Source Node <span class="required">*</span>
							</label>
							<select id="rp-rel-source" bind:value={relSourceId} class="field-select">
								<option value="">— Select source node —</option>
								{#each allNodes as node}
									<option value={node.id}>{getNodeDisplayName(node)} ({node.nodeType})</option>
								{/each}
							</select>
						</div>

						<!-- Relationship Type -->
						<div class="field">
							<label for="rp-rel-type" class="field-label">
								Relationship Type <span class="required">*</span>
							</label>
							<select id="rp-rel-type" bind:value={relType} class="field-select">
								{#each RELATIONSHIP_OPTIONS as opt}
									<option value={opt.nodeType}>{opt.label}</option>
								{/each}
							</select>
						</div>
						{#if relType === 'AbstractRelationship'}
						<div class="field">
							<label for="rp-rel-custom-type" class="field-label">
								Custom Type <span class="required">*</span>
							</label>
							<input
								id="rp-rel-custom-type"
								type="text"
								bind:value={relCustomType}
								placeholder="e.g. hasParameter, locatedIn…"
								class="field-input"
							/>
						</div>
						{/if}

						<!-- Target Node -->
						<div class="field">
							<label for="rp-rel-target" class="field-label">
								Target Node <span class="required">*</span>
							</label>
							<select id="rp-rel-target" bind:value={relTargetId} class="field-select">
								<option value="">— Select target node —</option>
								{#each allNodes as node}
									<option value={node.id}>{getNodeDisplayName(node)} ({node.nodeType})</option>
								{/each}
							</select>
							{#if relSourceId && relTargetId && relSourceId === relTargetId}
								<p class="error-hint">Source and target must be different.</p>
							{/if}
						</div>

						<!-- Description -->
						<div class="field">
							<label for="rp-rel-desc" class="field-label">Description</label>
							<input
								id="rp-rel-desc"
								type="text"
								bind:value={relDescription}
								placeholder="Optional description..."
								class="field-input"
							/>
						</div>

						<!-- Semantic ID -->
						<div class="field">
							<label for="rp-rel-semantic" class="field-label">Semantic ID (URI)</label>
							<input
								id="rp-rel-semantic"
								type="text"
								bind:value={relSemanticID}
								placeholder="Optional semantic URI..."
								class="field-input"
							/>
						</div>

						<!-- Value -->
						<div class="field">
							<label for="rp-rel-value" class="field-label">Value</label>
							<input
								id="rp-rel-value"
								type="text"
								bind:value={relValue}
								placeholder="Optional value..."
								class="field-input"
							/>
						</div>

						<!-- Unit -->
						<div class="field">
							<label for="rp-rel-unit" class="field-label">Unit</label>
							<UriCombobox
								id="rp-rel-unit"
								bind:value={relUnit}
								staticItems={unitItems}
								searchFn={unitSearchFn}
								placeholder="Search by name, e.g. metre, pascal..."
							/>
						</div>
					</div>

					<div class="panel-actions">
						<button type="button" on:click={closePanel} class="btn-secondary">Cancel</button>
						{#if $rightPanelState.mode === 'update'}
							<button
								type="button"
								on:click={handleDeleteRelationship}
								disabled={relFormSubmitting}
								class="btn-danger"
							>
								{relFormSubmitting ? 'Deleting…' : 'Delete'}
							</button>
						{/if}
						<button
							type="button"
							on:click={$rightPanelState.mode === 'update' ? handleUpdateRelationship : handleCreateRelationship}
							disabled={!isRelFormValid || relFormSubmitting}
							class="btn-primary"
						>
							{relFormSubmitting
								? ($rightPanelState.mode === 'update' ? 'Saving…' : 'Creating…')
								: ($rightPanelState.mode === 'update' ? 'Save Changes' : 'Create Relationship')}
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</aside>
{/if}

<style>
	.right-panel {
		width: 340px;
		min-width: 300px;
		max-width: 400px;
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		border-left: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	:global(.dark) .right-panel {
		background: #1e293b;
		border-left: 1px solid #334155;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid #e5e7eb;
		background: #ffffff;
		min-height: 64px;
		flex-shrink: 0;
	}

	:global(.dark) .panel-header {
		background: #334155;
		border-bottom: 1px solid #374151;
	}

	.panel-title {
		font-size: 16px;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}

	:global(.dark) .panel-title {
		color: #f1f5f9;
	}

	.close-btn {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: #f3f4f6;
		color: #374151;
	}

	:global(.dark) .close-btn {
		color: #94a3b8;
	}

	:global(.dark) .close-btn:hover {
		background: #475569;
		color: #f1f5f9;
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 20px 16px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.space-y-4 {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		font-size: 13px;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .field-label {
		color: #cbd5e1;
	}

	.required {
		color: #ef4444;
	}

	.prop-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 160px;
		overflow-y: auto;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 6px 8px;
		background: #f8fafc;
	}

	:global(.dark) .prop-list {
		background: #1e293b;
		border-color: #334155;
	}

	.prop-list-item {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		padding: 2px 0;
		font-size: 13px;
	}

	.prop-list-name {
		flex: 1;
		color: #1e293b;
	}

	:global(.dark) .prop-list-name {
		color: #f1f5f9;
	}

	.prop-list-type {
		font-size: 11px;
		color: #94a3b8;
	}

	.field-input {
		width: 100%;
		padding: 8px 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		color: #1e293b;
		transition: border-color 0.15s, box-shadow 0.15s;
		outline: none;
		box-sizing: border-box;
	}

	.field-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
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

	.field-select {
		width: 100%;
		padding: 8px 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		color: #1e293b;
		transition: border-color 0.15s;
		outline: none;
		cursor: pointer;
		box-sizing: border-box;
		appearance: auto;
		-webkit-appearance: auto;
	}

	.field-select:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
	}

	:global(.dark) .field-select {
		background: #334155;
		border-color: #475569;
		color: #f1f5f9;
	}

	:global(.dark) .field-select:focus {
		border-color: #60a5fa;
	}

	.panel-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 28px;
	}

	.btn-secondary {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		background: #f1f5f9;
		color: #475569;
		border: none;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-secondary:hover {
		background: #e2e8f0;
	}

	:global(.dark) .btn-secondary {
		background: #334155;
		color: #94a3b8;
	}

	:global(.dark) .btn-secondary:hover {
		background: #475569;
	}

	.btn-primary {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		background: #fee2e2;
		color: #dc2626;
		border: none;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-danger:hover:not(:disabled) {
		background: #fecaca;
	}

	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.dark) .btn-danger {
		background: #450a0a;
		color: #f87171;
	}

	:global(.dark) .btn-danger:hover:not(:disabled) {
		background: #7f1d1d;
	}

	.empty-hint {
		font-size: 14px;
		color: #6b7280;
		text-align: center;
		padding: 32px 0;
	}

	:global(.dark) .empty-hint {
		color: #94a3b8;
	}

	.error-hint {
		font-size: 12px;
		color: #ef4444;
		margin-top: 4px;
	}

	.hint-text {
		font-size: 12px;
		color: #f59e0b;
		margin-top: 4px;
	}

	:global(.dark) .hint-text {
		color: #fbbf24;
	}

	.field-textarea {
		width: 100%;
		padding: 8px 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 13px;
		color: #1e293b;
		font-family: 'Courier New', monospace;
		resize: vertical;
		transition: border-color 0.15s, box-shadow 0.15s;
		outline: none;
		box-sizing: border-box;
	}

	.field-textarea:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
	}

	:global(.dark) .field-textarea {
		background: #334155;
		border-color: #475569;
		color: #f1f5f9;
	}

	:global(.dark) .field-textarea:focus {
		border-color: #60a5fa;
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
	}
</style>
