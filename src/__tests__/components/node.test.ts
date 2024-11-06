import { describe, it, beforeEach, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Layout from '../../routes/+layout.svelte';
import Node from '$lib/components/node.svelte';

describe('Node component', () => {
    let container;

    beforeEach(() => {
        const layoutRender = render(Layout);
        container = layoutRender.container;
    });

    //TODO: implement tests for Node component
    it('notest', () => {
        expect(true).toBe(true);
    });
});
