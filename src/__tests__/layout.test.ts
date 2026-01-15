import { render } from '@testing-library/svelte';
import { it, expect } from 'vitest';
import Layout from '../routes/+layout.svelte';

it('Layout renders ok', () => {
	const { container } = render(Layout);
	expect(container).toBeTruthy();
});
