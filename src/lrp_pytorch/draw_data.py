from utils import *

def align_yaxis(ax1, v1, ax2, v2):
    """adjust ax2 ylimit so that v2 in ax2 is aligned to v1 in ax1"""
    _, y1 = ax1.transData.transform((0, v1))
    _, y2 = ax2.transData.transform((0, v2))
    inv = ax2.transData.inverted()
    _, dy = inv.transform((0, 0)) - inv.transform((0, y1-y2))
    miny, maxy = ax2.get_ylim()
    # ax2.set_ylim(miny+dy, 1)
    ax2.set_ylim(miny+dy, maxy+dy)

def draw_node_json(dataPath, y_key1, y_key2, normalize, method):
    folderName = "plot_nodeMatrix_data"; make_folder(folderName)
    
    for file in os.listdir(dataPath):
        if file.endswith(".pickle"):    
            tmp = file.split(".")[0]        
            l = tmp.split("_")[-1]   
            if l is not "0":
                
                fileRead = dataPath + "_" + str(l) + ".pickle"
                with open(dataPath+'/'+fileRead, "rb") as fout:

                    
                    
                    data = pickle.load(fout)
                    fig, axs = plt.subplots(2,1, sharex=True)
                    legendList = []

                    for y_key in y_key1:
                    
                        node_dict = {}
                        for k,v  in data.items():
                            n =k.split("_")[-1]   
                            node_dict[int(n)] = data[k][y_key]
                    
                        lists = sorted(node_dict.items())
                        x, y = zip(*lists)
                        
                        line, = axs[0].plot(x, y, label = y_key)
                        legendList.append(line)  
                
                        axs[0].set_xlabel('nodeID', fontsize=10)
                        axs[0].set_ylabel("relevance value", fontsize=10 )
                        
                    # align_yaxis(axs[0], 0, axs[1], 0)
                    axs[0].set_title(label = "nodes_info_"+"@layer="+str(l)+"_"+method,fontsize =9)
                    axs[0].legend(legendList, y_key1 , loc='upper right',fontsize =6)
                        # plt.legend()



                    legendList = []
                    for y_key in y_key2:
                        node_dict = {}
                        for k,v  in data.items():
                            n =k.split("_")[-1]   
                            node_dict[int(n)] = data[k][y_key]
                    
                        lists = sorted(node_dict.items())
                        x, y = zip(*lists)
                        
                        if normalize:
                            # axs[1] = axs[0].twinx()
                            # pdb.set_trace()
                            z = y
                            max_y = max(list(y))
                            if max_y ==0:
                                print("ok")
                                max_y = 0.001
                            
                            y = [v / max_y for v in z ]

                        line, = axs[1].plot(x, y, color='cyan', alpha=0.5, label = y_key)
                        legendList.append(line) 
                        
                        
                        # axs[1].set_ylim(0, 12)
                        axs[1].set_xlabel('nodeID', fontsize=10)
                        axs[1].set_ylabel("activation value", fontsize=10)
                    
                    
                    axs[1].legend(legendList, y_key2 , loc='upper right',fontsize =6)

                    # plt.title( label = "nodes_info_"+"@layer="+str(l))
                    plt.savefig( folderName + "/" + y_key+"@layer="+str(l))
                    plt.close()




               
def draw_entroy_json(dataPath1, dataPath2, y_key1, y_key2, folderName, method):
    fileRead1 = dataPath1+'/'+dataPath1 +".pickle"
    fileRead2 = dataPath2+'/'+dataPath2 +".pickle"
    legendList = []
   
    fig, axs = plt.subplots(2,1, sharex=True)
    legendList = []

    with open(fileRead1, "rb") as fout:
    
        data = pickle.load(fout)

        for key in y_key1:
            layer_dict = {}
            for k,v  in data.items():
                l =k.split("_")[-1]   
                
                layer_dict[int(l)] = data[k][key]
          

            lists = sorted(layer_dict.items())

            x, y = zip(*lists)      
            
            line,  = axs[0].plot(x, y, label = key)
            legendList.append(line)
  
            axs[0].set_xlabel('layerID', fontsize=10)
            axs[0].set_ylabel("value", fontsize=10)

        axs[0].set_title(label = "layer_info_" + method,fontsize =9)
        axs[0].legend(legendList, y_key1 , loc='upper left',fontsize =6)
        axs[0].grid(b=True, which='both', axis='both')
            
          
    legendList = []
    with open(fileRead2, "rb") as fout:
        
        data = pickle.load(fout)

        for key in y_key2:
            layer_dict = {}
            for k,v  in data.items():
                l =k.split("_")[-1]   
                
                layer_dict[int(l)] = data[k][key]

            lists = sorted(layer_dict.items())
            x, y = zip(*lists)

            line,  = axs[1].plot(x, y, label = key)
            legendList.append(line)
            
            axs[1].set_xlabel('layerID', fontsize=10)
            axs[1].set_ylabel("value", fontsize=10)

    
    axs[1].legend(legendList, y_key2 , loc='upper left', fontsize =6)
    
    plt.grid(b=True, which='both', axis='both')
    
    plt.savefig(folderName + "/" + "layer_info")
    plt.close()
                   
          
            
    
    
    
   

