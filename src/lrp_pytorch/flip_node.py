from utils import *

try:        
    import argparse
except ImportError:
    raise ImportError('<Please Install "argparse" Library! Then Run This Code Again.>')

try:          
    import json
except ImportError:
    raise ImportError('<Please Install "json" library! Then Run This Code Again.>')

def run_forward(image_path, maskedNodes_dict):
    # Load image
    X, mean, std = load_process_image(image_path)  
    # Load model  
    model = torchvision.models.vgg16(pretrained=True); model.eval()
    # Get layers
    i = 0 
    layers = get_layers(model)

    del model

    # mask the corresponding nodes
    i = 0
    for layerID, node_indices_List in maskedNodes_dict.items():
        layerID = int(layerID)
        if layerID < 37:       
            layerToMask = layers[layerID]        
            layers[layerID] = mask_forward_layer(layerToMask, indicesList = node_indices_List)

    # recompute the activations again    
    L = len(layers)  
    A = [X] + [None] * L
    
    
    get_activations(A,X,L,layers)
    out = check_prediction(A)
    print(out, flush = True)


if __name__ == '__main__':

    # Initialize argument parsers
    parser = argparse.ArgumentParser()
    
    # Add arguments
    parser.add_argument('-i', '--input', help = "path of input image", required = True)
    parser.add_argument('-n', '--node', help = "node data path", required = True)

    # Get all arguments
    args = parser.parse_args()

    if args.input and args.node:

        image_path = args.input
        node_path = args.node

        target_class = 483
        with open(node_path, 'r') as f:

            nodes_dict = json.loads(f.read())
            # print(nodes_dict)
            run_forward(image_path, maskedNodes_dict = nodes_dict)