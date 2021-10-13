from utils import *

def run_forward(image_path, maskedNodes_dict):
    # Load image
    X, mean, std = load_process_image(image_path)  

    # Load model  
    model = torchvision.models.vgg16(pretrained=True); model.eval()
    # model = torchvision.models.vgg16()
    # PATH = './vgg16model/vgg16_model.pth'
    # model.load_state_dict(torch.load(PATH))
    # model.eval()

    # Get layers
    layers = get_layers(model)
    del model

    # mask the corresponding nodes
    if isinstance(maskedNodes_dict, dict):
        for layerID, node_indices_List in maskedNodes_dict.items():

            if layerID < 37:
                layerToMask = layers[layerID]            
                layers[layerID] = mask_forward_layer(layerToMask, indicesList = node_indices_List)

    # compute the activations     
    L = len(layers)
    A = [X] + [None] * L

    get_activations(A,X,L,layers)          
    out = check_prediction(A)

    #save A 
    save_intermediate_tensorX_pt(A, "A")
    save_intermediate_tensorX_pt(layers, "W")

    return A, layers, mean, std, out



def run_to_Layer(image_path, stopLayer, config, target_class,classLRP, savingNode, lrp):    
    
    now = time.time()    
    now0 = now

    A, layers, mean, std, out  = run_forward(image_path = image_path, maskedNodes_dict = "None")

    if lrp is False:
        print(out, flush = True)

    if lrp is True:
        
        R, L = lrp_R_Initialize(A, target_class, layers, contrastive_signal = False, classLRP = classLRP)   

        # zsc_temp = {}

        # prepare layer_method_obj ## TOADD
        allLayer_methodObj = get_method_obj(config)
       
        for layerStep in range(stopLayer, L)[::-1]: #layerStep  range is [0,37]
            # print(layerStep)
            
            z, s, c, new_Al, new_weight = lrp_R_backPropagation_step(A, R, layerStep, mean, std, allLayer_methodObj[layerStep], layers, contrastive_signal = False, classLRP =classLRP)
            # pdb.set_trace()
            # if z is not "None" and isinstance(layers[layerStep], torch.nn.modules.conv.Conv2d):
            #     zsc_temp['z'] = z
            #     zsc_temp['s'] = s
            #     zsc_temp['c'] = c
            #     zsc_temp['r_current'] = R[layerStep]
            #     zsc_temp['r_previous'] = R[layerStep+1]
            #     zsc_temp['a'] = A[layerStep].requires_grad_(False).detach().numpy()
            #     zsc_temp['a_manipulated'] = new_Al.requires_grad_(False).detach().numpy()
            #     zsc_temp['w'] = layers[layerStep].weight.requires_grad_(False).detach().numpy()
            #     zsc_temp['w_manipulated'] = new_weight
        for layerStep in range(1, stopLayer)[::-1]:
            # print(layerStep)

            z, s, c, new_Al, new_weight = lrp_R_backPropagation_step(A, R, layerStep, mean, std, allLayer_methodObj[layerStep], layers, contrastive_signal = False, classLRP =classLRP)
                
        lrp_backPropagation_last(A, R, mean, std, layers)

        # # --- save intermediate z,s,c ... ----------
        # if isinstance(R[stopLayer], torch.Tensor):
        #     folderName = 'intermediate_zsc'; make_folder(folderName)
            
        #     utils.heatmapSave(zsc_temp['z'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_z')
        #     utils.heatmapSave(zsc_temp['s'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_s')
        #     utils.heatmapSave(zsc_temp['c'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_c')   
        #     utils.heatmapSave(zsc_temp['r_current'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_stopLayer'+str(stopLayer)) 
        #     utils.heatmapSave(zsc_temp['r_previous'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_stopLayer'+str(stopLayer+1)) 
            
        #     utils.heatmapSave(zsc_temp['a'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_a')
        #     utils.heatmapSave(zsc_temp['w'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_w')
        #     utils.heatmapSave(zsc_temp['a_manipulated'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_a_manipulated')
        #     utils.heatmapSave(zsc_temp['w_manipulated'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_w_manipulated')            
            
        #     """
        #     utils.heatmapSaveGrey(zsc_temp['z'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_z')
        #     utils.heatmapSaveGrey(zsc_temp['s'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_s')
        #     utils.heatmapSaveGrey(zsc_temp['c'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_c')   
        #     utils.heatmapSaveGrey(zsc_temp['r_current'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_stopLayer'+str(stopLayer)) 
        #     utils.heatmapSaveGrey(zsc_temp['r_previous'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_stopLayer'+str(stopLayer+1)) 
            
        #     utils.heatmapSaveGrey(zsc_temp['a'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_a')
        #     utils.heatmapSaveGrey(zsc_temp['w'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_w')
        #     utils.heatmapSaveGrey(zsc_temp['a_manipulated'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_a_manipulated')
        #     utils.heatmapSaveGrey(zsc_temp['w_manipulated'][0].sum(axis = 0), 3.5, 3.5, folderName +'/temp_w_manipulated')            
        #     """
        # later = time.time() - now
        # print("run lrp:",later)

        

        #------- saving heatmaps and data ----------
        now = time.time() 
        # save the final output heatmap
        utils.heatmapSave(np.array(R[0][0]).sum(axis=0), 3.5, 3.5, 'output')

        with open("output_data.pickle", 'wb') as handle:
            #pickle.dump(np.array(R[0][0]).sum(axis=0), handle, protocol=pickle.HIGHEST_PROTOCOL)
            
            dic = {}
            htmp = np.array(R[0][0]).sum(axis=0)
            htmp_1d = htmp.reshape(-1)
            dic = { k: v for v, k in enumerate(htmp_1d) }
            pickle.dump(dic, handle, protocol=pickle.HIGHEST_PROTOCOL)


        print("0", flush = True)
        later = time.time() - now
        # print("save final png:",later)

        now = time.time() 
        save_intermediateLayer_relevance_heatmaps(R, stopLayer = 0)        
        print("1", flush = True)
        later = time.time() - now
        # print("save intermediate heatmaps:",later)


        now = time.time() 
        # R saved in format ".pt"
        save_intermediate_tensorX_pt(R, "R")
        print("2", flush = True)
        later = time.time() - now
        # print("save lrp variable R:",later)

        # save the json for conservation / entropy-line charts.  
        now = time.time()      
        save_intermediate_conservationR_layers()
        print("3", flush = True)
        later = time.time() - now
        # print("save conservationR:",later)


        now = time.time()         
        save_intermediate_entropy_layers()
        print("4", flush = True)
        later = time.time() - now
        # print("save entropy:",later)


        now = time.time()      
           
        save_intermediate_All_Node_relevance_activation_heatmaps(R,A)
        later = time.time() - now
        # print("save nodes matrix data:",later)
        print("5", flush = True)

        # print("total time:", time.time() - now0)
        
        
   
            

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


