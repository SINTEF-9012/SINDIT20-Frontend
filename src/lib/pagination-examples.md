# Pagination Usage Examples

This document demonstrates how to use the pagination utilities in the frontend.

## Available Methods

### 1. Simple: Fetch All Pages Automatically

Use `getAllNodes()` or `getAllNodesByClass()` when you want to fetch all data at once:

```typescript
import { getAllNodes, getAllNodesByClass } from '$apis/sindit-backend/kg';

// Fetch all nodes
const allNodes = await getAllNodes();

// Fetch all nodes of a specific type
const allAssets = await getAllNodesByClass('http://example.org/Asset');

// With custom depth and page size
const allNodesDetailed = await getAllNodes(2, 50); // depth=2, pageSize=50
```

**Best for:**
- Loading workspace data on initial load
- Exporting/processing all data
- Small to medium datasets (< 1000 items)

---

### 2. Manual Pagination with UI Controls

Use `PaginationController` when you want user-controlled pagination:

```svelte
<script lang="ts">
    import { getNodes } from '$apis/sindit-backend/kg';
    import { PaginationController } from '$lib/pagination';
    import PaginationComponent from '$lib/components/pagination.svelte';
    import { onMount } from 'svelte';

    let nodes = [];
    let controller = new PaginationController(getNodes, { 
        pageSize: 20,
        depth: 1 
    });

    onMount(async () => {
        // Load first page
        const firstPage = await controller.loadNextPage();
        nodes = [...controller.getItems()];
    });

    async function loadMore() {
        await controller.loadNextPage();
        nodes = [...controller.getItems()];
    }

    async function loadAll() {
        await controller.loadAll();
        nodes = [...controller.getItems()];
    }

    $: paginationState = controller.getState();
</script>

<div>
    {#each nodes as node}
        <div>{node.label}</div>
    {/each}

    <PaginationComponent 
        state={paginationState}
        onLoadMore={loadMore}
        onLoadAll={loadAll}
    />
</div>
```

**Best for:**
- Large datasets (> 1000 items)
- Tables or lists with "Load More" buttons
- Infinite scroll implementations

---

### 3. Using Raw Pagination Functions

For more control, use the base functions directly:

```typescript
import { getNodes, getNodesByClass } from '$apis/sindit-backend/kg';

// Fetch specific page
const page1 = await getNodes(1, 0, 20);    // depth=1, skip=0, limit=20
const page2 = await getNodes(1, 20, 20);   // depth=1, skip=20, limit=20

// Fetch nodes by class with pagination
const assets = await getNodesByClass('http://example.org/Asset', 1, 0, 50);
```

**Best for:**
- Custom pagination logic
- Integration with external state management
- Special use cases

---

## Infinite Scroll Example

```svelte
<script lang="ts">
    import { getNodes } from '$apis/sindit-backend/kg';
    import { PaginationController } from '$lib/pagination';
    import { onMount } from 'svelte';

    let nodes = [];
    let controller = new PaginationController(getNodes, { pageSize: 30 });
    let scrollContainer: HTMLElement;

    onMount(async () => {
        await controller.loadNextPage();
        nodes = [...controller.getItems()];
    });

    function handleScroll() {
        if (!scrollContainer) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more when 80% scrolled
        if (scrollPercentage > 0.8 && !controller.getState().isLoading && controller.getState().hasMore) {
            loadMore();
        }
    }

    async function loadMore() {
        await controller.loadNextPage();
        nodes = [...controller.getItems()];
    }
</script>

<div 
    bind:this={scrollContainer}
    on:scroll={handleScroll}
    class="h-screen overflow-y-auto"
>
    {#each nodes as node}
        <div>{node.label}</div>
    {/each}

    {#if controller.getState().isLoading}
        <div class="text-center p-4">Loading more...</div>
    {/if}
</div>
```

---

## Migration Guide

### Before (No Pagination)

```typescript
import { getNodes } from '$apis/sindit-backend/kg';

const nodes = await getNodes();
```

### After (With Pagination)

**Option A: Fetch All (Recommended for most cases)**
```typescript
import { getAllNodes } from '$apis/sindit-backend/kg';

const nodes = await getAllNodes(); // Automatically handles pagination
```

**Option B: Manual Pagination**
```typescript
import { getNodes } from '$apis/sindit-backend/kg';
import { PaginationController } from '$lib/pagination';

const controller = new PaginationController(getNodes, { pageSize: 50 });
await controller.loadAll();
const nodes = controller.getItems();
```

---

## Error Handling

All pagination functions automatically handle 401 errors via the `authenticatedFetch` wrapper.

For other errors, wrap in try-catch:

```typescript
try {
    const nodes = await getAllNodes();
} catch (error) {
    if (error.message === 'NOT_AUTHENTICATED') {
        // User will be redirected to login automatically
    } else {
        console.error('Failed to load nodes:', error);
    }
}
```

---

## Performance Tips

1. **Use appropriate page sizes:**
   - Small UI lists: 20-50 items
   - Background loading: 100-200 items
   - Bulk operations: 500+ items

2. **Choose the right depth:**
   - `depth=1` for basic info (faster)
   - `depth=2+` for detailed relations (slower)

3. **Use `getAllNodes()` sparingly:**
   - Good for initial workspace load
   - Not recommended for frequently refreshed data

4. **Prefer manual pagination for large datasets:**
   - Gives users control
   - Better UX with loading indicators
