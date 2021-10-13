from utils import *

def run_forward(image_path, maskedNodes_dict):
    log_file_path = 'history.log'
    logging.basicConfig(filename=log_file_path,level=logging.DEBUG, format="%(asctime)s:%(levelname)s:%(message)s")

    X, mean, std = load_process_image(image_path)


    # ########## for model #################
    layers = load_layers('vgg16')

    # mask the corresponding nodes
    if isinstance(maskedNodes_dict, dict):
        for layerID, node_indices_List in maskedNodes_dict.items():

            if layerID < len(layers):
                layerToMask = layers[layerID]
                layers[layerID] = mask_forward_layer(layerToMask, indicesList = node_indices_List)


    # ########## for activation #################
    # case when the Activation has been existing then skip run_forward and load A
    A = []
    initialize = True

    if os.path.isfile(log_file_path) and os.stat(log_file_path).st_size != 0:
        log = logging.getLogger(log_file_path)
        with open(log_file_path, "r") as file:

            for line in file:
                pass

            if line.split(":")[-1].rstrip('\n') == image_path.rstrip('\n'):
                ## if the Activation has been existing then skip run_forward
                folderName = "intermediate_tensorA"

                if os.path.isdir(folderName) and (len(os.listdir(folderName)) -1) == len(layers):
                    L = len(os.listdir(folderName))
                    A = [None] * L
                    for file in os.listdir(folderName):
                        torchFileName = 'intermediate_tensorA/' + file
                        torchFile = open(torchFileName, 'rb')
                        tmp = file.split(".")[0]
                        l = int(tmp.split("_")[-1])
                        A[l] = torch.load(torchFile)
                        torchFile.close()
                    initialize = False
    # case when image is changed or the first time to get Activation to run_forward and save A
    if initialize == True:
        # compute the activations
        L = len(layers)
        A = [X] + [None] * L
        get_activations(A,X,L,layers)

        #save A
        save_intermediate_tensorX_pt(A, "A")
        # save_intermediate_tensorX_pt(layers, "W")

        logging.info(image_path)

    # do prediction
    out = check_prediction(A)
    return A, layers, mean, std, out

def run_to_Layer(image_path, stopLayer, config, target_class,classLRP, savingNode, lrp):

    now = time.time()
    now0 = now

    A, layers, mean, std, out  = run_forward(image_path = image_path, maskedNodes_dict = "None")

    if lrp is False:
        print(out, flush = True)

    if lrp is True:

        R, L = lrp_R_Initialize(A, target_class, layers, contrastive_signal = False, classLRP = classLRP)

        # prepare layer_method_obj ## TOADD
        allLayer_methodObj = get_method_obj(config)

        for layerStep in range(stopLayer, L)[::-1]:

            z, s, c, new_Al, new_weight = lrp_R_backPropagation_step(A, R, layerStep, mean, std, allLayer_methodObj[layerStep], layers, contrastive_signal = False, classLRP =classLRP)

        for layerStep in range(1, stopLayer)[::-1]:
            # print(layerStep)

            z, s, c, new_Al, new_weight = lrp_R_backPropagation_step(A, R, layerStep, mean, std, allLayer_methodObj[layerStep], layers, contrastive_signal = False, classLRP =classLRP)

        lrp_backPropagation_last(A, R, mean, std, layers)

        #------- saving heatmaps and data ----------
        now = time.time()

        # save the final output heatmap
        utils.heatmapSave(np.array(R[0][0]).sum(axis=0), 3.5, 3.5, 'output')

if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help="path of input image", required=True)
    parser.add_argument('-c', '--config', help="configuration object", required=True)
    parser.add_argument('-l', '--lrp', help="Boolean lrp", required = True)
    parser.add_argument('-t', '--classIndex', help="target class", required = True)
    parser.add_argument('-s', '--stoplayer', help="stop layer", required = True)
    parser.add_argument('-n', '--nodes', help="node objects", required = True)

    args = parser.parse_args()

    if args.input and args.config and args.lrp and args.classIndex and args.stoplayer and args.nodes:
        ##run(image_path, json.loads(config) ,target_class ,classLRP, lrp)

        image_path = args.input
        config = json.loads(args.config)
        method_updating(config)
        lrp = True if args.lrp == "True" else False
        class_index = int(args.classIndex)
        target_class = class_index
        classLRP =  'None'
        stopLayer = int(args.stoplayer)

        selected_nodes = args.nodes if args.nodes != "All" else "All"

        run_to_Layer(image_path, stopLayer, config, target_class, classLRP, selected_nodes, lrp)