"""

def draw_node_json(dataPath, y_key):
    folderName = "plot_"+y_key; make_folder(folderName)
    d = {}
    for file in os.listdir(dataPath):
        if file.endswith(".pickle"):    
            tmp = file.split(".")[0]        
            l = tmp.split("_")[-1]   


            fileRead = dataPath + "_" + str(l) + ".pickle"
            with open(dataPath+'/'+fileRead, "rb") as fout:
                
                
                data = pickle.load(fout)
                
                node_dict = {}
                for k,v  in data.items():
                    n =k.split("_")[-1]   
                    node_dict[int(n)] = data[k][y_key]
               
                lists = sorted(node_dict.items())
                x, y = zip(*lists)
                
                
                plt.plot(x, y)
                plt.title( label = y_key+"@layer="+str(l))
                plt.xlabel('nodeID', fontsize=10)
                plt.ylabel(y_key, fontsize=10)
                
                plt.savefig( folderName + "/" + y_key+"@layer="+str(l))
                plt.close()
"""                

                
# def draw_entroy_json(dataPath1, dataPath2, y_key, y_key2, folderName, method):
#     fileRead1 = dataPath1+'/'+dataPath1 +".pickle"
#     fileRead2 = dataPath2+'/'+dataPath2 +".pickle"
#     legendList = []
#     with open(fileRead1, "rb") as fout:
    
#         data = pickle.load(fout)

#         for key in y_key:
#             layer_dict = {}
#             for k,v  in data.items():
#                 l =k.split("_")[-1]   
                
#                 layer_dict[int(l)] = data[k][key]

#             lists = sorted(layer_dict.items())
#             x, y = zip(*lists)
            
            
#             line,  = plt.plot(x, y, label = key)
#             legendList.append(line)
#             plt.title( label = "layer_info")
#             plt.xlabel('nodeID', fontsize=10)
#             plt.ylabel("value", fontsize=10)
            
#             # plt.savefig( folderName + "/" + key)
#     with open(fileRead2, "rb") as fout:
    
#         data = pickle.load(fout)

#         for key in y_key2:
#             layer_dict = {}
#             for k,v  in data.items():
#                 l =k.split("_")[-1]   
                
#                 layer_dict[int(l)] = data[k][key]

#             lists = sorted(layer_dict.items())
#             x, y = zip(*lists)
            
            
#             line,  = plt.plot(x, y, label = key)
#             legendList.append(line)
#             plt.title( label = "layer_info_" + method)
#             plt.xlabel('nodeID', fontsize=10)
#             plt.ylabel("value", fontsize=10)
            
#     y_key.append(y_key2[0])
#     plt.legend(legendList, y_key)
#     plt.grid(b=True, which='both', axis='both')
    
#     plt.savefig( folderName + "/" + "layer_info")
#     plt.close()

    
def plot_data(method):
   


    y_key2 = ["activation_sum"]
    y_key1 = [ "relevance_sum_absolute",  "relevance_sum_combination", "relevance_sum_positive", "relevance_sum_negative"]
    dataPath = "intermediate_scores"
    draw_node_json(dataPath, y_key1, y_key2, normalize = True, method = method)


    ############
    folderName = "plot_layerEntropy_Rconservation"; make_folder(folderName)
    dataPath1 = "entropy_scores"
    dataPath2 = "conservation_scores"
    y_key2 = ["conservationR"]
    y_key1 = ["activation_entropy", "relevance_entropy_combination", "relevance_entropy_absolute", "relevance_entropy_positive", "relevance_entropy_negative"]
    draw_entroy_json(dataPath1, dataPath2, y_key1, y_key2, folderName , method)
    

# lists = sorted(d.items()) # sorted by key, return a list of tuples

# x, y = zip(*lists) # unpack a list of pairs into two tuples

# plt.plot(x, y)
# plt.show()

if __name__ == "__main__":

    plot_data(method = "lrp-garmma=0.25")
    # y_key = ["activation_sum", "relevance_sum_absolute",  "relevance_sum_combination", "relevance_sum_positive", "relevance_sum_negative"]

    # dataPath = "intermediate_scores"
    # # y_key = "activation_sum"  #
    # draw_node_json(dataPath, y_key ,normalize = True)

    # # y_key = "relevance_sum_absolute"  #
    # # draw_node_json(dataPath, y_key)

    # # y_key = "relevance_sum_combination"  #
    # # draw_node_json(dataPath, y_key)

    # # y_key = "relevance_sum_positive"  #
    # # draw_node_json(dataPath, y_key)

    # # y_key = "relevance_sum_negative"  #
    # # draw_node_json(dataPath, y_key)

    # # ############
    # folderName = "plot_layerEntropy_Rconservation"; make_folder(folderName)
    # dataPath1 = "entropy_scores"
    # dataPath2 = "conservation_scores"
    # y_key2 = ["conservationR"]
    # y_key1 = ["activation_entropy", "relevance_entropy_combination", "relevance_entropy_absolute", "relevance_entropy_positive", "relevance_entropy_negative"]
    # draw_entroy_json(dataPath1, dataPath2, y_key1, y_key2, folderName)

    # # # folderName = "plot_conservation"; make_folder(folderName)
    # # dataPath = "conservation_scores"
    # # y_key = ["conservationR"]
    # # draw_entroy_json(dataPath, y_key,folderName)