'''
# if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help="path of input image", required=True)
    # parser.add_argument('-c', '--config', help="configuration object", required=True)

    args = parser.parse_args()
    now = time.time()    
    now0 = now

    #all_posible_methods = ['0', 'epsilon', 'gamma', 'alpha-beta', 'alpha1-beta0', 'w_square', 'flat', 'z_beta']

    if args.input :#and args.config:
        image_path = args.input
        # config = args.config
        # run(image_path, json.loads(config))
        lrp = True
        
        target_class = 483   # 833 #728 #815 #340#  386 #340 #242  #483 # 919  #20 bird#
        classLRP = 'None'  #  'classLRP_clrp2'  #'None' #'classLRP_sglrp' #

       
        # check the method setting       
        obj = { 'method': 'lrp-alpha-beta', # 'alpha-beta', #'gamma', #'z-beta',# ['alpha-beta'],
                'alpha':1,
                'beta':0,
                'theta0':0,    # issue if 1
                'theta1':1,
                'eps':0,
                'gamma0':0,    # issue if 1
                'gamma1':1,
                'gamma1p':0,   # -0.2
                'gamma1n':0,   #-0.2
                'gamma2':0,                
                # "id":1, "x0": 0, "x1": 18     
                "id":1, "x0": 0, "x1": 39         
        }
        config = [obj]
        method_updating(config)
    
       
        

        ## -----run by step ----------     
        stopLayer = 31 # [31 -38] are  [avgpool + classification]
        #savingNode = {"layerID":10,"nodeID":0}
        
        # run_to_Layer(image_path, stopLayer, config,target_class,classLRP,savingNode = 'None')
        run_to_Layer(image_path, stopLayer, config, target_class,classLRP, "All", lrp)
               
        later = time.time() - now
        print("done run and save", later)
       

        ## testing code for plot ##
        from draw_data import *
        # prepare the title for testing plot-chart in python
        c = 0
        method = "\nlrp-"
        for k,v in obj.items():
            if k!= 'method' and k!= "id" and k!= "x0" and k!="x1":
                c += 1
                if c == 5:
                    method = method + k +"=" + str(v)+"\n"
                else:
                    method = method + k +"=" + str(v)+"_"
        
        plot_data(method)        
        print("done plot")
'''


      
        

  
        
    
   

    
        
        
        
        

        
        


        