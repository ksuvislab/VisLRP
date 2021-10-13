from packages import *
from utils import *

def ablation_byLayer_heatmap(rawImagePath, layerID, valueLevel1, valueLevel2, alpha_data, color_hex):
    folderName = 'intermediate_data'
    for file in os.listdir(folderName):
        if folderName+'_array_'+str(layerID)  in file:
            
            fileName = folderName +'/' +file 

    with open(fileName, 'rb') as file:
        greyImage = pickle.load(file)
        print(greyImage.min() , greyImage.max())

    folderName = 'images_ablated'; make_folder(folderName)
    outputName0 = 'output_ablated'
    outputName1 = 'output_ablated_frontend'

    ablated_image_path0 = folderName +'/'+outputName0 +'.png'
    ablated_image_path1 = folderName +'/'+outputName1 +'.png'
    ablation_heatmap = greyImage.copy()  

    # get relevance score distribution index matrix
    mask1 = (ablation_heatmap <= valueLevel2 ) * 1   
    mask2 = (ablation_heatmap >= valueLevel1) * 1     
    mask = mask1 * mask2    

    mask = cv2.resize(mask.astype('float32'), dsize=(224, 224), interpolation=cv2.INTER_CUBIC)        
    mask = np.clip(mask, 0, 1)

    print("number of pixels flipped is :", (mask < 0.5).sum() , flush = True)

    # read raw image
    img = cv2.imread(rawImagePath)
    res = cv2.resize(img, dsize=(224, 224), interpolation=cv2.INTER_CUBIC)

    img = np.array(res)[...,::-1]/255.0
    for channel in range(img.shape[2]):      
        img[:,:, channel] *= (1-mask)

    # save masked raw image
    plt.imshow(img)        
    plt.xticks([])
    plt.yticks([])
    plt.tight_layout()
    plt.imsave(ablated_image_path0, img)
    plt.close()

    ## save flipping front image
   
    # Where we set the RGB for each pixel. Here to make the highlighted part red        
    rgba = cv2.cvtColor(mask, cv2.COLOR_RGB2RGBA)
    mask_anti = 1 - mask
    rgba_anti = cv2.cvtColor(mask_anti, cv2.COLOR_RGB2RGBA)

    # Assign the mask to the last channel of the image
    rgba[:, :, 3] = mask *alpha_data
    rgba_anti[:, :, 3] = mask_anti * 0.5
    # convert hex to rgb
    color_rgb = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
    rgba[:, :, 0] *= color_rgb[0] /255  
    rgba[:, :, 1] *= color_rgb[1] /255
    rgba[:, :, 2] *= color_rgb[2] /255
    rgba_anti[:, :, 0] *= 1
    rgba_anti[:, :, 1] *= 1
    rgba_anti[:, :, 2] *= 1
    final = rgba_anti + rgba
    plt.imsave(ablated_image_path1, final)    

    return ablated_image_path0, ablated_image_path1

'''
def ablation_byNode_heatmap(rawImagePath, layerID, nodeID, valueLevel):
    
    fileName = 'intermediate_scores_111/intermediate_scores_'+str(layerID)+'.json'
    
    with open(fileName, 'r') as f:
        heatmaps_dict = json.loads(f.read())
        nodesIDs = heatmaps_dict.keys()
        
        heatmap_r = np.array(heatmaps_dict['node_'+str(nodeID)]['relevance_heatmap'])
#         utils.heatmap(heatmap_r, 1.5,1.5)

        ablation_heatmap = heatmap_r.copy()  

        # get relevance score distribution index matrix
        mask = (ablation_heatmap < valueLevel)*1        
        mask = cv2.resize(mask.astype('float32'), dsize=(224, 224), interpolation=cv2.INTER_CUBIC)        
        mask = np.clip(mask, 0, 1)
 
        print("mask.shape", mask.shape)
        print("flipping at layerID = ",layerID)
        print("flipping at nodeID = ",nodeID)
        print("flipping pixel threshold = ",valueLevel, "in max pixel value = ", np.max(ablation_heatmap))
        print("number of pixels flipped is :", (mask < 0.5).sum(), "over ",224*224)

        # read raw image
        # rawImagePath = 'images/castle.jpg'
        img = cv2.imread(rawImagePath)
        res = cv2.resize(img, dsize=(224, 224), interpolation=cv2.INTER_CUBIC)

        img = np.array(res)[...,::-1]/255.0
        for channel in range(img.shape[2]):      
            img[:,:, channel] *= mask
    
        plt.imshow(img)        
        plt.xticks([])
        plt.yticks([])
        plt.tight_layout()
        plt.show()  
        ablated_image_path = 'images/castle_ablated.jpg'
        plt.imsave(ablated_image_path, img)

        return ablated_image_path
        
'''



if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help="raw image path", required=True)
    parser.add_argument('-l', '--layerid', help="layerid", required=True)
    parser.add_argument('-s', '--valuelv1', help="value level", required=True)
    parser.add_argument('-e', '--valuelv2', help="value level", required=True)
    parser.add_argument('-a', '--alpha', help="opacity", required=True)
    parser.add_argument('-c', '--hexColor', help="hex color", required=True)

    args = parser.parse_args()


    if args.input and args.layerid and args.valuelv1 and args.valuelv1 and args.alpha  and args.hexColor:

        ablated_image_path =  ablation_byLayer_heatmap(args.input, int(args.layerid), float(args.valuelv1), float(args.valuelv2), float(args.alpha), str(args.hexColor))

        print(ablated_image_path, flush = True)

