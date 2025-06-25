<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Node from '$lib/components/node.svelte';
	import type { Node as NodeType, VisualizableNode } from '$lib/types';
	import type { Link as LinkType } from '$lib/types';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getLinksState } from '$lib/components/states/links-state.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import Link from '$lib/components/nodes-link.svelte';
	import { createNodeMode, createLinkMode, createConnectionMode, selectedNodes, modalMetadata } from '$lib/stores';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { JSONEditor } from 'svelte-jsoneditor'
	import { modeCurrent } from '@skeletonlabs/skeleton';
	import { backendNodesData } from '$lib/stores'
	import ToolboxSidebar from './ToolboxSidebar.svelte';
	import * as d3 from 'd3';

	// Define types for D3 visualization
	interface D3Node extends d3.SimulationNodeDatum {
		id: string;
		name: string;
		type: string;
		x?: number;
		y?: number;
		position?: { x: number; y: number };
		isPinned?: boolean; // Track if node is deliberately pinned
		description?: string; // For tooltips
	}

	interface D3Link extends d3.SimulationLinkDatum<D3Node> {
		id: string;
		source: string | D3Node;
		target: string | D3Node;
		weight: number;
		label?: string;
	}

	const drawerStore = getDrawerStore();
	const modalStore = getModalStore();

	const zoomSpeed = 0.001;
	const maxZoom = 6;
	const minZoom = 0.01;

	let canvasRef: HTMLCanvasElement;
	let canvasContent: HTMLDivElement;
	let svgContainer: HTMLDivElement; // Add this declaration for the svgContainer
	let initialMousePosition = { x: 0, y: 0 };
	let isMouseDragging = false;
	let zoomLevel = 1;
	let panOffset = { x: 0, y: 0 };

	let nodesState = getNodesState();
	$: visualizableNodes = nodesState.visualizableNodes;
	$: abstractAssetNodes = nodesState.assets; // Keep for backward compatibility

	let linksState = getLinksState();
	$: explicitLinks = linksState.links;

	// Make implicit links reactive to visualizable nodes changes
	$: implicitLinks = $visualizableNodes.length > 0 ? nodesState.generateImplicitLinks() : [];
	$: allLinks = [...$explicitLinks, ...implicitLinks];

	let isCreateNodeMode: boolean;
	let isCreateLinkMode: boolean;
	let isCreateConnectionMode: boolean;
	let createNodeModeMetadata: {toolName: string, operationMode: string};
	let selectedCanvasPosition = { x: 0, y: 0 };
	let selectedNodesIds: string[] = [];
	createNodeMode.subscribe((value) => isCreateNodeMode = value);
	createLinkMode.subscribe((value) => isCreateLinkMode = value);
	createConnectionMode.subscribe((value) => isCreateConnectionMode = value);
	modalMetadata.subscribe((value) => createNodeModeMetadata = value);
	selectedNodes.subscribe((value) => selectedNodesIds = value);

	let isResizing = false;
    let startX: number;
    let pageWidth: number;
    let canvasWidth: number;
    let editorWidth: number;
    let showJSONEditor = true;
    $: content = {
        text: undefined, // can be used to pass a stringified JSON document instead
        json: $backendNodesData,
    }
    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "dark" : "";

    const modalCreateNewAssetNode: ModalSettings = {
        type: 'component',
        component: 'createNewNode',
    };

	const modalCreateNewLink: ModalSettings = {
        type: 'component',
        component: 'createNewLink',
    };

	const modalCreateNewConnection: ModalSettings = {
		type: 'component',
		component: 'createNewConnection',
	};

    export function openModalCreateNewAssetNode(): void {
        modalCreateNewAssetNode.meta = {
			name: createNodeModeMetadata.toolName,
			mode: createNodeModeMetadata.operationMode,
			position: selectedCanvasPosition
		};
        modalStore.trigger(modalCreateNewAssetNode);
    }

	function openModalCreateNewLink(): void {
		modalCreateNewLink.meta = {
			name: 'link',
			mode: 'create'
		};
		modalStore.trigger(modalCreateNewLink);
	}

	function openModalCreateNewConnection(): void {
		modalStore.trigger(modalCreateNewConnection);
	}

	function openToolbox(): void {
		drawerStore.open({ id: 'toolbox' });
	}

	function waitForTwoSelectedNodes(): Promise<string[]> {
		return new Promise((resolve) => {
		const checkCondition = () => {
			if (selectedNodesIds.length === 2) {
				resolve(selectedNodesIds);
			} else {
				requestAnimationFrame(checkCondition);
			}
		};
		checkCondition();
		});
	}

    async function handleCanvasClick(event: MouseEvent): Promise<void> {
		// Handle canvas click event

		const canvas = canvasContent;
		const rect = canvas.getBoundingClientRect();
		// Account for pan offset and zoom level in click position calculation
		const x = ((event.clientX - rect.left - panOffset.x) / zoomLevel);
		const y = ((event.clientY - rect.top - panOffset.y) / zoomLevel);

        if (isCreateNodeMode) {
			// Create a new node

			// Set the clicked canvas position in the store
			selectedCanvasPosition = ({ x, y });

			// Exit node creation mode
			createNodeMode.set(false);

			// Open the modal to create a new node
			openModalCreateNewAssetNode();
		} else if (isCreateLinkMode) {
			const nodes = await waitForTwoSelectedNodes();
			createLinkMode.set(false);
			openModalCreateNewLink();
		} else if (isCreateConnectionMode) {
			createConnectionMode.set(false);
			openModalCreateNewConnection();
		}
		else {return;}
    }

	function handleCanvasDoubleClick(event: MouseEvent): void {
		// Clear the selected nodes
		selectedNodes.set([]);
	}

	function handleMouseWheel(event: WheelEvent): void {
		// Handle zoom in or out
		event.preventDefault();
		const canvas = canvasRef;
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		const mouseOriginX = mouseX / zoomLevel;
		const mouseOriginY = mouseY / zoomLevel;

		const zoomDelta = event.deltaY * zoomSpeed;
		const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + zoomDelta));
		const scaleFactor = newZoomLevel / zoomLevel;

		// Update zoom level
		zoomLevel = newZoomLevel;

		// Apply the zoom transformation
		applyZoom(mouseOriginX, mouseOriginY, scaleFactor);
	}

	function applyZoom(originX: number, originY: number, scaleFactor: number): void {
		const canvas = canvasRef;
		const context = canvas.getContext('2d');

		// Clear the canvas
		context?.clearRect(0, 0, canvas.width, canvas.height);

		// Apply the zoom transformation to the canvas
		context?.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);

		// Apply the combined transform (pan + zoom) to the nodes container
		canvasContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
	}

	function handleMouseDown(event: MouseEvent): void {
		// Save the initial mouse position - start dragging state
		initialMousePosition = { x: event.clientX, y: event.clientY };
		isMouseDragging = true;
	}

	function handleMouseUp(): void {
		// end dragging state
		isMouseDragging = false;
	}

	function handleMouseMove(event: MouseEvent): void {
		// Handle dragging the canvas
		if (!isMouseDragging) return;

		const deltaX = event.clientX - initialMousePosition.x;
		const deltaY = event.clientY - initialMousePosition.y;

		// Update pan offset instead of directly moving nodes
		panOffset.x += deltaX;
		panOffset.y += deltaY;

		// Apply the transform with current pan and zoom
		canvasContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;

		initialMousePosition = { x: event.clientX, y: event.clientY };

		const canvas = canvasRef;
		const context = canvas.getContext('2d');
		context?.clearRect(0, 0, canvas.width, canvas.height);
	}

	// Function to fit graph to view - declared here so it's accessible to button click handlers
	let fitGraphToView = () => {};

	// Function to release all pinned nodes - declared here to be accessible to button click handlers
	let releaseAllPinnedNodes = () => {};

    function handleMouseDownEditorResize(event: MouseEvent) {
        isResizing = true;
        startX = event.clientX;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;
        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
        const pageEl = document.querySelector('.container') as HTMLElement;

        if (editorEl && canvasEl && pageEl) {
            editorWidth = editorEl.clientWidth;
            canvasWidth = canvasEl.offsetWidth;
            pageWidth = pageEl.clientWidth;
        }
    }

    function handleMouseMoveEditorResize(event: MouseEvent) {
        if (!isResizing) return;
        const dx = event.clientX - startX;
        const canvasNewWidth = canvasWidth + dx;
        const editorNewWidth = pageWidth - canvasNewWidth;

        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;

        if (canvasEl && editorEl) {
            canvasEl.style.width = `${canvasNewWidth}px`;
            editorEl.style.width = `${editorNewWidth}px`;
        }
    }

    function handleMouseUpEditorResize() {
        isResizing = false;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;
        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;

        if (editorEl && canvasEl) {
            editorWidth = editorEl.clientWidth;
            canvasWidth = canvasEl.offsetWidth;
        }
    }

    function toggleJSONEditor() {
        showJSONEditor = !showJSONEditor;
        if (!showJSONEditor) {
            const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
            if (canvasEl) {
                canvasEl.style.width = '100%';
            }
        }
    }

	let showToolbox = true;
	let isToolboxCollapsed = false;

	function toggleToolbox() {
		showToolbox = !showToolbox;
	}

	function toggleToolboxCollapsed() {
		isToolboxCollapsed = !isToolboxCollapsed;
	}

	onMount(() => {
		const canvas = canvasRef;
		const context = canvas.getContext('2d');

		// Set the canvas size to match the parent container
		const parent = canvas.parentElement;
		const { width, height } = parent ? parent.getBoundingClientRect() : { width: 100, height: 100 };
		canvas.width = width;
		canvas.height = height;

		// Your canvas drawing code goes here
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('click', handleCanvasClick);
		canvas.addEventListener('dblclick', handleCanvasDoubleClick);
		canvas.addEventListener('wheel', handleMouseWheel);

		// Initialize D3 force simulation
		initializeD3ForceGraph();
	});

	// Initialize D3 force simulation
	function initializeD3ForceGraph() {
		// Define stability tracking variables
		let isStable = false;
		let lastAlpha = 1;
		let stableFrameCount = 0;
		let positionStabilityCount = 0;
		let lastPositions = new Map<string, {x: number, y: number}>();
		let lastUpdateTime = Date.now();
		const MAX_STABLE_FRAMES = 20; // Reduced frames needed to determine stability
		const POSITION_CHANGE_THRESHOLD = 1; // Smaller threshold for position changes (in pixels)
		const UPDATE_THROTTLE = 100; // Minimum ms between store updates			// Create SVG container for the D3 graph
			const svg = d3.select(svgContainer)
				.append('svg')
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('class', 'd3-force-graph');

			// Add tooltip container for node and link interactions
			const tooltip = d3.select(svgContainer)
				.append('div')
				.attr('class', 'graph-tooltip')
				.style('opacity', 0)
				.style('position', 'absolute')
				.style('z-index', '999')
				.style('background', 'rgba(15, 23, 42, 0.9)')
				.style('color', 'white')
				.style('padding', '8px 12px')
				.style('border-radius', '6px')
				.style('font-size', '12px')
				.style('box-shadow', '0 4px 14px rgba(0, 0, 0, 0.3)')
				.style('pointer-events', 'none')
				.style('max-width', '280px')
				.style('transition', 'opacity 0.2s ease');

			// Create container group with zoom behavior
			const g = svg.append('g')
				.attr('class', 'graph-container');

		// Add zoom behavior
		const zoom = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.1, 4]) // Allow zooming between 10% and 400%
			.on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
				g.attr('transform', event.transform.toString());

				// Update zoom level for display
				zoomLevel = event.transform.k;
			})
			.filter(event => {
				// Allow zoom with wheel, and pan with mouse drag
				// Also allow touch events
				return !event.ctrlKey &&
					(event.type === 'wheel' ||
					event.type === 'mousedown' ||
					event.type.startsWith('touch'));
			});

		svg.call(zoom)
			.on('dblclick.zoom', null); // Disable double-click zoom to allow node interaction

		// Create force simulation with optimized parameters
		const containerWidth = svg.node()?.clientWidth || 1000;
		const containerHeight = svg.node()?.clientHeight || 800;

		// Create force simulation with stable parameters
		simulation = d3.forceSimulation<D3Node>()
			.force('link', d3.forceLink<D3Node, D3Link>()
				.id(d => d.id)
				.distance(d => {
					// Dynamic distance based on node types
					const source = d.source as D3Node;
					const target = d.target as D3Node;

					// KG nodes should have more space
					if (source.type === 'kg' || target.type === 'kg') {
						return 400;
					}

					// Asset nodes should have medium space
					if (source.type === 'asset' || target.type === 'asset') {
						return 320;
					}

					// Default for other node types
					return 280;
				})
				.strength(0.45)) // Less strength for more spread out layout
			.force('charge', d3.forceManyBody<D3Node>()
				.strength(d => {
					// Adjust repulsion strength based on node type
					if (d.type === 'kg') return -4000; // Stronger repulsion for Factory KG nodes
					if (d.type === 'asset') return -3500; // Medium repulsion for Asset nodes
					return -3000; // Default repulsion for Property nodes
				})
				.distanceMin(180) // Increased minimum distance for less clustering
				.distanceMax(4000) // Further increased max distance for better spread
				.theta(0.75)) // More accurate force calculation for stability
			.force('center', d3.forceCenter<D3Node>(
				(containerWidth / 2) + 20, // Shift right slightly to center between tools tab and data inspector
				(containerHeight / 2) - 20 // Shift up slightly to account for footer
			).strength(0.06)) // Weaker centering force for more natural spread
			.force('collision', d3.forceCollide<D3Node>()
				.radius(d => {
					// Adjust collision radius based on node type
					if (d.type === 'kg') return 180; // Factory KG nodes (red)
					if (d.type === 'asset') return 160; // Asset nodes (green)
					return 140; // Property nodes (blue)
				})
				.strength(0.9) // Increased strength for better collision avoidance
				.iterations(4)) // More iterations for better collision detection
			.force('x', d3.forceX(d => {
				// Use different target points based on node type to encourage better distribution
				if (d.type === 'kg') return (containerWidth / 2) + 20;
				if (d.type === 'asset') return (containerWidth / 2) + 10;
				return (containerWidth / 2) - 10;
			}).strength(0.03)) // Weaker x-positioning force
			.force('y', d3.forceY(d => {
				// Use different target points based on node type to encourage better distribution
				if (d.type === 'kg') return (containerHeight / 2) - 60;
				if (d.type === 'asset') return (containerHeight / 2) - 30;
				return (containerHeight / 2) - 20;
			}).strength(0.04)) // Slightly stronger y-positioning
			// Critical parameters for stability and performance
			.alphaDecay(0.02) // Faster decay for quicker stabilization
			.velocityDecay(0.45) // More damping for less jitter and faster stabilization
			.alpha(0.3) // Lower initial energy to converge faster
			.alphaMin(0.001) // Lower minimum alpha for better stabilization
			.alphaTarget(0) // No target energy - allow simulation to come to rest
			.stop(); // Start paused - we'll start it manually			// Function to update the graph based on changes to nodes and links
		function updateGraph() {
			// First ensure all nodes have valid positions
			nodesState.ensureNodePositions();
			console.log(`Updating graph with ${$visualizableNodes.length} nodes and ${allLinks.length} links`);

			// Log diagnostic information
			nodesState.logNodePositions();

			// Remove all existing nodes and links
			g.selectAll('.link').remove();
			g.selectAll('.node').remove();

			// Get current nodes and links data
			const nodes: D3Node[] = $visualizableNodes.map(node => {
				// Double-check position is valid (fallback if ensureNodePositions missed something)
				if (!node.position || node.position.x === undefined || node.position.y === undefined) {
					console.warn(`Missing position for node ${node.id}, generating random position`);
					node.position = { x: Math.random() * 800 + 100, y: Math.random() * 600 + 100 };
				}

				return {
					id: node.id,
					name: node.nodeType === 'AbstractAsset' ? node.nodeName :
						node.nodeType === 'SINDITKG' ? node.label :
						node.nodeType === 'StreamingProperty' ? node.propertyName : 'Unknown',
					type: node.nodeType === 'AbstractAsset' ? 'asset' :
						node.nodeType === 'SINDITKG' ? 'kg' :
						node.nodeType === 'StreamingProperty' ? 'property' : 'unknown',
					position: node.position,
					x: node.position.x,
					y: node.position.y,
					isPinned: !!node.fx || !!node.fy, // Track if node was previously pinned
					description: node.nodeType === 'AbstractAsset' ? node.description :
						node.nodeType === 'StreamingProperty' ? node.description :
						node.nodeType === 'SINDITKG' ? `Knowledge Graph - ${node.uri}` : 'No description'
				};
			});

			const links: D3Link[] = allLinks.map(link => ({
				source: link.sourceNodeId,
				target: link.targetNodeId,
				weight: link.linkWeight,
				id: link.id,
				label: link.linkDescription || ''
			}));

			// Create link elements
			const linkElements = g.selectAll<SVGGElement, D3Link>('.link')
				.data(links)
				.enter()
				.append('g')
				.attr('class', 'link');

			// Add wider transparent line first (for easier hovering)
			linkElements.append('line')
				.attr('class', 'link-hover-area')
				.attr('stroke', 'transparent')
				.attr('stroke-width', 10);

			// Add line for each link
			linkElements.append('line')
				.attr('class', 'link-line')
				.attr('stroke', (d: D3Link) => {
					// Enhanced color scheme for links based on weight
					if (d.weight >= 4) return '#3498db'; // Strong links - blue
					if (d.weight >= 3) return '#2ecc71'; // Medium links - green
					if (d.weight >= 2) return '#e67e22'; // Low-medium links - orange
					return '#95a5a680'; // Weak links - semi-transparent gray
				})
				.attr('stroke-opacity', (d: D3Link) => d.weight >= 3 ? 0.85 : 0.7)
				.attr('stroke-width', (d: D3Link) => Math.max(Math.sqrt(d.weight) * 1.2, 1.8))
				.attr('stroke-dasharray', (d: D3Link) => {
					// Different dash patterns based on weight
					if (d.weight < 2) return '3,3';
					if (d.weight < 3) return '5,2';
					return 'none';
				})
				.on('mouseenter', (event: MouseEvent, d: D3Link) => {
					// Show tooltip with link information
					if (isStable) {
						// Get the source and target nodes for display
						const source = typeof d.source === 'string' ?
							nodes.find(n => n.id === d.source) :
							d.source as D3Node;
						const target = typeof d.target === 'string' ?
							nodes.find(n => n.id === d.target) :
							d.target as D3Node;

						// Calculate position - midpoint of the link
						const x = event.offsetX;
						const y = event.offsetY;

						// Show tooltip with link information
						tooltip
							.style('left', `${x + 10}px`)
							.style('top', `${y + 10}px`)
							.html(`
								<div class="tooltip-content">
									<div class="tooltip-title">${d.label || 'Link'}</div>
									<div class="tooltip-body">
										<div><strong>From:</strong> ${source?.name || 'Unknown'}</div>
										<div><strong>To:</strong> ${target?.name || 'Unknown'}</div>
										<div><strong>Strength:</strong> ${d.weight}</div>
									</div>
								</div>
							`)
							.transition()
							.duration(200)
							.style('opacity', 0.95);

						// Highlight the link
						d3.select(event.target as Element)
							.transition()
							.duration(200)
							.attr('stroke-width', Math.max(Math.sqrt(d.weight) * 1.5, 3))
							.attr('stroke-opacity', 1);
					}
				})
				.on('mouseleave', (event: MouseEvent, d: D3Link) => {
					// Hide tooltip
					tooltip
						.transition()
						.duration(200)
						.style('opacity', 0);

					// Return to normal appearance
					d3.select(event.target as Element)
						.transition()
						.duration(200)
						.attr('stroke-width', Math.max(Math.sqrt(d.weight) * 1.2, 1.8))
						.attr('stroke-opacity', d.weight >= 3 ? 0.85 : 0.7);
				});

			// Add link label background (for better readability)
			linkElements.append('rect')
				.attr('class', 'link-label-bg')
				.attr('rx', 4)
				.attr('ry', 4)
				.attr('fill', '#00000090')
				.attr('width', (d: D3Link) => (d.label.length * 6) + 10)
				.attr('height', 18)
				.attr('x', (d: D3Link) => ((d.source as D3Node).x + (d.target as D3Node).x) / 2 - ((d.label.length * 6) / 2) - 5 || 0)
				.attr('y', (d: D3Link) => ((d.source as D3Node).y + (d.target as D3Node).y) / 2 - 15 || 0)
				.attr('opacity', (d: D3Link) => d.label ? 0.7 : 0);

			// Add labels to links (optional)
			linkElements.append('text')
				.attr('class', 'link-label')
				.attr('text-anchor', 'middle')
				.attr('dy', -5)
				.attr('fill', '#ffffff')
				.attr('font-size', '10px')
				.attr('font-weight', (d: D3Link) => d.weight >= 3 ? 'bold' : 'normal')
				.attr('opacity', (d: D3Link) => d.label ? 0.95 : 0)
				.attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))')
				.text((d: D3Link) => d.label || '');

			// Create node elements
			const nodeElements = g.selectAll<SVGGElement, D3Node>('.node')
				.data(nodes)
				.enter()
				.append('g')
				.attr('class', 'node')
				.call(d3.drag<SVGGElement, D3Node>()
					.on('start', dragStarted)
					.on('drag', dragged)
					.on('end', dragEnded))
				.on('click', (event: MouseEvent, d: D3Node) => {
					// Handle node selection
					event.stopPropagation();

					// Check if node is already selected
					const nodeIndex = selectedNodesIds.indexOf(d.id);

					if (event.ctrlKey || event.metaKey) {
						// Multi-select mode
						if (nodeIndex === -1) {
							selectedNodes.set([...selectedNodesIds, d.id]);
						} else {
							const newSelectedNodes = [...selectedNodesIds];
							newSelectedNodes.splice(nodeIndex, 1);
							selectedNodes.set(newSelectedNodes);
						}
					} else {
						// Single select mode
						selectedNodes.set([d.id]);
					}
				})
				// Add hover effects without restarting simulation
				.on('mouseenter', (event: MouseEvent, d: D3Node) => {
					// Only apply hover effects if simulation is stable (not moving)
					if (isStable) {
						// Show tooltip with node information
						tooltip
							.style('left', `${event.offsetX + 10}px`)
							.style('top', `${event.offsetY + 10}px`)
							.html(`
								<div class="tooltip-content">
									<div class="tooltip-title">
										${d.name}
										${d.isPinned ? '<span class="pin-indicator">📌</span>' : ''}
									</div>
									<div class="tooltip-type">${d.type.charAt(0).toUpperCase() + d.type.slice(1)}</div>
									<div class="tooltip-body">
										${d.description || 'No description available'}
									</div>
								</div>
							`)
							.transition()
							.duration(200)
							.style('opacity', 0.95);

						// Use static CSS classes instead of D3 transitions to prevent movement
						d3.select(event.target as Element)
							.select('.node-circle')
							.classed('node-hover', true);

						// Highlight connected nodes and links
						highlightConnections(d.id);
					}
				})
				.on('mouseleave', (event: MouseEvent, d: D3Node) => {
					// Hide tooltip
					tooltip
						.transition()
						.duration(200)
						.style('opacity', 0);

					// Return to normal appearance using class removal
					d3.select(event.target as Element)
						.select('.node-circle')
						.classed('node-hover', false);

					// Remove highlighting
					resetHighlighting();
				})
				// Double-click to pin/unpin nodes
				.on('dblclick', (event: MouseEvent, d: D3Node) => {
					event.stopPropagation(); // Prevent canvas double-click

					// Toggle pinned state
					if (d.fx !== null && d.fy !== null) {
						// If pinned, unpin
						d.fx = null;
						d.fy = null;
						d.isPinned = false;

						// Update appearance to show unpinned state
						d3.select(event.target as Element)
							.select('.pin-indicator')
							.remove();
					} else {
						// If not pinned, pin at current position
						d.fx = d.x;
						d.fy = d.y;
						d.isPinned = true;

						// Update appearance to show pinned state
						d3.select(event.target as Element)
							.append('text')
							.attr('class', 'pin-indicator')
							.attr('text-anchor', 'middle')
							.attr('dy', -28)
							.text('📌')
							.attr('font-size', '14px')
							.attr('fill', '#ffffff')
							.attr('opacity', 0.8)
							.attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))');
					}

					// Update node in store to persist pin state
					if (d.x !== undefined && d.y !== undefined) {
						const nodeUpdate = {
							x: d.x,
							y: d.y,
							fx: d.fx,
							fy: d.fy
						};

						// Update store position
						nodesState.updateNodePosition(d.id, nodeUpdate);
					}
				});

			// Add the main node circle
			nodeElements.append('circle')
				.attr('class', 'node-circle')
				.attr('r', (d: D3Node) => {
					// Size based on node type
					if (d.type === 'kg') return 36;
					if (d.type === 'asset') return 30;
					return 26; // Smaller for properties and other nodes
				})
				.attr('fill', (d: D3Node) => {
					// Color based on node type
					if (d.type === 'kg') return '#e74c3c'; // Red for Factory KG nodes
					if (d.type === 'asset') return '#2ecc71'; // Green for assets
					return '#3498db'; // Blue for property nodes
				})
				.attr('stroke', '#ffffff') // Simple white border
				.attr('stroke-width', (d: D3Node) => selectedNodesIds.includes(d.id) ? 3 : 1.5)
				.attr('stroke-opacity', 0.6);

			// Add pin indicator for pinned nodes
			nodeElements.filter((d: D3Node) => d.isPinned)
				.append('text')
				.attr('class', 'pin-indicator')
				.attr('text-anchor', 'middle')
				.attr('dy', -15) // Position above the node
				.attr('font-size', '14px')
				.text('📌');

			// Add text labels for nodes
			nodeElements.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', 5)
				.text((d: D3Node) => {
					// Truncate long names
					const name = d.name || 'Unnamed';
					return name.length > 15 ? name.substring(0, 13) + '...' : name;
				})
				.attr('fill', '#000000')
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.attr('class', 'node-label')
				// .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))');

			// Update simulation with new nodes and links
			simulation.nodes(nodes);

			// Configure the link force with the current links
			simulation.force<d3.ForceLink<D3Node, D3Link>>('link')
				?.links(links);

			// Reset stability tracking for a fresh start
			isStable = false;
			stableFrameCount = 0;
			positionStabilityCount = 0;
			lastPositions.clear();
			lastAlpha = 1;
			lastUpdateTime = Date.now();

			// Start simulation with moderate alpha for quicker stabilization
			simulation.alpha(0.6).restart();

			// Define the tick function to update positions on each simulation step
			function ticked() {
				const currentAlpha = simulation.alpha();
				const currentTime = Date.now();

				// Check for simulation stability using multiple criteria
				if (!isStable) {
					// Alpha-based stability check (simulation energy is decreasing)
					if (Math.abs(lastAlpha - currentAlpha) < 0.0003) {
						stableFrameCount++;
					} else {
						stableFrameCount = 0;
					}

					// Position-based stability check (nodes aren't moving much)
					let allNodesStable = true;

					// Check if positions have stabilized
					if (nodes.length > 0) {
						for (const node of nodes) {
							if (node.x === undefined || node.y === undefined) continue;

							const lastPos = lastPositions.get(node.id);
							if (lastPos) {
								if (Math.abs(lastPos.x - node.x) > POSITION_CHANGE_THRESHOLD ||
									Math.abs(lastPos.y - node.y) > POSITION_CHANGE_THRESHOLD) {
									allNodesStable = false;
									break;
								}
							} else {
								allNodesStable = false;
							}

							// Update last known position
							lastPositions.set(node.id, { x: node.x, y: node.y });
						}
					} else {
						allNodesStable = false;
					}

					if (allNodesStable) {
						positionStabilityCount++;
					} else {
						positionStabilityCount = 0;
					}

					// Let the simulation run for longer to ensure nodes are visible before stabilizing
					// Only check for stability if we have some nodes to display
					if (nodes.length > 0 &&
					   (stableFrameCount > MAX_STABLE_FRAMES ||
					    positionStabilityCount > MAX_STABLE_FRAMES / 2 ||
						currentAlpha <= simulation.alphaMin())) {

						// Before considering the layout stable, ensure nodes have reasonable positions
						let allNodesVisible = true;
						for (const node of nodes) {
							// Check if any node has invalid or default coordinates
							if (node.x === undefined || node.y === undefined ||
								isNaN(node.x) || isNaN(node.y)) {

								allNodesVisible = false;
								console.warn(`Node ${node.id} has invalid position: x=${node.x}, y=${node.y}`);
								node.x = Math.random() * 800 + 100;
								node.y = Math.random() * 600 + 100;
							}
						}

						if (allNodesVisible) {
							isStable = true;
							console.log("Graph layout stabilized", {
								stableFrames: stableFrameCount,
								positionStability: positionStabilityCount,
								alpha: currentAlpha,
								nodeCount: nodes.length
							});

							// Stop the simulation completely to prevent further updates
							simulation.alpha(0).stop();

							// Do one final position update to the store
							for (const node of nodes) {
								nodesState.updateNodePosition(node.id, { x: node.x!, y: node.y! });
							}

							return; // Skip further updates
						} else {
							// If nodes aren't all visible, restart the simulation
							console.log("Some nodes have invalid positions, continuing simulation");
							stableFrameCount = 0;
							positionStabilityCount = 0;
							simulation.alpha(0.3).restart();
						}
					}

					lastAlpha = currentAlpha;
				}

				// Limit node positions to keep within the visible area with padding that accounts for UI elements
				// Increase padding significantly to ensure nodes stay away from UI elements
				const leftPadding = 280; // Left edge padding for tools tab
				const rightPadding = 350; // Increased right padding for data inspector tab
				const topPadding = 120; // Top edge padding
				const bottomPadding = 180; // Increased bottom padding for footer

				// Get actual dimensions from the container
				const width = svg.node()?.clientWidth || 1000;
				const height = svg.node()?.clientHeight || 800;

				// Calculate node radius based on type for more accurate boundary checking
				const getNodeRadius = (d: D3Node) => {
					if (d.type === 'kg') return 45; // Factory KG nodes (red)
					if (d.type === 'asset') return 38; // Asset nodes (green)
					return 32; // Property nodes (blue)
				};

				// Apply bounds to prevent nodes from going too far off-screen or overlapping with UI elements
				nodes.forEach(d => {
					// Check for invalid positions first and fix them
					if (d.x === undefined || d.y === undefined || isNaN(d.x) || isNaN(d.y)) {
						// Place node in a safe position in the center area
						d.x = (width / 2) + (Math.random() * 200 - 100);
						d.y = (height / 2) + (Math.random() * 200 - 100);
					}

					// Get this node's radius for boundary calculations
					const nodeRadius = getNodeRadius(d);

					// Only bound non-fixed nodes
					if (d.fx === null || d.fy === null) {
						// Apply asymmetric padding plus node radius to ensure even large nodes stay fully within bounds
						d.x = Math.max(leftPadding + nodeRadius, Math.min(width - rightPadding - nodeRadius, d.x));
						d.y = Math.max(topPadding + nodeRadius, Math.min(height - bottomPadding - nodeRadius, d.y));
					}
				});

				// Update all lines (both visible and hover area)
				linkElements.selectAll('.link-line, .link-hover-area')
					.attr('x1', (d: D3Link) => (d.source as D3Node).x || 0)
					.attr('y1', (d: D3Link) => (d.source as D3Node).y || 0)
					.attr('x2', (d: D3Link) => (d.target as D3Node).x || 0)
					.attr('y2', (d: D3Link) => (d.target as D3Node).y || 0);

				// Update text position
				linkElements.selectAll('.link-label')
					.attr('x', (d: D3Link) => ((d.source as D3Node).x + (d.target as D3Node).x) / 2 || 0)
					.attr('y', (d: D3Link) => ((d.source as D3Node).y + (d.target as D3Node).y) / 2 || 0);

				// Update background rectangles for labels
				linkElements.selectAll('.link-label-bg')
					.attr('x', (d: D3Link) => {
						const midX = ((d.source as D3Node).x + (d.target as D3Node).x) / 2;
						const width = (d.label.length * 6) + 10;
						return midX - (width / 2);
					})
					.attr('y', (d: D3Link) => ((d.source as D3Node).y + (d.target as D3Node).y) / 2 - 15);

				// Update node positions
				nodeElements.attr('transform', (d: D3Node) => `translate(${d.x || 0}, ${d.y || 0})`);

				// Only update store positions if:
				// 1. Not yet stable
				// 2. Alpha is low enough (simulation is settling)
				// 3. Enough time has passed since last update (throttling)
				// 4. Positions have changed significantly
				if (!isStable &&
					currentAlpha < 0.3 &&
					(currentTime - lastUpdateTime > UPDATE_THROTTLE)) {

					let positionsChanged = false;

					// Detect if any node has moved significantly
					for (const node of nodes) {
						const index = $visualizableNodes.findIndex(n => n.id === node.id);
						if (index !== -1 && node.x !== undefined && node.y !== undefined) {
							// Only update if position has changed significantly
							if (Math.abs(($visualizableNodes[index].position?.x || 0) - node.x) > 2 ||
								Math.abs(($visualizableNodes[index].position?.y || 0) - node.y) > 2) {
								positionsChanged = true;
								// Using the nodesState methods to update position
								nodesState.updateNodePosition(node.id, { x: node.x, y: node.y });
							}
						}
					}

					if (positionsChanged) {
						lastUpdateTime = currentTime;
					}
				}
			}

			// Register the tick function with the simulation
			simulation.on('tick', ticked);

			// Functions to highlight connections
			function highlightConnections(nodeId: string) {
				// Dim all nodes and links first
				g.selectAll('.node-circle')
					.transition()
					.duration(200)
					.attr('opacity', 0.3);

				g.selectAll('.node-label')
					.transition()
					.duration(200)
					.attr('opacity', 0.3);

				g.selectAll('.link-line')
					.transition()
					.duration(200)
					.attr('opacity', 0.15);

				// Find connected nodes and links
				const connectedNodeIds = new Set<string>();
				connectedNodeIds.add(nodeId); // Include the selected node

				// Find links connected to this node
				const connectedLinks = links.filter(link => {
					const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
					const targetId = typeof link.target === 'string' ? link.target : link.target.id;

					if (sourceId === nodeId || targetId === nodeId) {
						// Add connected nodes to the set
						if (sourceId !== nodeId) connectedNodeIds.add(sourceId);
						if (targetId !== nodeId) connectedNodeIds.add(targetId);
						return true;
					}
					return false;
				});

				// Highlight the connected nodes
				g.selectAll('.node')
					.filter((d: D3Node) => connectedNodeIds.has(d.id))
					.each(function() {
						// Highlight node
						d3.select(this).select('.node-circle')
							.transition()
							.duration(200)
							.attr('opacity', 1);

						// Highlight label
						d3.select(this).select('.node-label')
							.transition()
							.duration(200)
							.attr('opacity', 1)
							.attr('font-weight', 'bold');
					});

				// Highlight the connected links
				g.selectAll('.link')
					.filter((d: D3Link) => {
						const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
						const targetId = typeof d.target === 'string' ? d.target : d.target.id;
						return sourceId === nodeId || targetId === nodeId;
					})
					.each(function() {
						d3.select(this).select('.link-line')
							.transition()
							.duration(200)
							.attr('opacity', 1)
							.attr('stroke-width', (d: D3Link) => Math.max(Math.sqrt(d.weight) * 1.5, 3));

						// Make label visible if there is one
						d3.select(this).select('.link-label')
							.transition()
							.duration(200)
							.attr('opacity', 1);

						d3.select(this).select('.link-label-bg')
							.transition()
							.duration(200)
							.attr('opacity', 0.9);
					});
			}

			// Reset highlighting to normal state
			function resetHighlighting() {
				// Reset all nodes
				g.selectAll('.node-circle')
					.transition()
					.duration(200)
					.attr('opacity', 1);

				g.selectAll('.node-label')
					.transition()
					.duration(200)
					.attr('opacity', 1)
					.attr('font-weight', 'normal');

				// Reset all links
				g.selectAll('.link-line')
					.transition()
					.duration(200)
					.attr('opacity', (d: D3Link) => d.weight >= 3 ? 0.85 : 0.7)
					.attr('stroke-width', (d: D3Link) => Math.max(Math.sqrt(d.weight) * 1.2, 1.8));

				// Reset link labels
				g.selectAll('.link-label')
					.transition()
					.duration(200)
					.attr('opacity', (d: D3Link) => d.label ? 0.95 : 0);

				g.selectAll('.link-label-bg')
					.transition()
					.duration(200)
					.attr('opacity', (d: D3Link) => d.label ? 0.7 : 0);
			}

			// Implementation of releaseAllPinnedNodes for external access
			releaseAllPinnedNodes = () => {
				// Check if simulation exists
				if (!simulation) return;

				// Find pinned nodes
				let hasPinnedNodes = false;

				// Get all nodes from the simulation
				simulation.nodes().forEach(node => {
					if (node.fx !== null || node.fy !== null) {
						// Unpin this node
						node.fx = null;
						node.fy = null;
						node.isPinned = false;
						hasPinnedNodes = true;

						// Also update in store
						nodesState.updateNodePosition(node.id, {
							x: node.x || 0,
							y: node.y || 0,
							fx: null,
							fy: null
						});
					}
				});

				if (hasPinnedNodes) {
					// Remove pin indicators
					g.selectAll('.pin-indicator').remove();

					// Restart simulation briefly to adjust layout
					isStable = false;
					stableFrameCount = 0;
					positionStabilityCount = 0;
					lastPositions.clear();

					// Start the simulation with gentle alpha
					simulation.alpha(0.2).restart();

					// Set a timeout to stabilize
					setTimeout(() => {
						if (!isStable) {
							isStable = true;
							simulation.stop();
							console.log("Forced graph stability after releasing pins");
						}
					}, 1500);
				}
			};
		}

		// Define drag behavior functions
		function dragStarted(event: d3.D3DragEvent<SVGGElement, D3Node, any>, d: D3Node) {
			if (!event.active) simulation.alphaTarget(0.3).restart();

			// If shift is held during drag start, prepare to pin the node
			d.isPinned = event.sourceEvent.shiftKey;
		}

		function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, any>, d: D3Node) {
			// Update node position directly
			d.x = event.x;
			d.y = event.y;

			// If shift is held or node was already pinned, show the pin indicator
			if (event.sourceEvent.shiftKey || d.isPinned) {
				// Add visual indicator that node will be pinned
				const nodeElement = d3.select(event.sourceEvent.target.closest('.node'));

				if (nodeElement.select('.pin-indicator').empty()) {
					nodeElement.append('text')
						.attr('class', 'pin-indicator')
						.attr('text-anchor', 'middle')
						.attr('dy', -15)
						.attr('font-size', '14px')
						.text('📌');
				}
			}
		}

		function dragEnded(event: d3.D3DragEvent<SVGGElement, D3Node, any>, d: D3Node) {
			if (!event.active) simulation.alphaTarget(0);

			// If shift was held during drag or node was already pinned, pin the node
			if (event.sourceEvent.shiftKey || d.isPinned) {
				d.fx = d.x;
				d.fy = d.y;
				d.isPinned = true;

				// Update store with pinned state
				nodesState.updateNodePosition(d.id, {
					x: d.x!,
					y: d.y!,
					fx: d.x,
					fy: d.y
				});
			} else {
				// Just update position without pinning
				nodesState.updateNodePosition(d.id, { x: d.x!, y: d.y! });
			}

			// Additional visual update (in case the simulation doesn't trigger another tick)
			d3.select(event.sourceEvent.target.closest('.node'))
				.attr('transform', `translate(${d.x || 0}, ${d.y || 0})`);
		}

		// Highlighting functions for connected nodes
		function highlightConnections(nodeId: string) {
			// Dim all nodes and links first
			g.selectAll('.node-circle')
				.attr('opacity', 0.3);

			g.selectAll('.link-line')
				.attr('opacity', 0.2);

			// Find all connected links
			const connectedLinks = links.filter(link =>
				link.source === nodeId ||
				(typeof link.source === 'object' && link.source.id === nodeId) ||
				link.target === nodeId ||
				(typeof link.target === 'object' && link.target.id === nodeId)
			);

			// Highlight the source node
			g.selectAll('.node')
				.filter((d: D3Node) => d.id === nodeId)
				.select('.node-circle')
				.attr('opacity', 1);

			// Highlight all connected nodes and links
			connectedLinks.forEach(link => {
				const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
				const targetId = typeof link.target === 'string' ? link.target : link.target.id;

				// Highlight connected nodes
				g.selectAll('.node')
					.filter((d: D3Node) => d.id === sourceId || d.id === targetId)
					.select('.node-circle')
					.attr('opacity', 1);

				// Highlight the link
				g.selectAll('.link-line')
					.filter((d: D3Link) => {
						const dSourceId = typeof d.source === 'string' ? d.source : d.source.id;
						const dTargetId = typeof d.target === 'string' ? d.target : d.target.id;
						return (dSourceId === sourceId && dTargetId === targetId) ||
							   (dSourceId === targetId && dTargetId === sourceId);
					})
					.attr('opacity', 1)
					.attr('stroke-width', (d: D3Link) => Math.max(Math.sqrt(d.weight) * 1.5, 3));
			});
		}

		function resetHighlighting() {
			// Reset all nodes and links to full opacity
			g.selectAll('.node-circle')
				.attr('opacity', 1);

			g.selectAll('.link-line')
				.attr('opacity', 1)
				.attr('stroke-width', (d: D3Link) => Math.max(Math.sqrt(d.weight) * 1.2, 1.8));
		}

		// Initial graph update
		updateGraph();			// Explicitly start the simulation after initial update
		simulation.alpha(0.3).restart(); // Make sure simulation is started

		// Set a failsafe timer to ensure simulation eventually stops
			setTimeout(() => {
				if (!isStable) {
					console.log("Forcing simulation to stop after timeout");
					isStable = true;
					simulation.stop();

					// Do one final position update
					for (const node of nodes) {
						if (node.x !== undefined && node.y !== undefined) {
							nodesState.updateNodePosition(node.id, { x: node.x, y: node.y });
						}
					}
				}
			}, 8000); // 8 seconds max simulation time

		// Function to fit all nodes in view - assign to the outer variable
		fitGraphToView = () => {
			if (!svg.node() || !g.node()) return;

			const containerWidth = svg.node()?.clientWidth || 1000;
			const containerHeight = svg.node()?.clientHeight || 800;

			// Pause the simulation first for more accurate bounds calculation
			const wasRunning = !simulation.alpha() <= simulation.alphaMin();
			const currentAlpha = simulation.alpha();
			simulation.stop();

			// Temporarily reset stability flag for position recalculation
			const wasStable = isStable;

			// Let the UI update before proceeding
			setTimeout(() => {
				// Get the bounds of all nodes
				const nodeElements = g.selectAll('.node');
				if (nodeElements.size() === 0) {
					// If no nodes, restart simulation if it was running
					if (wasRunning) simulation.alpha(currentAlpha).restart();
					return;
				}

				// Calculate bounds - need to transform node positions to get actual coordinates
				let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
				nodeElements.each(function(d: any) {
					const x = d.x || 0;
					const y = d.y || 0;

					minX = Math.min(minX, x);
					maxX = Math.max(maxX, x);
					minY = Math.min(minY, y);
					maxY = Math.max(maxY, y);
				});

				// Add generous padding for better visibility
				const padding = Math.min(containerWidth, containerHeight) * 0.15; // 15% of smaller dimension
				minX -= padding;
				maxX += padding;
				minY -= padding;
				maxY += padding;

				// Calculate the scale to fit all nodes
				const graphWidth = maxX - minX;
				const graphHeight = maxY - minY;

				// Avoid division by zero
				if (graphWidth === 0 || graphHeight === 0) {
					// Restart the simulation if we need to continue
					if (wasRunning) simulation.alpha(currentAlpha).restart();
					return;
				}

				const scaleX = containerWidth / graphWidth;
				const scaleY = containerHeight / graphHeight;
				let scale = Math.min(scaleX, scaleY);

				// Limit scale to reasonable values, but ensure we can see all nodes
				scale = Math.min(Math.max(scale, 0.3), 1.5);

				// Calculate center points
				const centerX = (minX + maxX) / 2;
				const centerY = (minY + maxY) / 2;

				// Apply transform with smoother animation
				svg.transition()
					.duration(1200)
					.ease(d3.easeCubicInOut)
					.call(
						zoom.transform,
						d3.zoomIdentity
							.translate(containerWidth / 2, containerHeight / 2)
							.scale(scale)
							.translate(-centerX, -centerY)
					)
					.on("end", function() {
						// Update the zoom level display
						zoomLevel = scale;

						// Return to previous stability state or force stabilization
						if (!wasStable) {
							// Clear stability tracking for a fresh start
							isStable = false;
							stableFrameCount = 0;
							positionStabilityCount = 0;
							lastPositions.clear();

							// Restart with gentle alpha to settle quickly
							simulation.alpha(0.1).restart();

							// Force stabilization after a short timeout if not stabilized naturally
							setTimeout(() => {
								if (!isStable) {
									isStable = true;
									simulation.stop();
									console.log("Forced graph stability after fit-to-view");

									// Final position update to store
									for (const node of nodes) {
										if (node.x !== undefined && node.y !== undefined) {
											nodesState.updateNodePosition(node.id, { x: node.x, y: node.y });
										}
									}
								}
							}, 1200); // Shorter timeout - visual fit is more important than perfect physics
						} else {
							// If it was already stable, keep it that way
							isStable = true;
							simulation.stop();
						}
					});
			}, 50); // Short delay is enough since we already stopped the simulation
		}

		// Initial fit view to ensure all nodes are visible
		setTimeout(fitGraphToView, 300);

		// Set up reactive update when nodes or links change with debounce
		let updateTimer: ReturnType<typeof setTimeout> | null = null;
		let lastNodeCount = 0;
		let lastLinkCount = 0;
		let nodeUpdateNeeded = true; // Start with true to ensure initial visualization

		unsubscribeNodes = visualizableNodes.subscribe((nodes) => {
			// Force update if we have nodes but none were visualized yet
			if (nodes.length > 0) {
				// Always update when node count changes or when first visualizing
				if (nodes.length !== lastNodeCount || nodeUpdateNeeded) {
					lastNodeCount = nodes.length;
					nodeUpdateNeeded = false;

					// Clear any pending updates
					if (updateTimer) clearTimeout(updateTimer);

					// Debounce updates to prevent multiple rapid re-renders
					updateTimer = setTimeout(() => {
						console.log(`Updating graph due to node changes (${nodes.length} nodes)`);
						isStable = false; // Reset stability to ensure proper layout
						stableFrameCount = 0;
						positionStabilityCount = 0;
						lastPositions.clear(); // Reset position tracking

						updateGraph();
						// Start the simulation explicitly
						simulation.alpha(0.6).restart();

						// Wait for graph to update before fitting to view
						setTimeout(() => {
							fitGraphToView();
							console.log("Graph updated and fit to view");
						}, 300);

						updateTimer = null;
					}, 100);
				}
			}
		});

		unsubscribeLinks = explicitLinks.subscribe((links) => {
			// Only update if link count changed
			if (links.length !== lastLinkCount) {
				lastLinkCount = links.length;

				// Clear any pending updates
				if (updateTimer) clearTimeout(updateTimer);

				// Debounce updates to prevent multiple rapid re-renders
				updateTimer = setTimeout(() => {
					console.log(`Updating graph due to link changes (${links.length} links)`);
					isStable = false; // Reset stability to ensure proper layout

					updateGraph();
					// Start the simulation explicitly
					simulation.alpha(0.3).restart();

					// Wait for graph to update before fitting to view
					setTimeout(fitGraphToView, 300);

					updateTimer = null;
				}, 100);
			}
		});
	}

	// Store for cleanup variables
	let unsubscribeNodes: () => void;
	let unsubscribeLinks: () => void;
	let simulation: d3.Simulation<D3Node, undefined>;

	onDestroy(() => {
		const canvas = canvasRef;
		if (!canvas) return;

		canvas.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		canvas.removeEventListener('click', handleCanvasClick);
		canvas.removeEventListener('dblclick', handleCanvasDoubleClick);
		canvas.removeEventListener('wheel', handleMouseWheel);

		// Clean up D3 subscriptions
		if (unsubscribeNodes) unsubscribeNodes();
		if (unsubscribeLinks) unsubscribeLinks();
		if (simulation) simulation.stop();
	});
