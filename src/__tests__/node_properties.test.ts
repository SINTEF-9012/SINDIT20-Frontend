import { render } from '@testing-library/svelte';
import NodeComponent from '$lib/components/node.svelte';
import { describe, test, expect } from 'vitest';

describe('NodeComponent', () => {
  const mockNode = {
    id: 'node-1',
    nodeName: 'Test Node',
    description: 'This is a test node',
    position: { x: 100, y: 100 },
  };

  test('it renders node properties correctly (without properties prop)', async () => {
    const { getByText } = render(NodeComponent, {
      props: {
        node: mockNode, // Only pass node, as properties are loaded internally
        zoomLevel: 1,
      }
    });

    // Ensure node name and description are rendered
    expect(getByText('Test Node')).toBeInTheDocument();
    expect(getByText('This is a test node')).toBeInTheDocument();
  });
});