'''

        later = time.time() - now
        print("run lrp:",later)

        now = time.time() 
        # save the final output heatmap
        utils.heatmapSave(np.array(R[0][0]).sum(axis=0), 3.5, 3.5, 'output')
        print("0", flush = True)
        later = time.time() - now
        print("save final png:",later)

        now = time.time() 
        save_intermediateLayer_relevance_heatmaps(R, stopLayer = 0)        
        print("1", flush = True)
        later = time.time() - now
        print("save intermediate heatmaps:",later)


        now = time.time() 
        # R saved in format ".pt"
        save_intermediate_tensorX_pt(R, "R")
        print("2", flush = True)
        later = time.time() - now
        print("save lrp variable R:",later)

        # save the json for conservation / entropy-line charts.  
        now = time.time()      
        save_intermediate_conservationR_layers()
        print("3", flush = True)
        later = time.time() - now
        print("save conservationR:",later)


        now = time.time()         
        save_intermediate_entropy_layers()
        print("4", flush = True)
        later = time.time() - now
        print("save entropy:",later)


        now = time.time()         
        save_intermediate_All_Node_relevance_activation_heatmaps(R,A)
        later = time.time() - now
        print("save nodes matrix data:",later)
        print("5", flush = True)

        print("total time:", time.time() - now0)
'''


'''

# if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help="path of input image", required=True)
    # parser.add_argument('-c', '--config', help="configuration object", required=True)

    args = parser.parse_args()

    #all_posible_methods = ['0', 'epsilon', 'gamma', 'alpha-beta', 'alpha1-beta0', 'w_square', 'flat', 'z_beta']

    if args.input :#and args.config:
        image_path = args.input
        # config = args.config
        # run(image_path, json.loads(config))
        
        target_class = 483   # 833 #728 #815 #340#  386 #340 #242  #483 # 919  #20 bird#
        classLRP = 'None'  #  'classLRP_clrp2'  #'None' #'classLRP_sglrp' #


        # check the method setting
        lrp = True
        obj = { 'method': 'lrp-0', # 'alpha-beta', #'gamma', #'z-beta',# ['alpha-beta'],
                'theta0':0,  # issue if 1
                'theta1':1,
                'gamma0':0, # issue if 1
                'gamma1':1,
                'gamma1p': 0, # -0.2
                'gamma1n': 0, #-0.2
                'gamma2':0,
                'eps':0,
                'alpha':1,
                'beta':0,
                # "id":1, "x0": 0, "x1": 18     
                "id":1, "x0": 31, "x1": 39         
        }
        

        obj1 = obj.copy()
        obj1['eps'] = 0.25
        obj1['id'] = 2
        obj1['x0'] = 18
        obj1['x1'] = 31      

        obj2 = obj.copy()
        obj2['eps'] = 0
        obj2['gamma1p'] = 0.25        
        obj2['id'] = 3
        obj2['x0'] = 0
        obj2['x1'] = 18
      
        config = [obj2, obj1, obj]
        method_updating(config)
        

        pr = cProfile.Profile()
        pr.enable()


        ## -----run by step ----------     
        stopLayer = 0 # [31 -38] are  [avgpool + classification]
        #savingNode = {"layerID":10,"nodeID":0}
        
        # run_to_Layer(image_path, stopLayer, config,target_class,classLRP,savingNode = 'None')
        run_to_Layer(image_path, stopLayer, config, target_class,classLRP, "All", lrp)
        print("done")
        
        

        ########## stat of run time #########
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats('tottime')
        ps.print_stats()

        with open('result.txt', 'w+') as f:
            f.write(s.getvalue())


        

  

# save the final output heatmap
utils.heatmapSave(np.array(R[0][0]).sum(axis=0), 3.5, 3.5, 'output')
print("0", flush = True)
save_intermediateLayer_relevance_heatmaps(R, stopLayer = 0)        
print("1", flush = True)

# R saved in format ".pt"
save_intermediate_tensorX_pt(R, "R")
print("2", flush = True)

# save the json for conservation / entropy-line charts.  
save_intermediate_conservationR_layers()
print("3", flush = True)

save_intermediate_entropy_layers()
print("4", flush = True)

# save all nodes data for node matrix, except for heatmaps which generated in demands.  
save_intermediate_All_Node_relevance_activation_heatmaps(R,A)
print("5", flush = True)               

   

'''