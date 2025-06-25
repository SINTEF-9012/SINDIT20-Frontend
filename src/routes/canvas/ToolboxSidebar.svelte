<script lang="ts">
import {
    PlusCircleIcon,
    LinkIcon,
    GitBranchIcon,
    ChevronRightIcon,
    SearchIcon,
    DatabaseIcon,
    ActivityIcon
} from 'svelte-feather-icons';
import { getToastState } from "$lib/components/states/toast-state.svelte";
import { getNodesState } from "$lib/components/states/nodes-state.svelte";
import { getLinksState } from "$lib/components/states/links-state.svelte";
import {
    createNodeMode,
    createLinkMode,
    createConnectionMode,
    modalMetadata,
    selectedNodes
} from "$lib/stores";

export let collapsed = false;

const toastState = getToastState();
const nodesState = getNodesState();
const linksState = getLinksState();
const tools = ["node", "link", "connection"];

// Section expansion state
let expandedSections = {
    create: true,
    browse: false,
    stats: false
};

// Search and browse state
let searchTerm = '';
let showAllNodes = false;
let showAllLinks = false;
let selectedNodeIds: string[] = [];

// Reactive data
$: abstractAssetNodes = nodesState.assets;
$: links = linksState.links;
$: totalNodes = $abstractAssetNodes.length;
$: totalLinks = $links.length;
$: selectedNodesCount = selectedNodeIds.length;

