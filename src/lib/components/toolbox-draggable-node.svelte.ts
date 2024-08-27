export function createToolboxDraggableNode(node, data) {
    let state = data;

    node.draggable = true;
    node.style.cursor = 'grab';
}
