/**
 * Pagination utilities for handling paginated API responses
 */

export interface PaginationOptions {
    depth?: number;
    skip?: number;
    limit?: number;
}

export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number | null;
    hasMore: boolean;
    isLoading: boolean;
}

/**
 * Fetch all items by repeatedly calling a paginated API endpoint
 * until no more items are returned.
 *
 * @param fetchFn - Function that fetches a page of items
 * @param depth - Depth parameter for queries
 * @param pageSize - Number of items per page (default: 100)
 * @returns Array of all items
 */
export async function fetchAllPages<T>(
    fetchFn: (depth: number, skip: number, limit: number) => Promise<T[]>,
    depth: number = 1,
    pageSize: number = 100
): Promise<T[]> {
    const allItems: T[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const items = await fetchFn(depth, skip, pageSize);

        if (items.length === 0) {
            hasMore = false;
        } else {
            allItems.push(...items);
            skip += items.length;

            // If we got fewer items than the page size, we've reached the end
            if (items.length < pageSize) {
                hasMore = false;
            }
        }
    }

    return allItems;
}

/**
 * Create a pagination controller for managing paginated data fetching
 */
export class PaginationController<T> {
    private items: T[] = [];
    private currentPage: number = 0;
    private pageSize: number;
    private depth: number;
    private hasMore: boolean = true;
    private isLoading: boolean = false;
    private fetchFn: (depth: number, skip: number, limit: number) => Promise<T[]>;

    constructor(
        fetchFn: (depth: number, skip: number, limit: number) => Promise<T[]>,
        options: { pageSize?: number; depth?: number } = {}
    ) {
        this.fetchFn = fetchFn;
        this.pageSize = options.pageSize ?? 20;
        this.depth = options.depth ?? 1;
    }

    /**
     * Load the next page of items
     */
    async loadNextPage(): Promise<T[]> {
        if (this.isLoading || !this.hasMore) {
            return [];
        }

        this.isLoading = true;
        try {
            const skip = this.currentPage * this.pageSize;
            const newItems = await this.fetchFn(this.depth, skip, this.pageSize);

            if (newItems.length === 0 || newItems.length < this.pageSize) {
                this.hasMore = false;
            }

            this.items.push(...newItems);
            this.currentPage++;

            return newItems;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load all remaining pages
     */
    async loadAll(): Promise<T[]> {
        while (this.hasMore && !this.isLoading) {
            await this.loadNextPage();
        }
        return this.items;
    }

    /**
     * Reset pagination to initial state
     */
    reset(): void {
        this.items = [];
        this.currentPage = 0;
        this.hasMore = true;
        this.isLoading = false;
    }

    /**
     * Get all currently loaded items
     */
    getItems(): T[] {
        return this.items;
    }

    /**
     * Get pagination state
     */
    getState(): PaginationState {
        return {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalItems: this.items.length,
            hasMore: this.hasMore,
            isLoading: this.isLoading,
        };
    }
}

/**
 * Fetch items with retry logic for handling transient failures
 */
export async function fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetchFn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on authentication errors
            if (lastError.message === 'NOT_AUTHENTICATED') {
                throw lastError;
            }

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
            }
        }
    }

    throw lastError || new Error('Failed after retries');
}