// Search functionality
$: filteredNodes = $abstractAssetNodes.filter(node =>
    !searchTerm ||
    (node.nodeName && node.nodeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (node.id && node.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (node.nodeType && node.nodeType.toLowerCase().includes(searchTerm.toLowerCase()))
);

$: filteredLinks = $links.filter(link =>
    !searchTerm ||
    (link.linkDescription && link.linkDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (link.id && link.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (link.sourceNodeId && link.sourceNodeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (link.targetNodeId && link.targetNodeId.toLowerCase().includes(searchTerm.toLowerCase()))
);

$: displayedNodes = showAllNodes ? filteredNodes : filteredNodes.slice(0, 5);
$: displayedLinks = showAllLinks ? filteredLinks : filteredLinks.slice(0, 3);
$: hasMoreNodes = filteredNodes.length > 5;
$: hasMoreLinks = filteredLinks.length > 3;

// Subscribe to selected nodes store
selectedNodes.subscribe((nodes) => {
    selectedNodeIds = nodes;
});

function toggleSection(section: keyof typeof expandedSections) {
    expandedSections[section] = !expandedSections[section];
}

function selectNode(nodeId: string) {
    if (selectedNodeIds.includes(nodeId)) {
        selectedNodeIds = selectedNodeIds.filter(id => id !== nodeId);
    } else {
        selectedNodeIds = [...selectedNodeIds, nodeId];
    }
    selectedNodes.set(selectedNodeIds);
}

function enterNodeCreationMode() {
    modalMetadata.set({toolName: tools[0], operationMode: 'create'});
    createNodeMode.set(true);
    toastState.add('Create new node', 'Click on the canvas to create a new node.', 'info');
}

function enterLinkCreationMode() {
    modalMetadata.set({toolName: tools[1], operationMode: 'create'});
    createLinkMode.set(true);
    toastState.add('Create new link', 'Select two nodes to create a new link', 'info');
}

function enterConnectionCreationMode() {
    modalMetadata.set({toolName: tools[2], operationMode: 'create'});
    createConnectionMode.set(true);
}
</script>

<div class="toolbox-sidebar h-full flex flex-col max-h-full" class:collapsed={collapsed}>
    {#if !collapsed}
        <header class="toolbox-header">
            <h2 class="toolbox-title">Tools</h2>
        </header>

        <main class="toolbox-content">
            <!-- Create Tools Section -->
            <div class="section">
                <button class="section-header" on:click={() => toggleSection('create')}>
                    <span class="section-title">Create</span>
                    <ChevronRightIcon size="14" class="chevron {expandedSections.create ? 'expanded' : ''}" />
                </button>

                {#if expandedSections.create}
                    <div class="tools-list">
                        <button class="tool-item" on:click={enterNodeCreationMode}>
                            <div class="tool-icon">
                                <PlusCircleIcon size="18" />
                            </div>
                            <div class="tool-details">
                                <span class="tool-name">Create Node</span>
                                <span class="tool-count">Click to add</span>
                            </div>
                        </button>

                        <button class="tool-item" on:click={enterLinkCreationMode}>
                            <div class="tool-icon">
                                <LinkIcon size="18" />
                            </div>
                            <div class="tool-details">
                                <span class="tool-name">Create Link</span>
                                <span class="tool-count">Select 2 nodes</span>
                            </div>
                        </button>

                        <button class="tool-item" on:click={enterConnectionCreationMode}>
                            <div class="tool-icon">
                                <GitBranchIcon size="18" />
                            </div>
                            <div class="tool-details">
                                <span class="tool-name">Create Connection</span>
                                <span class="tool-count">New connection</span>
                            </div>
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Browse Section -->
            <div class="section">
                <button class="section-header" on:click={() => toggleSection('browse')}>
                    <span class="section-title">Browse</span>
                    <ChevronRightIcon size="14" class="chevron {expandedSections.browse ? 'expanded' : ''}" />
                </button>

                {#if expandedSections.browse}
                    <!-- Search -->
                    <div class="search-container">
                        <div class="search-input-wrapper">
                            <SearchIcon size="16" class="search-icon" />
                            <input
                                type="text"
                                placeholder="Search nodes and links..."
                                bind:value={searchTerm}
                                class="search-input"
                            />
                        </div>
                    </div>

                    <!-- Nodes List -->
                    <div class="browse-section">
                        <div class="browse-header">
                            <span class="browse-title">Nodes ({filteredNodes.length})</span>
                        </div>
                        <div class="browse-list">
                            {#each displayedNodes as node (node.id)}
                                <div class="browse-item">
                                    <button
                                        class="browse-item-button"
                                        class:selected={selectedNodeIds.includes(node.id)}
                                        on:click={() => selectNode(node.id)}
                                    >
                                        <div class="browse-icon">
                                            <DatabaseIcon size="14" />
                                        </div>
                                        <div class="browse-details">
                                            <span class="browse-name">{node.nodeName || node.id}</span>
                                            <span class="browse-type">{node.nodeType || 'Node'}</span>
                                        </div>
                                    </button>
                                </div>
                            {/each}
                            {#if hasMoreNodes && !showAllNodes}
                                <button
                                    class="browse-more-button"
                                    on:click={() => showAllNodes = true}
                                >
                                    +{filteredNodes.length - 5} more nodes
                                </button>
                            {/if}
                            {#if showAllNodes && hasMoreNodes}
                                <button
                                    class="browse-more-button"
                                    on:click={() => showAllNodes = false}
                                >
                                    Show less
                                </button>
                            {/if}
                            {#if filteredNodes.length === 0 && searchTerm}
                                <div class="no-results">No nodes found</div>
                            {/if}
                        </div>
                    </div>

                    <!-- Links List -->
                    <div class="browse-section">
                        <div class="browse-header">
                            <span class="browse-title">Links ({filteredLinks.length})</span>
                        </div>
                        <div class="browse-list">
                            {#each displayedLinks as link (link.id)}
                                <div class="browse-item">
                                    <div class="browse-item-button">
                                        <div class="browse-icon">
                                            <LinkIcon size="14" />
                                        </div>
                                        <div class="browse-details">
                                            <span class="browse-name">{link.linkDescription || link.id}</span>
                                            <span class="browse-type">{link.sourceNodeId} → {link.targetNodeId}</span>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            {#if hasMoreLinks && !showAllLinks}
                                <button
                                    class="browse-more-button"
                                    on:click={() => showAllLinks = true}
                                >
                                    +{filteredLinks.length - 3} more links
                                </button>
                            {/if}
                            {#if showAllLinks && hasMoreLinks}
                                <button
                                    class="browse-more-button"
                                    on:click={() => showAllLinks = false}
                                >
                                    Show less
                                </button>
                            {/if}
                            {#if filteredLinks.length === 0 && searchTerm}
                                <div class="no-results">No links found</div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Statistics Section -->
            <div class="section">
                <button class="section-header" on:click={() => toggleSection('stats')}>
                    <span class="section-title">Statistics</span>
                    <ChevronRightIcon size="14" class="chevron {expandedSections.stats ? 'expanded' : ''}" />
                </button>

                {#if expandedSections.stats}
                    <div class="stats-container">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <DatabaseIcon size="16" />
                            </div>
                            <div class="stat-details">
                                <span class="stat-value">{totalNodes}</span>
                                <span class="stat-label">Total Nodes</span>
                            </div>
                        </div>

                        <div class="stat-item">
                            <div class="stat-icon">
                                <LinkIcon size="16" />
                            </div>
                            <div class="stat-details">
                                <span class="stat-value">{totalLinks}</span>
                                <span class="stat-label">Total Links</span>
                            </div>
                        </div>

                        <div class="stat-item">
                            <div class="stat-icon">
                                <ActivityIcon size="16" />
                            </div>
                            <div class="stat-details">
                                <span class="stat-value">{selectedNodesCount}</span>
                                <span class="stat-label">Selected</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </main>
    {:else}
        <!-- Collapsed state - only show icons -->
        <div class="tools-list-collapsed">
            <button
                class="tool-item-collapsed"
                on:click={enterNodeCreationMode}
                title="Create Node"
            >
                <PlusCircleIcon size="18" />
            </button>

            <button
                class="tool-item-collapsed"
                on:click={enterLinkCreationMode}
                title="Create Link"
            >
                <LinkIcon size="18" />
            </button>

            <button
                class="tool-item-collapsed"
                on:click={enterConnectionCreationMode}
                title="Create Connection"
            >
                <GitBranchIcon size="18" />
            </button>
        </div>
    {/if}
</div>

<style>
.toolbox-sidebar {
    background: white;
    border-right: 1px solid #e5e7eb;
    transition: all 0.3s ease;
    position: relative;
    width: 280px;
    min-width: 280px;
}

.toolbox-sidebar.collapsed {
    width: 60px;
    min-width: 60px;
}

:global(.dark) .toolbox-sidebar {
    background: #1e293b;
    border-right: 1px solid #334155;
}

.toolbox-header {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
    min-height: 64px;
    display: flex;
    align-items: center;
}

:global(.dark) .toolbox-header {
    border-bottom: 1px solid #374151;
    background: #334155;
}

.toolbox-title {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

:global(.dark) .toolbox-title {
    color: #f1f5f9;
}

.toolbox-content {
    padding: 0;
    overflow-y: auto;
    flex: 1;
}

.section {
    border-bottom: 1px solid #f3f4f6;
}

:global(.dark) .section {
    border-bottom: 1px solid #334155;
}

.section-header {
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #374151;
}

.section-header:hover {
    background: #f9fafb;
}

:global(.dark) .section-header {
    color: #f1f5f9;
}

:global(.dark) .section-header:hover {
    background: #334155;
}

.section-title {
    font-size: 14px;
    font-weight: 500;
}

:global(.chevron) {
    transition: transform 0.2s ease;
    color: #9ca3af;
}

:global(.chevron.expanded) {
    transform: rotate(90deg);
}

.tools-list {
    padding: 8px 12px 16px;
}

.tool-item {
    width: 100%;
    padding: 12px;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 8px;
    text-align: left;
}

.tool-item:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

:global(.dark) .tool-item {
    border-color: #475569;
}

:global(.dark) .tool-item:hover {
    background: #334155;
    border-color: #64748b;
}

.tool-icon {
    width: 32px;
    height: 32px;
    background: #f3f4f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
}

:global(.dark) .tool-icon {
    background: #475569;
    color: #94a3b8;
}

.tool-details {
    flex: 1;
}

.tool-name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 2px;
}

:global(.dark) .tool-name {
    color: #f1f5f9;
}

.tool-count {
    display: block;
    font-size: 11px;
    color: #6b7280;
}

:global(.dark) .tool-count {
    color: #94a3b8;
}

.search-container {
    padding: 12px;
}

.search-input-wrapper {
    position: relative;
}

:global(.search-icon) {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
}

.search-input {
    width: 100%;
    padding: 8px 12px 8px 34px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    background: white;
    color: #374151;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:global(.dark) .search-input {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
}

:global(.dark) .search-input:focus {
    border-color: #60a5fa;
}

.browse-section {
    padding: 0 12px 12px;
}

.browse-header {
    padding: 8px 0 6px;
}

.browse-title {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

:global(.dark) .browse-title {
    color: #94a3b8;
}

.browse-list {
    max-height: 200px;
    overflow-y: auto;
}

.browse-item {
    margin-bottom: 4px;
}

.browse-item-button {
    width: 100%;
    padding: 8px 10px;
    background: none;
    border: 1px solid transparent;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
}

.browse-item-button:hover {
    background: #f9fafb;
    border-color: #e5e7eb;
}

.browse-item-button.selected {
    background: #eff6ff;
    border-color: #3b82f6;
}

:global(.dark) .browse-item-button:hover {
    background: #334155;
    border-color: #475569;
}

:global(.dark) .browse-item-button.selected {
    background: #1e3a8a;
    border-color: #3b82f6;
}

.browse-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
}

:global(.dark) .browse-icon {
    color: #94a3b8;
}

.browse-details {
    flex: 1;
    min-width: 0;
}

.browse-name {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:global(.dark) .browse-name {
    color: #f1f5f9;
}

.browse-type {
    display: block;
    font-size: 10px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:global(.dark) .browse-type {
    color: #94a3b8;
}

.browse-more-button {
    width: 100%;
    padding: 6px 10px;
    background: none;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    font-size: 11px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 4px;
}

.browse-more-button:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
}

:global(.dark) .browse-more-button {
    border-color: #475569;
    color: #94a3b8;
}

:global(.dark) .browse-more-button:hover {
    background: #334155;
    color: #f1f5f9;
}

.no-results {
    padding: 12px 10px;
    text-align: center;
    font-size: 11px;
    color: #9ca3af;
    font-style: italic;
}

:global(.dark) .no-results {
    color: #64748b;
}

.stats-container {
    padding: 8px 12px 16px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
}

.stat-icon {
    width: 24px;
    height: 24px;
    background: #f3f4f6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
}

:global(.dark) .stat-icon {
    background: #475569;
    color: #94a3b8;
}

.stat-details {
    flex: 1;
}

.stat-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
}

:global(.dark) .stat-value {
    color: #f1f5f9;
}

.stat-label {
    display: block;
    font-size: 11px;
    color: #6b7280;
}

:global(.dark) .stat-label {
    color: #94a3b8;
}

.tools-list-collapsed {
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
}

.tool-item-collapsed {
    width: 44px;
    height: 44px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
}

.tool-item-collapsed:hover {
    background: white;
    border-color: #d1d5db;
    color: #374151;
}

:global(.dark) .tool-item-collapsed {
    background: #334155;
    border-color: #475569;
    color: #94a3b8;
}

:global(.dark) .tool-item-collapsed:hover {
    background: #475569;
    color: #f1f5f9;
}
</style>
