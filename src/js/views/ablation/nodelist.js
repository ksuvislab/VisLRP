let node_list = {};

// Initialize node_list
export default function ()
{
    initialize();
}

// Reset node list object
function initialize()
{
    node_list = {};
}

// This need some logic
export function add_node(layer_id, node_id)
{
    if (node_list[layer_id].indexOf(node_id) === -1) {
        node_list[layer_id].push(node_id);
    };

    return;
}

// Remove node
export function remove_node(layer_id, node_id)
{
    return node_list[layer_id].splice(node_list[layer_id].indexOf(node_id), 1);
}

// Add new layer to node_list
export function add_layer(layer_id)
{
    return node_list[layer_id] = [];
}

// Remove specific layer from node list
export function remove_layer(layer_id)
{
    return delete node_list[layer_id];
}

export function get_node_list()
{
    return node_list;
}
