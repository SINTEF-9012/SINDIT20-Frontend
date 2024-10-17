import { render } from '@testing-library/svelte';
import { it, expect } from 'vitest';
import Component from '$lib/components/toast.svelte';
import type { Toast } from '$lib/types';


it('Toasts', () => {

    const toast: Toast = {
        id: '1',
        title: 'Title',
        message: 'Message',
        logLevel: 'info',
    };

    const { getByText } = render(Component, {props: {toast}});

    expect(
        getByText('Close toast'),
        getByText(toast.title),
        getByText(toast.message),
    )
});