</script>

<!-- D3 Force Graph Visualization -->
<div bind:this={svgContainer} class="d3-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 10; pointer-events: all;"></div>

<div class="canvas-page">
    <div class="canvas-layout h-full w-full flex flex-row min-h-0 max-h-full">
        <!-- Toolbox Sidebar -->
        {#if showToolbox}
            <div class="toolbox-sidebar-container flex-shrink-0 h-full min-h-0 flex flex-col">
                <ToolboxSidebar collapsed={isToolboxCollapsed} />
            </div>
        {/if}

        <!-- Main Content Area -->
        <div class="main-columns flex-1 h-full min-h-0 flex flex-row gap-0 max-h-full">
            <!-- Canvas Area -->
            <div class="canvas-scroll flex-1 h-full min-h-0 overflow-hidden max-h-full flex flex-col">
                <!-- Canvas Controls -->
                <div class="canvas-controls">
                    <div class="controls-left">
                        {#if !showToolbox}
                            <button class="control-btn" on:click={toggleToolbox} title="Show Toolbox">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M3 12h18M3 18h18"/>
                                </svg>
                            </button>
                        {/if}
                        <button class="control-btn" on:click={toggleToolboxCollapsed} title={isToolboxCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
                            {#if isToolboxCollapsed}
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            {:else}
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                                </svg>
                            {/if}
                        </button>
                        <!-- <button class="control-btn" title="Fit Graph to View" on:click={fitGraphToView}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </button>
                        <button class="control-btn" title="Release All Pinned Nodes" on:click={releaseAllPinnedNodes}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M16 10V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v6m10 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h2m8 0V8a2 2 0 10-4 0v2h4z"></path>
                            </svg>
                        </button> -->
                        <div class="zoom-display">
                            {Math.round(zoomLevel * 100)}%
                        </div>
                        <div class="node-counts">
                            <span class="count-item">Nodes: {$visualizableNodes.length}</span>
                            <span class="count-item">Links: {allLinks.length}</span>
                        </div>
                    </div>

                    <div class="controls-right">
                        <button class="control-btn" title="Fit Graph to View" on:click={fitGraphToView}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M3 21v-5h5"/>
                            </svg>
                        </button>
                        <!-- <button class="control-btn" on:click={triggerReLayout} title="Re-organize Layout">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <circle cx="15" cy="15" r="2"/>
                                <path d="M9 11l6 4"/>
                            </svg>
                        </button> -->
                        <button class="control-btn" on:click={toggleJSONEditor} title={showJSONEditor ? 'Hide Inspector' : 'Show Inspector'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Canvas Container -->
                <div class="canvas-container h-full min-h-0 relative flex-1">
                    <canvas
                        class="canvas"
                        bind:this={canvasRef}
                        on:wheel={handleMouseWheel}
                        on:mousedown={handleMouseDown}
                        on:mousemove={handleMouseMove}
                        on:mouseup={handleMouseUp}
                        on:click={handleCanvasClick}
                        on:dblclick={handleCanvasDoubleClick}
                    ></canvas>
                    <div class="canvas-content" bind:this={canvasContent}>
                        <!-- Original node and link components are hidden now that we use D3 for rendering -->
                        <!-- We're keeping the structure for backward compatibility -->
                    </div>

                    <!-- Canvas Status -->
                    {#if $visualizableNodes.length === 0}
                        <div class="empty-state">
                            <div class="empty-state-content">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <h3>No nodes yet</h3>
                                <p>Create your first node using the toolbox on the left</p>
                            </div>
                        </div>
                    {/if}

                    <!-- Graph Help Overlay -->
                    <div class="graph-help-overlay">
                        <div class="help-content">
                            <div class="help-item">
                                <span class="help-key">Double-click node</span>
                                <span class="help-desc">Pin/unpin node position</span>
                            </div>
                            <div class="help-item">
                                <span class="help-key">Shift + drag</span>
                                <span class="help-desc">Pin node in new position</span>
                            </div>
                            <div class="help-item">
                                <span class="help-key">Hover</span>
                                <span class="help-desc">View node/link details</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- JSON Editor Panel -->
            {#if showJSONEditor}
                <div class="json-editor-scroll flex-shrink-0 h-full min-h-0 overflow-y-auto max-h-full flex flex-col">
                    <div class="json-editor-container {darkMode} h-full min-h-0 flex flex-col">
                        <div class="json-editor-header">
                            <h3 class="text-sm font-semibold">Data Inspector</h3>
                            <button class="close-btn" on:click={toggleJSONEditor} title="Close Inspector">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div class="json-editor {darkMode} flex-1 min-h-0">
                            <JSONEditor bind:content />
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    @import 'svelte-jsoneditor/themes/jse-theme-dark.css';    /* D3 Force Graph Styles */
    .d3-container {
        width: 100%;
        height: 100%;
        background: transparent;
        pointer-events: all;
    }

    .d3-force-graph {
        width: 100%;
        height: 100%;
        background: transparent;
    }

    :global(.node) {
        cursor: pointer;
    }

    :global(.node-circle) {
        transition: stroke-width 0.2s ease;
    }

    :global(.node-circle.node-hover) {
        filter: brightness(1.1);
        stroke: white;
        stroke-width: 2.5px;
        stroke-opacity: 0.8;
    }

    :global(.node-label) {
        pointer-events: none;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
    }

    :global(.node-type-asset) {
        filter: drop-shadow(0 4px 8px rgba(46, 204, 113, 0.5));
    }

    :global(.node-type-kg) {
        filter: drop-shadow(0 5px 10px rgba(231, 76, 60, 0.6)); /* Red shadow for KG */
    }

    :global(.node-type-property) {
        filter: drop-shadow(0 4px 8px rgba(52, 152, 219, 0.5)); /* Blue shadow for properties */
    }

    :global(.node.selected .node-circle) {
        stroke: #f1c40f;
        stroke-width: 4px;
        filter: brightness(1.2) drop-shadow(0 0 20px rgba(243, 156, 18, 0.8));
    }

    :global(.pin-indicator) {
        pointer-events: none;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    :global(.graph-tooltip) {
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        line-height: 1.4;
    }

    :global(.tooltip-title) {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 4px;
        color: #f8f9fa;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    :global(.tooltip-type) {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    :global(.tooltip-body) {
        font-size: 12px;
        color: #e2e8f0;
    }

    :global(.tooltip-body strong) {
        color: #f8f9fa;
        font-weight: 500;
    }

    :global(.pin-indicator) {
        font-size: 10px;
        margin-left: 6px;
    }

    :global(.link-line) {
        transition: all 0.3s ease;
        stroke-linecap: round;
    }

    :global(.link:hover .link-line) {
        stroke-width: 4px;
        stroke-opacity: 1;
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
    }

    :global(.link:hover .link-label) {
        font-weight: bold;
        opacity: 1;
        font-size: 12px;
        transform: scale(1.1);
    }

    :global(.link:hover .link-label-bg) {
        opacity: 0.9;
    }

    :global(.link-label) {
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 10px;
        pointer-events: none;
        transition: all 0.2s ease;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    :global(.dark) .link-label {
        fill: #f8f9fa;
    }

    :global(.link-hover-area) {
        opacity: 0;
        cursor: pointer;
        stroke-linecap: round;
    }

    .canvas-page {
        position: relative;
        display: flex;
        width: 100%;
        height: 100vh;
        min-height: 0;
        gap: 0;
        margin: 0;
        padding: 0;
        max-height: 100vh;
        background: rgb(248, 250, 252);
    }

    :global(.dark) .canvas-page {
        background: #0f172a;
    }

    .canvas-layout {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        gap: 0;
    }

    .toolbox-sidebar-container {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: none;
        z-index: 20;
        max-height: 100%;
        overflow-y: auto;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .main-columns {
        display: flex;
        flex-direction: row;
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        gap: 0;
        overflow: hidden;
        background: transparent;
    }

    .canvas-scroll {
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* Canvas Controls */
    .canvas-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        min-height: 64px;
        z-index: 10;
    }

    :global(.dark) .canvas-controls {
        background: #334155;
        border-bottom: 1px solid #374151;
    }

    .controls-left,
    .controls-center,
    .controls-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .control-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
    }

    :global(.dark) .control-btn {
        border-color: #475569;
        color: #94a3b8;
    }

    :global(.dark) .control-btn:hover {
        background: #334155;
        border-color: #64748b;
        color: #f1f5f9;
    }

    .zoom-display {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        padding: 4px 8px;
        background: #f3f4f6;
        border-radius: 4px;
        min-width: 50px;
        text-align: center;
    }

    :global(.dark) .zoom-display {
        color: #94a3b8;
        background: #374151;
    }

    .node-counts {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }

    .count-item {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        white-space: nowrap;
        color: #6b7280;
    }

    :global(.dark) .count-item {
        background: rgba(0, 0, 0, 0.2);
        color: #94a3b8;
    }

    .json-editor-scroll {
        width: 380px;
        min-width: 300px;
        max-width: 480px;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        border-left: 1px solid #e5e7eb;
    }

    :global(.dark) .json-editor-scroll {
        border-left: 1px solid #374151;
    }

    .json-editor-container {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: white;
    }

    .json-editor-container.jse-theme-dark {
        background: #1e293b;
        color: white;
    }

    .json-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #ffffff;
        min-height: 64px;
    }

    :global(.dark) .json-editor-header {
        border-bottom: 1px solid #374151;
        background: #334155;
    }

    .json-editor-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin: 0;
    }

    :global(.dark) .json-editor-header h3 {
        color: #f1f5f9;
    }

    .close-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
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

    .json-editor {
        flex: 1;
        min-height: 0;
        background: transparent;
    }

    .canvas-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: rgb(250, 250, 250);
        flex: 1;
    }

    :global(.dark) .canvas-container {
        background: #1a1a1a;
    }

    .canvas {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 0;
        cursor: grab;
    }

    .canvas:active {
        cursor: grabbing;
    }

    .canvas-content {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 1;
        transform-origin: 0 0;
    }

    /* Empty State */
    .empty-state {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
    }

    .empty-state-content {
        text-align: center;
        color: #6b7280;
        max-width: 300px;
    }

    :global(.dark) .empty-state-content {
        color: #94a3b8;
    }

    .empty-state-content svg {
        margin: 0 auto 16px;
        opacity: 0.5;
    }

    .empty-state-content h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #374151;
    }

    :global(.dark) .empty-state-content h3 {
        color: #f1f5f9;
    }

    .empty-state-content p {
        font-size: 14px;
        margin: 0;
        opacity: 0.8;
    }

    /* Help Overlay Styles */
    .graph-help-overlay {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(15, 23, 42, 0.85);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 280px;
        z-index: 5;
        opacity: 0.6;
        transition: opacity 0.2s ease;
    }

    .graph-help-overlay:hover {
        opacity: 1;
    }

    .help-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .help-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .help-key {
        font-size: 12px;
        font-weight: 600;
        color: #f8f9fa;
        background: rgba(255, 255, 255, 0.15);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .help-desc {
        font-size: 12px;
        color: #cbd5e1;
    }
</style>
