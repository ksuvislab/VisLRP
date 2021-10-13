from packages import *

# --------------------------------------
# --------------------------------------
def method_updating(config):

    for parametersDict in config:
        theta0 = float(parametersDict['theta0'])
        theta1 = float(parametersDict['theta1'])
        gamma0 = float(parametersDict['gamma0'])
        gamma1 = float(parametersDict['gamma1'])
        gamma1p = float(parametersDict['gamma1p'])
        gamma1n = float(parametersDict['gamma1n'])
        gamma2 = float(parametersDict['gamma2'])
        eps = float(parametersDict['eps'])
        alpha = float(parametersDict['alpha'])
        beta = float(parametersDict['beta'])

        # ['0', 'epsilon', 'gamma', 'alpha-beta', 'alpha1-beta0', 'w_square', 'flat', 'z_beta']

        if ((theta0 == 0) and (theta1 == 1)) and ((gamma0 == 0) and ((gamma1 == 1) and (gamma1p == 0) and (gamma1n == 0)) and (gamma2 == 0)) and (eps == 0) and (alpha == 1) and (beta == 0):

            ParameterMethod_actual = 'lrp-0'
            parametersDict['method'] = ParameterMethod_actual

        elif ((theta0 == 1) and (theta1 == 0)) and ((gamma0 == 0) and ((gamma1 == 0) and (gamma1p == 0) and (gamma1n == 0)) and (gamma2 == 1)) and (eps == 0) and (alpha == 1) and (beta == 0):

            ParameterMethod_actual = 'lrp-w_square'
            parametersDict['method'] = ParameterMethod_actual
        elif ((theta0 == 0) and (theta1 == 1)) and ((gamma0 == 0) and (gamma1 == 1) and  (gamma1p == 0) and (gamma1n == 0) and (gamma2 == 0)) and (eps is not 0) and (alpha == 1) and (beta == 0):

            ParameterMethod_actual = 'lrp-epsilon'
            parametersDict['method'] = ParameterMethod_actual
        elif ((theta0 == 0) and (theta1 == 1)) and ((gamma0 == 0) and (gamma1 == 1) and  (gamma1p is not 0) and (gamma1n == 0) and (gamma2 == 0)) and (eps == 0) and (alpha == 1) and (beta == 0):

            ParameterMethod_actual = 'lrp-gamma'
            parametersDict['method'] = ParameterMethod_actual
        elif ((theta0 == 1) and (theta1 == 0)) and ((gamma0 == 1) and ((gamma1 == 0) and (gamma1p == 0) and (gamma1n == 0)) and (gamma2 == 0)) and (eps == 0) and (alpha == 1) and (beta == 0):

            ParameterMethod_actual = 'lrp-flat'
            parametersDict['method'] = ParameterMethod_actual
        elif (alpha != 0) and (beta != 0) and (theta0 == 0) and (theta1 == 1) and (gamma0 == 0) and (gamma1 == 0) and (gamma1p == 1) and (gamma1n == 1) and (gamma2 == 0) and (eps == 0):

            ParameterMethod_actual = 'lrp-alpha-beta'
            parametersDict['method'] = ParameterMethod_actual

        elif (alpha == 1) and (beta == 0) and (theta0 == 0) and (theta1 == 1) and (gamma0 == 0) and (gamma1 == 0) and (gamma1p == 1) and (gamma1n == 1) and (gamma2 == 0) and (eps == 0):

            ParameterMethod_actual = 'lrp-alpha1-beta0'
            parametersDict['method'] = ParameterMethod_actual
        elif (alpha == 1) and (beta == 0) and (theta0 == 0) and (theta1 == 1) and (gamma0 == 0) and (gamma1 == 1) and (gamma1p != 0) and (gamma1n != 0) and (gamma2 == 0) and (eps == 0):

            ParameterMethod_actual = 'lrp-z_beta'
            parametersDict['method'] = ParameterMethod_actual
        else:
            parametersDict['method'] = 'customized'

    return

## TOADD
def get_method_obj(segments):
    method_obj = {}
    for segment in segments:
        start_layer = segment['x0'] - 1
        end_layer = segment['x1']
        for l in range(start_layer, end_layer):
            obj = {
                'method': segment['method'],#[segment['method']],
                'theta0': segment['theta0'],
                'theta1': segment['theta1'],
                'gamma0': segment['gamma0'],
                'gamma1': segment['gamma1'],
                'gamma1p': segment['gamma1p'],
                'gamma1n': segment['gamma1n'],
                'gamma2': segment['gamma2'],
                'eps': segment['eps'],
                'alpha': segment['alpha'],
                'beta': segment['beta'],
            }
            method_obj[l] = obj
    return method_obj



# --------------------------------------
def load_process_image(imageName):

    # resize image if need
    img = cv2.imread(imageName)

    res = cv2.resize(img, dsize=(224, 224), interpolation=cv2.INTER_CUBIC)

    img = np.array(res)[...,::-1]/255.0
    mean = torch.Tensor([0.485, 0.456, 0.406]).reshape(1,-1,1,1)
    std  = torch.Tensor([0.229, 0.224, 0.225]).reshape(1,-1,1,1)
    X = (torch.FloatTensor(img[np.newaxis].transpose([0,3,1,2])*1) - mean) / std

    return X,mean,std

def save_model():
    make_folder("vgg16model")
    PATH = './vgg16model/vgg16_model.pth'
    #first time to save model to local file
    model = torchvision.models.vgg16(pretrained=True); model.eval()
    torch.save(model.state_dict(), PATH)
    del model


def get_layers(model):
    layers = list(model._modules['features']) + utils.toconv(list(model._modules['classifier']))
    return layers

def get_activations(A,X,L,layers):
    for l in range(L):
        #print(l,  "layer shape:", layers[l], "input A shape:", A[l].shape)
        A[l+1] = layers[l].forward(A[l])


def check_prediction(A):

    scores = np.array(A[-1].data.view(-1))
    ind = np.argsort(-scores)

    prediction = []

    for i in ind[:10]:
        classItem = {}
        classItem["id"] = str(i)
        classItem["score"] = str(scores[i])
        classItem["names"] = str(utils.imgclasses[i][:20])
        prediction.append(classItem)
        # print('%20s (%3d): %6.3f'%(utils.imgclasses[i][:20],i,scores[i]))

    return json.dumps(prediction)


def lrp_R_Initialize(A, index, layers, contrastive_signal, **kwargs):

    L = len(layers)

    ## lrp or sglrp in "if"
    if contrastive_signal == False:
        if kwargs and kwargs['classLRP'] is 'classLRP_sglrp':
            T = torch.FloatTensor((1.0*(np.arange(1000)==index).reshape([1,1000,1,1])))
            y_preSoftmax = A[-1].view(1,1000)
            y_softmax_target = F.softmax(y_preSoftmax, dim=1)[0,index]
            R_sglrp_target = y_softmax_target * (1 - y_softmax_target)
            R = [None]*L + [(R_sglrp_target*T).data]

        else: # general lrp methods
            T = torch.FloatTensor((1.0*(np.arange(1000)==index).reshape([1,1000,1,1])))
            R = [None]*L + [(A[-1]*T).data]

    ## clrp case  in "else"
    else:
        #print(kwargs['classLRP'])
        if kwargs['classLRP'] == 'classLRP_clrp1':
            # y_preSoftmax = A[-1].view(1,1000)
            # y_softmax_uniform = (F.softmax(y_preSoftmax, dim=1)[0,index]/999).data.numpy()
            # print("y_softmax_uniform:", y_softmax_uniform)
            # T = torch.from_numpy(y_softmax_uniform * np.ones(shape = (1,1000,1,1))) ;  T[0, index] = 0
            # R = [None]*L + [T.data]

            T = (A[-1].data).requires_grad_(False); T[0, index] = 0
            R = [None]*L + [torch.abs(T).data]
        elif kwargs['classLRP'] == 'classLRP_clrp2':

            T = torch.FloatTensor((1.0*(np.arange(1000)==index).reshape([1,1000,1,1])))
            R = [None]*L + [(A[-1]*T).data]
            # change the layer[-1] weight and bias to be negated
            layers[-1].weight = nn.Parameter(layers[-1].weight *(-1))
            layers[-1].bias = nn.Parameter(layers[-1].bias *(-1))

        elif kwargs['classLRP'] == 'classLRP_sglrp':

            y_preSoftmax = A[-1].view(1,1000)
            y_softmax_target = F.softmax(y_preSoftmax, dim=1)[0,index]
            R_sglrp_nonTarget = - y_preSoftmax * y_softmax_target
            T = (R_sglrp_nonTarget.data).requires_grad_(False); T[0, index] = 0
            R = [None]*L + [T.data]

    return R, L

def lrp_R_backPropagation_step(A, R, l, mean, std, methodObj, layers, contrastive_signal, **kwargs):

    method = methodObj['method']
    theta0 = methodObj['theta0']
    theta1 = methodObj['theta1']
    gamma0 = methodObj['gamma0']
    gamma1 = methodObj['gamma1']
    gamma1p = methodObj['gamma1p']
    gamma1n = methodObj['gamma1n']
    gamma2 = methodObj['gamma2']
    eps = methodObj['eps']
    alpha = methodObj['alpha']
    beta = methodObj['beta']


    # get activation
    A[l] = (A[l].data).requires_grad_(True)

    if isinstance(layers[l], torch.nn.MaxPool2d):
        layers[l] = torch.nn.AvgPool2d(2)

    if isinstance(layers[l], torch.nn.Conv2d) or isinstance(layers[l], torch.nn.AvgPool2d):

        rms = lambda x : ((x**2).mean()**.5).data
        if isinstance(layers[l], torch.nn.AvgPool2d):
            const_weight = 0#torch.zeros(p.shape).float()

        else:
            const_weight = rms(layers[l].weight)  # torch.ones(p.shape).float()


        # weight control
        # if 'lrp-alpha-beta' not in method:
        if beta == 0:
            rho = lambda p: gamma0 * const_weight + gamma1*p  + gamma1p*p.clamp(min=0) + gamma1n*p.clamp(max=0) + gamma2*p**2

        else:
            if method == 'lrp-alpha-beta':
                rho =      lambda p: gamma1p*p.clamp(min=0)
                rho_beta = lambda p: gamma1n*p.clamp(max=0)
            else:
                rho =      lambda p: gamma0 * const_weight + gamma1*p  + gamma1p*p.clamp(min=0) + gamma2*p**2
                rho_beta = lambda p: gamma0 * const_weight + gamma1*p + gamma1n*p.clamp(max=0) + gamma2*p**2



        # background noise control
        incr = lambda z: z+1e-9 +eps* torch.sign(z) *((z**2).mean()**.5).data

        # activation control
        # I_with_Al_shape = torch.ones(A[l].shape).float()
        # new_Al =  (theta0*I_with_Al_shape+ theta1*A[l]).float().clone().detach().requires_grad_(True)
        I_with_Al_shape = rms(A[l])
        new_Al =  (theta0*I_with_Al_shape+ theta1*A[l]).float().clone().detach().requires_grad_(True)

        if 'lrp-z_beta' == method:

            shape = A[l].shape

            mean = A[l].mean().data
            std = A[l].std().data  ### TODO  not normal way of setting #60

            lb = (A[l].data*0+(0-mean)/std).requires_grad_(True)
            hb = (A[l].data*0+(1-mean)/std).requires_grad_(True)

            z = layers[l].forward(A[l]) + 1e-9                                     # step 1 (a)
            z -= utils.newlayer(layers[l],  lambda p: p.clamp(min=0)).forward(lb)    # step 1 (b)
            z -= utils.newlayer(layers[l],  lambda p: p.clamp(max=0)).forward(hb)    # step 1 (c)
            s = (R[l+1]/z).data                                                      # step 2    ## const with .data
            (z*s).sum().backward(); c,cp,cm = A[l].grad,lb.grad,hb.grad            # step 3
            R[l] = (A[l]*c+lb*cp+hb*cm).data                                       # step 4

        else:

            z = incr(utils.newlayer(layers[l], rho).forward(new_Al))  # step 1
            # z = incr(layer.forward(new_Al))  # step 1

            s = (R[l+1]/z)
            (z*s.data ).sum().backward(); c = new_Al.grad
            R[l] = (new_Al * (alpha * c)).data


            if beta > 0:
                new_Al_beta = new_Al.clone().detach().requires_grad_(True)
                z_beta = incr(utils.newlayer(layers[l],  rho_beta).forward(new_Al_beta))
                # z_beta = incr(layer_beta.forward(new_Al))
                s_beta =  (R[l+1]/z_beta)           # step 2
                (z_beta * s_beta.data ).sum().backward(); c_beta = new_Al_beta.grad                  # step 3

                R[l] = (new_Al * (alpha * c- beta* c_beta)).data

        R[l][torch.isnan(R[l])] = 0

        new_Weight = layers[l].weight.requires_grad_(False).detach().numpy() if isinstance(layers[l], torch.nn.Conv2d) else "None"
        # new_Weight = layer.weight.requires_grad_(False).detach().numpy() if isinstance(layers[l], torch.nn.Conv2d) else "None"
        return z.data, s.data, c.data, new_Al.data, new_Weight
    else:

        R[l] = R[l+1]
        return "None", "None", "None", "None", "None"





def lrp_backPropagation_last(A,R,mean,std, layers):
    A[0] = (A[0].data).requires_grad_(True)

    lb = (A[0].data*0+(0-mean)/std).requires_grad_(True)
    hb = (A[0].data*0+(1-mean)/std).requires_grad_(True)

    z = layers[0].forward(A[0]) + 1e-9                                     # step 1 (a)
    z -= utils.newlayer(layers[0],  lambda p: p.clamp(min=0)).forward(lb)    # step 1 (b)
    z -= utils.newlayer(layers[0],  lambda p: p.clamp(max=0)).forward(hb)    # step 1 (c)
    s = (R[1]/z).data                                                      # step 2    ## const with .data
    (z*s).sum().backward(); c,cp,cm = A[0].grad,lb.grad,hb.grad            # step 3
    R[0] = (A[0]*c+lb*cp+hb*cm).data                                       # step 4
    return R

# --------------------------------------
# saving data
# --------------------------------------
def make_folder(folderName):
    #    folderName = 'intermediate_images'
    if os.path.isdir(folderName):
        shutil.rmtree(folderName)
    os.mkdir(folderName)

def convert_pt2heatmapLayer(folderNameInput, folderNameOutput, typeX, layerID):

    tensorx = torch.load(folderNameInput+'/'+ typeX + '_l_' + str(layerID)+'.pt')
    fileName = folderNameOutput +'/'+folderNameOutput + '_' + str(layerID)
    utils.heatmapSave(np.array(tensorx[0]).sum(axis=0), 3.5, 3.5, fileName)
    utils.heatmapSaveGrey(np.array(tensorx[0]).sum(axis=0), 3.5, 3.5, fileName+'_grey')

def generate_intermediateLayer_heatmaps(typeX):
    # create the folder for saving jpg
    folderNameInput = 'intermediate_tensor' + typeX
    folderNameOutput = 'intermediate_images';make_folder(folderNameOutput)

    for file in os.listdir(folderNameInput):
        if file.endswith(".pt"):
            tmp = file.split(".")[0]
            l = tmp.split("_")[-1]
            convert_pt2heatmapLayer(folderNameInput, folderNameOutput, typeX, l)

"""
def save_intermediateLayer_relevance_heatmaps(R, stopLayer):
    # create the folder for saving jpg
    folderNameInput = 'intermediate_tensorR'
    folderNameOutput = 'intermediate_images';make_folder(folderNameOutput)

    # saving each layer's relevance heatmap as png
    for l in range(stopLayer, len(R)):
        fileName = folderNameOutput +'/'+folderNameOutput + '_' + str(l)
        utils.heatmapSave(np.array(R[l][0]).sum(axis=0), 3.5, 3.5, fileName)
        utils.heatmapSaveGrey(np.array(R[l][0]).sum(axis=0), 3.5, 3.5, fileName+'_grey')
"""

def save_intermediateLayer_relevance_heatmaps(R, stopLayer):
    # create the folder for saving jpg
    folderNameInput = 'intermediate_tensorR'
    folderNameOutput = 'intermediate_images';make_folder(folderNameOutput)
    folderNameOutput2 = 'intermediate_data';make_folder(folderNameOutput2)

    # saving each layer's relevance heatmap as png
    for l in range(stopLayer, len(R)):
        fileName = folderNameOutput +'/'+folderNameOutput + '_' + str(l)
        utils.heatmapSave(np.array(R[l][0]).sum(axis=0), 3.5, 3.5, fileName)
        # utils.heatmapSaveGrey(np.array(R[l][0]).sum(axis=0), 3.5, 3.5, fileName+'_grey')

        # save the layers heatmap data in pickle
        with open(folderNameOutput2 + '/' + folderNameOutput2 + '_array'+ '_' + str(l) +'.pickle', 'wb') as handle:
            # save as array in pickle (running time  0.000823s)
            pickle.dump(np.array(R[l][0]).sum(axis=0), handle, protocol=pickle.HIGHEST_PROTOCOL)

        with open(folderNameOutput2 + '/' + folderNameOutput2 + '_dict'+ '_' + str(l) +'.pickle', 'wb') as handle:
            # save as dictionary in pickle (running time  0.2005s)
            dic = {}
            htmp = np.array(R[l][0]).sum(axis=0)
            htmp_1d = htmp.reshape(-1)

            for k, v in enumerate(htmp_1d):
                dic[str(k)] = str(np.round(v.astype(float), 5).astype(float))

            pickle.dump(dic, handle, protocol=pickle.HIGHEST_PROTOCOL)



def convert_pt2heatmap_Node_InLayer(folderNameInput, folderNameOutput, typeX, layerID, nodeID):

    tensorX = torch.load(folderNameInput+'/'+ typeX + '_l_' + str(layerID)+'.pt')

    if nodeID[0] =='[' and nodeID[-1] ==']':
        array = nodeID[1:-1].split(',')
        nodeID = [int(x) for x in array]
    elif nodeID == "All":
        pass
    else:
        nodeID = int(nodeID)

    if isinstance(nodeID, list):
        for nd in nodeID:
            fileName = folderNameOutput +'/'+folderNameOutput + '_l_' + str(layerID) + '_n_' + str(nd)
            if typeX == "A":
                temp = np.array(tensorX[0][nd].detach().numpy())
            elif typeX == "R":
                temp = np.array(tensorX[0][nd])
            utils.heatmapSave(temp, 3.5, 3.5, fileName)

    elif isinstance(nodeID, int):
        fileName = folderNameOutput +'/'+folderNameOutput + '_l_' + str(layerID) + '_n_' + str(nodeID)

        if typeX == "A":
            temp = np.array(tensorX[0][nodeID].detach().numpy())
        elif typeX == "R":
            temp = np.array(tensorX[0][nodeID])

        utils.heatmapSave(temp, 3.5, 3.5, fileName)

    elif nodeID =="All":
        for n in range(tensorX[0].shape[0]):
            if typeX == "A":
                temp = np.array(tensorX[0][n].detach().numpy())
            elif typeX == "R":
                temp = np.array(tensorX[0][n])
            fileName = folderNameOutput +'/'+folderNameOutput + '_l_' + str(layerID) + '_n_' + str(n)
            utils.heatmapSave(temp, 3.5, 3.5, fileName)

def save_intermediateNode_heatmaps(layerID, nodeID, typeX):

    folderNameInput ='intermediate_tensor' + typeX
    folderNameOutput = 'intermediate_Nodes'+ typeX; make_folder(folderNameOutput)

    convert_pt2heatmap_Node_InLayer(folderNameInput, folderNameOutput, typeX, layerID=layerID, nodeID = nodeID)


def save_intermediate_conservationR_layers():
    ''' get relevance sum of an entire layer to check conservation or not '''
    folderName = 'conservation_scores';make_folder(folderName)
    outputFileName = folderName +'/' + folderName
    conservation_output_dict = {}
    folderNameInput = 'intermediate_tensorR'
    for file in os.listdir(folderNameInput):
        if file.endswith(".pt"):
            tmp = file.split(".")[0]
            l = tmp.split("_")[-1]
            tensorX = torch.load(folderNameInput+'/R_l_' + str(l)+'.pt')
            res = tensorX.sum().detach().numpy().astype(float)
            conservation_output_dict['layer_'+str(l)] = {}
            conservation_output_dict['layer_'+str(l)]['conservationR'] = np.around(res,3).tolist()

    #json.dump(conservation_output_dict, codecs.open(outputFileName +'.json', 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True)
    with open(outputFileName+'.pickle', 'wb') as handle:
        pickle.dump(conservation_output_dict, handle, protocol=pickle.HIGHEST_PROTOCOL)

def load_layers(modelName):
    folderName =  modelName +'model'
    if os.path.isdir(folderName):
        #load the model
        L = len(os.listdir(folderName))
        layers = [None] * L

        for file in os.listdir(folderName):

            PATH =folderName + '/' + file
            tmp = file.split(".")[0]
            l = int(tmp.split("_")[-1])
            layers[l] = torch.load(PATH)

    ############

    else:
        print("save weight for the first time")
        make_folder(folderName)
        layerNames = {}

        if modelName == 'vgg16':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg16', pretrained=True); model.eval()
            # model = torchvision.models.vgg16(pretrained=True); model.eval()
        elif modelName == 'vgg19':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg19', pretrained=True); model.eval()
            # model = torchvision.models.vgg19(pretrained=True); model.eval()
        elif modelName == 'vgg11':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg11', pretrained=True); model.eval()
            # model = torchvision.models.vgg11(pretrained=True); model.eval()
        elif modelName == 'vgg13':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg13', pretrained=True); model.eval()
            # model = torchvision.models.vgg13(pretrained=True); model.eval()
        elif modelName == 'vgg11_bn':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg11_bn', pretrained=True); model.eval()
        elif modelName == 'vgg13_bn':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg13_bn', pretrained=True); model.eval()
        elif modelName == 'vgg16_bn':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg16_bn', pretrained=True); model.eval()
        elif modelName == 'vgg19_bn':
            model = torch.hub.load('pytorch/vision:v0.5.0', 'vgg19_bn', pretrained=True); model.eval()

        layers = get_layers(model)
        for l in range(len(layers)):
            print(l)
            torch.save(layers[l], folderName+'/layer_'+str(l)+'.pth' )
            # pdb.set_trace()
            if isinstance(layers[l], torch.nn.Conv2d): name = 'Conv2d'
            elif isinstance(layers[l], torch.nn.AvgPool2d): name = 'AvgPool2d'
            elif isinstance(layers[l], torch.nn.MaxPool2d): name = 'MaxPool2d'
            elif isinstance(layers[l], torch.nn.Dropout): name = 'Dropout'
            elif isinstance(layers[l], torch.nn.ReLU): name = 'ReLU'
            elif isinstance(layers[l], torch.nn.BatchNorm2d): name = 'BatchNorm2d'
            elif isinstance(layers[l], torch.nn.Linear): name = 'Linear'
            layerNames[l] = name
        with open('model_layerNames_dict.pickle', 'wb') as handle:
            pickle.dump(layerNames, handle, protocol=pickle.HIGHEST_PROTOCOL)

    return layers

def save_intermediate_entropy_layers():
    folderName_e = 'entropy_scores';make_folder(folderName_e)

    # entropy's fileName and dictionary
    fileName_e = folderName_e +'/' + folderName_e
    entropy_relevance_activation = {}

    folderNameInputR = 'intermediate_tensorR'
    folderNameInputA = 'intermediate_tensorA'
    for file in os.listdir(folderNameInputR):
        if file.endswith(".pt"):
            tmp = file.split(".")[0]
            l = tmp.split("_")[-1]
            R = torch.load(folderNameInputR+'/R_l_' + str(l)+'.pt')
            A = torch.load(folderNameInputA+'/A_l_' + str(l)+'.pt')

            a_e = minmax_scale(A[0].sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
            r_e_combination = minmax_scale(R[0].sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
            r_e_absolute = minmax_scale(torch.abs(R[0]).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
            r_e_positive = minmax_scale(torch.clamp(R[0], min = 0).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
            r_e_negative = minmax_scale(torch.clamp(R[0], max = 0).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))

            entropy_relevance_activation['layer_'+str(l)]  = {}

            np.seterr(divide='ignore', invalid='ignore')

            activation_entropy = np.around(np.nan_to_num(entropy(a_e, base=10)), decimals = 2).tolist()
            entropy_relevance_activation['layer_'+str(l)]['activation_entropy']= activation_entropy # if math.isnan(activation_entropy) else 0



            if int(l) < 38:
                relevance_entropy1 = np.around(np.nan_to_num( entropy(r_e_combination, base=10)), decimals = 2).tolist()
                if math.isnan(relevance_entropy1):
                    relevance_entropy = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_combination']=  relevance_entropy1
                relevance_entropy2 = np.around(np.nan_to_num( entropy(r_e_absolute, base=10)), decimals = 2).tolist()
                if math.isnan(relevance_entropy2):
                    relevance_entropy = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_absolute']=  relevance_entropy2
                relevance_entropy3 = np.around(np.nan_to_num( entropy(r_e_positive, base=10)), decimals = 2).tolist()
                if math.isnan(relevance_entropy3):
                    relevance_entropy = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_positive']=  relevance_entropy3
                relevance_entropy4 = np.around(np.nan_to_num( entropy(r_e_negative, base=10)), decimals = 2).tolist()
                if math.isnan(relevance_entropy4):
                    relevance_entropy4= 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_negative']=  relevance_entropy4

            else :
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_combination'] = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_absolute'] = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_positive'] = 0
                entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_negative'] = 0

    # json.dump(entropy_relevance_activation, codecs.open(fileName_e  +'.json', 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True)

    with open(fileName_e+'.pickle', 'wb') as handle:
        pickle.dump(entropy_relevance_activation, handle, protocol=pickle.HIGHEST_PROTOCOL)


# def save_intermediate_entropy_layers(R,A, stopLayer):
#     folderName_e = 'entropy_scores';make_folder(folderName_e)

#     # entropy's fileName and dictionary
#     fileName_e = folderName_e +'/' + folderName_e  +'.json'
#     entropy_relevance_activation = {}

#     # with concurrent.futures.ProcessPoolExecutor() as executor:
#     # saving entropy of relevance and activations in one layer in layers' corresponding json file
#     for l in range(stopLayer, len(R)):
#         ######---- computing relevance and activation's entropy value -----
#         a_e = minmax_scale(A[l][0].sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
#         r_e_combination = minmax_scale(R[l][0].sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
#         r_e_absolute = minmax_scale(torch.abs(R[l][0]).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
#         r_e_positive = minmax_scale(torch.clamp(R[l][0], min = 0).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))
#         r_e_negative = minmax_scale(torch.clamp(R[l][0], max = 0).sum(axis = (1, 2)).data.numpy().astype(float), feature_range=(0,1))

#         entropy_relevance_activation['layer_'+str(l)]  = {}

#         np.seterr(divide='ignore', invalid='ignore')

#         activation_entropy = np.around(entropy(a_e, base=10), decimals = 2).tolist()
#         entropy_relevance_activation['layer_'+str(l)]['activation_entropy']= activation_entropy if math.isnan(activation_entropy) else 0

#         if l < 38:
#             relevance_entropy1 = np.around(entropy(r_e_combination, base=10), decimals = 2).tolist()
#             if math.isnan(relevance_entropy1):
#                 relevance_entropy = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_combination']=  relevance_entropy1
#             relevance_entropy2 = np.around(entropy(r_e_absolute, base=10), decimals = 2).tolist()
#             if math.isnan(relevance_entropy2):
#                 relevance_entropy = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_absolute']=  relevance_entropy2
#             relevance_entropy3 = np.around(entropy(r_e_positive, base=10), decimals = 2).tolist()
#             if math.isnan(relevance_entropy3):
#                 relevance_entropy = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_positive']=  relevance_entropy3
#             relevance_entropy4 = np.around(entropy(r_e_negative, base=10), decimals = 2).tolist()
#             if math.isnan(relevance_entropy4):
#                 relevance_entropy4= 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_negative']=  relevance_entropy4

#         else :
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_combination'] = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_absolute'] = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_positive'] = 0
#             entropy_relevance_activation['layer_'+str(l)]['relevance_entropy_negative'] = 0

#     json.dump(entropy_relevance_activation, codecs.open(fileName_e, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True)


def save_intermediate_tensorX_pt(dataX, typeX):

    make_folder("intermediate_tensor"+ typeX)
    if typeX == "A" or typeX == "R":
        for l in range(len(dataX)):
            torch.save(dataX[l], "intermediate_tensor"+typeX+"/"+typeX+"_l_"+str(l)+".pt")
    else:
        for l in range(len(dataX)):

            if isinstance(dataX[l], torch.nn.modules.conv.Conv2d):
                try:
                    torch.save(dataX[l].weight.detach().numpy, "intermediate_tensor"+typeX+"/"+typeX+"_l_"+str(l)+".pt")
                except AttributeError: pass



def save_intermediate_All_Node_relevance_activation_pt(R,A):
    make_folder("intermediate_tensorR")
    make_folder("intermediate_tensorA")

    for l in range(len(R)):
        torch.save(R[l], "intermediate_tensorR/R_l_"+str(l)+".pt")

    for l in range(len(A)):
        torch.save(A[l].detach().numpy(), "intermediate_tensorA/A_l_"+str(l)+".pt")


def save_intermediate_All_Node_relevance_activation_heatmaps(R,A):
    folderName = 'intermediate_scores';make_folder(folderName)
    ROUND = 3

    for l in range(0, len(R)):
        ######---- computing relevance and activation's heatmap and sum_value value -----
        relevance_activation = {}
        fileName = folderName +'/' + folderName +'_' + str(l)

        NumberOfNodes = R[l][0].shape[0]

        for n in range(NumberOfNodes):

            heatmap_relevance = R[l][0][n].data.numpy().astype(float)
            heatmap_activation = A[l][0][n].data.numpy().astype(float)


            # # activation_heatmap
            # heatmap_activation = minmax_scale(heatmap_activation, feature_range=(0,1), axis = 0)

            # # relevance_heatmap
            # # get the ratio of postive range / negative range (negative range is defined by np.min(heatmap_relevance) < - 1e-9:)
            # if np.min(heatmap_relevance) < - 1e-9:
            #     ratio_pos_max_neg_min =  np.max(heatmap_relevance) / np.min(heatmap_relevance)
            #     #print(l,n, np.min(heatmap_relevance) < - 1e-9, "ratio_pos_max_neg_min",ratio_pos_max_neg_min)
            # else:
            #     ratio_pos_max_neg_min = np.min(heatmap_relevance)
            #     #print(l,n, 'else case','ratio_pos_max_neg_min',ratio_pos_max_neg_min)
            # # dealing with the positive value and negative value of a heatmap seperately with different ranges
            # condition = (heatmap_relevance > 0)*1
            # heatmap_relevance_p = minmax_scale(heatmap_relevance * condition, feature_range=(0,1), axis = 0)
            # condition = (heatmap_relevance < 0)*1
            # if ratio_pos_max_neg_min < 0:
            #     heatmap_relevance_n = minmax_scale(heatmap_relevance * condition, feature_range=(ratio_pos_max_neg_min,0), axis = 0)
            # else:
            #     # since the min value is equal to zero, just set zero.
            #     heatmap_relevance_n = heatmap_relevance * condition
            # heatmap_relevance = heatmap_relevance_p + heatmap_relevance_n


            # saving into dictionary
            relevance_activation['node_'+str(n)] = {}
            square_size = A[l][0][n].shape[0] * A[l][0][n].shape[1]
            # the sum is actually averaged
            relevance_activation['node_'+str(n)]['activation_sum'] = np.around((A[l][0][n].sum()/ square_size).data , decimals = ROUND).tolist()

            # if l == 1 and n ==0 :
            #     pdb.set_trace()
            # relevance_activation['node_'+str(n)]['relevance_sum'] = np.around(R[l][0][n].sum().data, decimals = ROUND).tolist()
            relevance_activation['node_'+str(n)]['relevance_sum_combination'] = np.around(heatmap_relevance.sum(), decimals = ROUND).tolist()

            relevance_sum_absolute = np.around(np.abs(heatmap_relevance).sum(), decimals = ROUND).tolist()
            relevance_activation['node_'+str(n)]['relevance_sum_absolute'] = relevance_sum_absolute
            relevance_sum_positive = np.around(heatmap_relevance[heatmap_relevance>0].sum(), decimals = ROUND).tolist()
            relevance_activation['node_'+str(n)]['relevance_sum_positive'] = relevance_sum_positive
            relevance_activation['node_'+str(n)]['relevance_sum_negative'] = relevance_activation['node_'+str(n)]['relevance_sum_combination'] - relevance_sum_positive #np.around(heatmap_relevance[heatmap_relevance<0].sum(), decimals = 2).tolist()


        ## save relevance and activation's heatmap and rainbow value
        # json.dump(relevance_activation, codecs.open(fileName +'.json', 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=2 )
        with open(fileName+'.pickle', 'wb') as handle:
            pickle.dump(relevance_activation, handle, protocol=pickle.HIGHEST_PROTOCOL)


# --------------------------------------
# Visualizing data
# --------------------------------------
def heatmap(R,sx,sy):

    b = 10*((np.abs(R)**3.0).mean()**(1.0/3))

    from matplotlib.colors import ListedColormap
    my_cmap = plt.cm.Spectral(np.arange(plt.cm.Spectral.N))
    my_cmap[:,0:3] *= 0.85
    my_cmap = ListedColormap(my_cmap)

    plt.figure(figsize=(sx,sy))
    plt.subplots_adjust(left=0,right=1,bottom=0,top=1)
    plt.axis('off')
    plt.imshow(R,cmap=my_cmap,vmin=-b,vmax=b,interpolation='nearest')
    plt.close()
    # plt.show()


def heatmapSave(R,sx,sy, imageSaveName):

    b = 10*((np.abs(R)**3.0).mean()**(1.0/3))

    my_cmap = plt.cm.seismic(np.arange(plt.cm.seismic.N))
    my_cmap[:,0:3] *= 0.85
    my_cmap = ListedColormap(my_cmap)
    plt.figure(figsize=(sx,sy))
    plt.subplots_adjust(left=0,right=1,bottom=0,top=1)
    plt.axis('off')

    figure = plt.gcf()

    plt.imshow(R,cmap=my_cmap,vmin=-b,vmax=b,interpolation='nearest')
    # plt.imshow(R,cmap=my_cmap,vmin=-b,vmax=b)
    # plt.draw()
    plt.savefig(imageSaveName)
    plt.close()


def heatmapSaveGrey(R,sx,sy, imageSaveName):
    R = np.nan_to_num(R)
    plt.figure(figsize=(sx,sy))
    plt.subplots_adjust(left=0,right=1,bottom=0,top=1)
    plt.axis('off')
    plt.imshow(R,interpolation='nearest',cmap='gray')

    ratio_to_min = 0
    Rmax = R.max()
    Rmin = R.min()

    if Rmin <0 and Rmax >0:
        ratio_to_min = np.around(np.abs(Rmin)/(Rmax +np.abs(Rmin)), 2)
    elif Rmax < 0:
        ratio_to_min = '100'
    elif Rmin > 0:
        ratio_to_min = '000'

    if isinstance(ratio_to_min, str):
        ratio =str(ratio_to_min)
    else:
        ratio = '0' + str(ratio_to_min)[2:]
        if len(ratio) <=2:
            ratio += '0'
    plt.savefig(imageSaveName + '_' + ratio)
    plt.close()



# --------------------------------------------------------------
# Clone a layer and pass its parameters through the function g
# --------------------------------------------------------------

def newlayer(layer, g):

    layer = copy.deepcopy(layer)

    try:
        layer.weight = nn.Parameter(g(layer.weight))

    except AttributeError: pass


    try: layer.bias   = nn.Parameter(g(layer.bias) )
    except AttributeError: pass

    return layer


def mask_forward_layer(layerToMask, indicesList):

    layer = copy.deepcopy(layerToMask)

    try:
        weight = layer.weight

        # prepare the mask
        mask = torch.zeros(weight.shape)
        if weight.shape[1:]:
            size = weight.shape[1:]
            for neuron_index in indicesList:
                mask[neuron_index,:,:,:]  = torch.ones(size)


        layer.weight = nn.Parameter(layer.weight * mask)

    except AttributeError:
        #print("*"*10)
        pass

    try:
        bias = layer.bias
        # prepare the mask
        mask = torch.zeros(bias.shape)
        size = bias.shape[0]
        for index in indicesList:
            mask[index]  = 1

        layer.bias = nn.Parameter(layer.bias * mask)
    except AttributeError: pass
    return layer

# --------------------------------------------------------------
# convert VGG classifier's dense layers to convolutional layers
# --------------------------------------------------------------

def toconv(layers):

    newlayers = []

    for i,layer in enumerate(layers):
        #print(layers)

        if isinstance(layer,nn.Linear):

            newlayer = None

            if i == 0:
                m,n = 512,layer.weight.shape[0]
                #print("m,n,layer.weight.shape:",m,n,layer.weight.shape)
                newlayer = nn.Conv2d(m,n,7)
                newlayer.weight = nn.Parameter(layer.weight.reshape(n,m,7,7))

            else:
                m,n = layer.weight.shape[1],layer.weight.shape[0]
                newlayer = nn.Conv2d(m,n,1)
                newlayer.weight = nn.Parameter(layer.weight.reshape(n,m,1,1))

            newlayer.bias = nn.Parameter(layer.bias)

            newlayers += [newlayer]

        else:
            newlayers += [layer]

    return newlayers




# --------------------------------------------------------------
# 1000 classes predicted by the VGG network
# --------------------------------------------------------------
imgclasses = {
 0: 'tench, Tinca tinca',
 1: 'goldfish, Carassius auratus',
 2: 'great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias',
 3: 'tiger shark, Galeocerdo cuvieri',
 4: 'hammerhead, hammerhead shark',
 5: 'electric ray, crampfish, numbfish, torpedo',
 6: 'stingray',
 7: 'cock',
 8: 'hen',
 9: 'ostrich, Struthio camelus',
 10: 'brambling, Fringilla montifringilla',
 11: 'goldfinch, Carduelis carduelis',
 12: 'house finch, linnet, Carpodacus mexicanus',
 13: 'junco, snowbird',
 14: 'indigo bunting, indigo finch, indigo bird, Passerina cyanea',
 15: 'robin, American robin, Turdus migratorius',
 16: 'bulbul',
 17: 'jay',
 18: 'magpie',
 19: 'chickadee',
 20: 'water ouzel, dipper',
 21: 'kite',
 22: 'bald eagle, American eagle, Haliaeetus leucocephalus',
 23: 'vulture',
 24: 'great grey owl, great gray owl, Strix nebulosa',
 25: 'European fire salamander, Salamandra salamandra',
 26: 'common newt, Triturus vulgaris',
 27: 'eft',
 28: 'spotted salamander, Ambystoma maculatum',
 29: 'axolotl, mud puppy, Ambystoma mexicanum',
 30: 'bullfrog, Rana catesbeiana',
 31: 'tree frog, tree-frog',
 32: 'tailed frog, bell toad, ribbed toad, tailed toad, Ascaphus trui',
 33: 'loggerhead, loggerhead turtle, Caretta caretta',
 34: 'leatherback turtle, leatherback, leathery turtle, Dermochelys coriacea',
 35: 'mud turtle',
 36: 'terrapin',
 37: 'box turtle, box tortoise',
 38: 'banded gecko',
 39: 'common iguana, iguana, Iguana iguana',
 40: 'American chameleon, anole, Anolis carolinensis',
 41: 'whiptail, whiptail lizard',
 42: 'agama',
 43: 'frilled lizard, Chlamydosaurus kingi',
 44: 'alligator lizard',
 45: 'Gila monster, Heloderma suspectum',
 46: 'green lizard, Lacerta viridis',
 47: 'African chameleon, Chamaeleo chamaeleon',
 48: 'Komodo dragon, Komodo lizard, dragon lizard, giant lizard, Varanus komodoensis',
 49: 'African crocodile, Nile crocodile, Crocodylus niloticus',
 50: 'American alligator, Alligator mississipiensis',
 51: 'triceratops',
 52: 'thunder snake, worm snake, Carphophis amoenus',
 53: 'ringneck snake, ring-necked snake, ring snake',
 54: 'hognose snake, puff adder, sand viper',
 55: 'green snake, grass snake',
 56: 'king snake, kingsnake',
 57: 'garter snake, grass snake',
 58: 'water snake',
 59: 'vine snake',
 60: 'night snake, Hypsiglena torquata',
 61: 'boa constrictor, Constrictor constrictor',
 62: 'rock python, rock snake, Python sebae',
 63: 'Indian cobra, Naja naja',
 64: 'green mamba',
 65: 'sea snake',
 66: 'horned viper, cerastes, sand viper, horned asp, Cerastes cornutus',
 67: 'diamondback, diamondback rattlesnake, Crotalus adamanteus',
 68: 'sidewinder, horned rattlesnake, Crotalus cerastes',
 69: 'trilobite',
 70: 'harvestman, daddy longlegs, Phalangium opilio',
 71: 'scorpion',
 72: 'black and gold garden spider, Argiope aurantia',
 73: 'barn spider, Araneus cavaticus',
 74: 'garden spider, Aranea diademata',
 75: 'black widow, Latrodectus mactans',
 76: 'tarantula',
 77: 'wolf spider, hunting spider',
 78: 'tick',
 79: 'centipede',
 80: 'black grouse',
 81: 'ptarmigan',
 82: 'ruffed grouse, partridge, Bonasa umbellus',
 83: 'prairie chicken, prairie grouse, prairie fowl',
 84: 'peacock',
 85: 'quail',
 86: 'partridge',
 87: 'African grey, African gray, Psittacus erithacus',
 88: 'macaw',
 89: 'sulphur-crested cockatoo, Kakatoe galerita, Cacatua galerita',
 90: 'lorikeet',
 91: 'coucal',
 92: 'bee eater',
 93: 'hornbill',
 94: 'hummingbird',
 95: 'jacamar',
 96: 'toucan',
 97: 'drake',
 98: 'red-breasted merganser, Mergus serrator',
 99: 'goose',
 100: 'black swan, Cygnus atratus',
 101: 'tusker',
 102: 'echidna, spiny anteater, anteater',
 103: 'platypus, duckbill, duckbilled platypus, duck-billed platypus, Ornithorhynchus anatinus',
 104: 'wallaby, brush kangaroo',
 105: 'koala, koala bear, kangaroo bear, native bear, Phascolarctos cinereus',
 106: 'wombat',
 107: 'jellyfish',
 108: 'sea anemone, anemone',
 109: 'brain coral',
 110: 'flatworm, platyhelminth',
 111: 'nematode, nematode worm, roundworm',
 112: 'conch',
 113: 'snail',
 114: 'slug',
 115: 'sea slug, nudibranch',
 116: 'chiton, coat-of-mail shell, sea cradle, polyplacophore',
 117: 'chambered nautilus, pearly nautilus, nautilus',
 118: 'Dungeness crab, Cancer magister',
 119: 'rock crab, Cancer irroratus',
 120: 'fiddler crab',
 121: 'king crab, Alaska crab, Alaskan king crab, Alaska king crab, Paralithodes camtschatica',
 122: 'American lobster, Northern lobster, Maine lobster, Homarus americanus',
 123: 'spiny lobster, langouste, rock lobster, crawfish, crayfish, sea crawfish',
 124: 'crayfish, crawfish, crawdad, crawdaddy',
 125: 'hermit crab',
 126: 'isopod',
 127: 'white stork, Ciconia ciconia',
 128: 'black stork, Ciconia nigra',
 129: 'spoonbill',
 130: 'flamingo',
 131: 'little blue heron, Egretta caerulea',
 132: 'American egret, great white heron, Egretta albus',
 133: 'bittern',
 134: 'crane',
 135: 'limpkin, Aramus pictus',
 136: 'European gallinule, Porphyrio porphyrio',
 137: 'American coot, marsh hen, mud hen, water hen, Fulica americana',
 138: 'bustard',
 139: 'ruddy turnstone, Arenaria interpres',
 140: 'red-backed sandpiper, dunlin, Erolia alpina',
 141: 'redshank, Tringa totanus',
 142: 'dowitcher',
 143: 'oystercatcher, oyster catcher',
 144: 'pelican',
 145: 'king penguin, Aptenodytes patagonica',
 146: 'albatross, mollymawk',
 147: 'grey whale, gray whale, devilfish, Eschrichtius gibbosus, Eschrichtius robustus',
 148: 'killer whale, killer, orca, grampus, sea wolf, Orcinus orca',
 149: 'dugong, Dugong dugon',
 150: 'sea lion',
 151: 'Chihuahua',
 152: 'Japanese spaniel',
 153: 'Maltese dog, Maltese terrier, Maltese',
 154: 'Pekinese, Pekingese, Peke',
 155: 'Shih-Tzu',
 156: 'Blenheim spaniel',
 157: 'papillon',
 158: 'toy terrier',
 159: 'Rhodesian ridgeback',
 160: 'Afghan hound, Afghan',
 161: 'basset, basset hound',
 162: 'beagle',
 163: 'bloodhound, sleuthhound',
 164: 'bluetick',
 165: 'black-and-tan coonhound',
 166: 'Walker hound, Walker foxhound',
 167: 'English foxhound',
 168: 'redbone',
 169: 'borzoi, Russian wolfhound',
 170: 'Irish wolfhound',
 171: 'Italian greyhound',
 172: 'whippet',
 173: 'Ibizan hound, Ibizan Podenco',
 174: 'Norwegian elkhound, elkhound',
 175: 'otterhound, otter hound',
 176: 'Saluki, gazelle hound',
 177: 'Scottish deerhound, deerhound',
 178: 'Weimaraner',
 179: 'Staffordshire bullterrier, Staffordshire bull terrier',
 180: 'American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier',
 181: 'Bedlington terrier',
 182: 'Border terrier',
 183: 'Kerry blue terrier',
 184: 'Irish terrier',
 185: 'Norfolk terrier',
 186: 'Norwich terrier',
 187: 'Yorkshire terrier',
 188: 'wire-haired fox terrier',
 189: 'Lakeland terrier',
 190: 'Sealyham terrier, Sealyham',
 191: 'Airedale, Airedale terrier',
 192: 'cairn, cairn terrier',
 193: 'Australian terrier',
 194: 'Dandie Dinmont, Dandie Dinmont terrier',
 195: 'Boston bull, Boston terrier',
 196: 'miniature schnauzer',
 197: 'giant schnauzer',
 198: 'standard schnauzer',
 199: 'Scotch terrier, Scottish terrier, Scottie',
 200: 'Tibetan terrier, chrysanthemum dog',
 201: 'silky terrier, Sydney silky',
 202: 'soft-coated wheaten terrier',
 203: 'West Highland white terrier',
 204: 'Lhasa, Lhasa apso',
 205: 'flat-coated retriever',
 206: 'curly-coated retriever',
 207: 'golden retriever',
 208: 'Labrador retriever',
 209: 'Chesapeake Bay retriever',
 210: 'German short-haired pointer',
 211: 'vizsla, Hungarian pointer',
 212: 'English setter',
 213: 'Irish setter, red setter',
 214: 'Gordon setter',
 215: 'Brittany spaniel',
 216: 'clumber, clumber spaniel',
 217: 'English springer, English springer spaniel',
 218: 'Welsh springer spaniel',
 219: 'cocker spaniel, English cocker spaniel, cocker',
 220: 'Sussex spaniel',
 221: 'Irish water spaniel',
 222: 'kuvasz',
 223: 'schipperke',
 224: 'groenendael',
 225: 'malinois',
 226: 'briard',
 227: 'kelpie',
 228: 'komondor',
 229: 'Old English sheepdog, bobtail',
 230: 'Shetland sheepdog, Shetland sheep dog, Shetland',
 231: 'collie',
 232: 'Border collie',
 233: 'Bouvier des Flandres, Bouviers des Flandres',
 234: 'Rottweiler',
 235: 'German shepherd, German shepherd dog, German police dog, alsatian',
 236: 'Doberman, Doberman pinscher',
 237: 'miniature pinscher',
 238: 'Greater Swiss Mountain dog',
 239: 'Bernese mountain dog',
 240: 'Appenzeller',
 241: 'EntleBucher',
 242: 'boxer',
 243: 'bull mastiff',
 244: 'Tibetan mastiff',
 245: 'French bulldog',
 246: 'Great Dane',
 247: 'Saint Bernard, St Bernard',
 248: 'Eskimo dog, husky',
 249: 'malamute, malemute, Alaskan malamute',
 250: 'Siberian husky',
 251: 'dalmatian, coach dog, carriage dog',
 252: 'affenpinscher, monkey pinscher, monkey dog',
 253: 'basenji',
 254: 'pug, pug-dog',
 255: 'Leonberg',
 256: 'Newfoundland, Newfoundland dog',
 257: 'Great Pyrenees',
 258: 'Samoyed, Samoyede',
 259: 'Pomeranian',
 260: 'chow, chow chow',
 261: 'keeshond',
 262: 'Brabancon griffon',
 263: 'Pembroke, Pembroke Welsh corgi',
 264: 'Cardigan, Cardigan Welsh corgi',
 265: 'toy poodle',
 266: 'miniature poodle',
 267: 'standard poodle',
 268: 'Mexican hairless',
 269: 'timber wolf, grey wolf, gray wolf, Canis lupus',
 270: 'white wolf, Arctic wolf, Canis lupus tundrarum',
 271: 'red wolf, maned wolf, Canis rufus, Canis niger',
 272: 'coyote, prairie wolf, brush wolf, Canis latrans',
 273: 'dingo, warrigal, warragal, Canis dingo',
 274: 'dhole, Cuon alpinus',
 275: 'African hunting dog, hyena dog, Cape hunting dog, Lycaon pictus',
 276: 'hyena, hyaena',
 277: 'red fox, Vulpes vulpes',
 278: 'kit fox, Vulpes macrotis',
 279: 'Arctic fox, white fox, Alopex lagopus',
 280: 'grey fox, gray fox, Urocyon cinereoargenteus',
 281: 'tabby, tabby cat',
 282: 'tiger cat',
 283: 'Persian cat',
 284: 'Siamese cat, Siamese',
 285: 'Egyptian cat',
 286: 'cougar, puma, catamount, mountain lion, painter, panther, Felis concolor',
 287: 'lynx, catamount',
 288: 'leopard, Panthera pardus',
 289: 'snow leopard, ounce, Panthera uncia',
 290: 'jaguar, panther, Panthera onca, Felis onca',
 291: 'lion, king of beasts, Panthera leo',
 292: 'tiger, Panthera tigris',
 293: 'cheetah, chetah, Acinonyx jubatus',
 294: 'brown bear, bruin, Ursus arctos',
 295: 'American black bear, black bear, Ursus americanus, Euarctos americanus',
 296: 'ice bear, polar bear, Ursus Maritimus, Thalarctos maritimus',
 297: 'sloth bear, Melursus ursinus, Ursus ursinus',
 298: 'mongoose',
 299: 'meerkat, mierkat',
 300: 'tiger beetle',
 301: 'ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle',
 302: 'ground beetle, carabid beetle',
 303: 'long-horned beetle, longicorn, longicorn beetle',
 304: 'leaf beetle, chrysomelid',
 305: 'dung beetle',
 306: 'rhinoceros beetle',
 307: 'weevil',
 308: 'fly',
 309: 'bee',
 310: 'ant, emmet, pismire',
 311: 'grasshopper, hopper',
 312: 'cricket',
 313: 'walking stick, walkingstick, stick insect',
 314: 'cockroach, roach',
 315: 'mantis, mantid',
 316: 'cicada, cicala',
 317: 'leafhopper',
 318: 'lacewing, lacewing fly',
 319: "dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk",
 320: 'damselfly',
 321: 'admiral',
 322: 'ringlet, ringlet butterfly',
 323: 'monarch, monarch butterfly, milkweed butterfly, Danaus plexippus',
 324: 'cabbage butterfly',
 325: 'sulphur butterfly, sulfur butterfly',
 326: 'lycaenid, lycaenid butterfly',
 327: 'starfish, sea star',
 328: 'sea urchin',
 329: 'sea cucumber, holothurian',
 330: 'wood rabbit, cottontail, cottontail rabbit',
 331: 'hare',
 332: 'Angora, Angora rabbit',
 333: 'hamster',
 334: 'porcupine, hedgehog',
 335: 'fox squirrel, eastern fox squirrel, Sciurus niger',
 336: 'marmot',
 337: 'beaver',
 338: 'guinea pig, Cavia cobaya',
 339: 'sorrel',
 340: 'zebra',
 341: 'hog, pig, grunter, squealer, Sus scrofa',
 342: 'wild boar, boar, Sus scrofa',
 343: 'warthog',
 344: 'hippopotamus, hippo, river horse, Hippopotamus amphibius',
 345: 'ox',
 346: 'water buffalo, water ox, Asiatic buffalo, Bubalus bubalis',
 347: 'bison',
 348: 'ram, tup',
 349: 'bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis',
 350: 'ibex, Capra ibex',
 351: 'hartebeest',
 352: 'impala, Aepyceros melampus',
 353: 'gazelle',
 354: 'Arabian camel, dromedary, Camelus dromedarius',
 355: 'llama',
 356: 'weasel',
 357: 'mink',
 358: 'polecat, fitch, foulmart, foumart, Mustela putorius',
 359: 'black-footed ferret, ferret, Mustela nigripes',
 360: 'otter',
 361: 'skunk, polecat, wood pussy',
 362: 'badger',
 363: 'armadillo',
 364: 'three-toed sloth, ai, Bradypus tridactylus',
 365: 'orangutan, orang, orangutang, Pongo pygmaeus',
 366: 'gorilla, Gorilla gorilla',
 367: 'chimpanzee, chimp, Pan troglodytes',
 368: 'gibbon, Hylobates lar',
 369: 'siamang, Hylobates syndactylus, Symphalangus syndactylus',
 370: 'guenon, guenon monkey',
 371: 'patas, hussar monkey, Erythrocebus patas',
 372: 'baboon',
 373: 'macaque',
 374: 'langur',
 375: 'colobus, colobus monkey',
 376: 'proboscis monkey, Nasalis larvatus',
 377: 'marmoset',
 378: 'capuchin, ringtail, Cebus capucinus',
 379: 'howler monkey, howler',
 380: 'titi, titi monkey',
 381: 'spider monkey, Ateles geoffroyi',
 382: 'squirrel monkey, Saimiri sciureus',
 383: 'Madagascar cat, ring-tailed lemur, Lemur catta',
 384: 'indri, indris, Indri indri, Indri brevicaudatus',
 385: 'Indian elephant, Elephas maximus',
 386: 'African elephant, Loxodonta africana',
 387: 'lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens',
 388: 'giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca',
 389: 'barracouta, snoek',
 390: 'eel',
 391: 'coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch',
 392: 'rock beauty, Holocanthus tricolor',
 393: 'anemone fish',
 394: 'sturgeon',
 395: 'gar, garfish, garpike, billfish, Lepisosteus osseus',
 396: 'lionfish',
 397: 'puffer, pufferfish, blowfish, efish',
 398: 'abacus',
 399: 'abaya',
 400: "academic gown, academic robe, judge's robe",
 401: 'accordion, piano accordion, squeeze box',
 402: 'acoustic guitar',
 403: 'aircraft carrier, carrier, flattop, attack aircraft carrier',
 404: 'airliner',
 405: 'airship, dirigible',
 406: 'altar',
 407: 'ambulance',
 408: 'amphibian, amphibious vehicle',
 409: 'analog clock',
 410: 'apiary, bee house',
 411: 'apron',
 412: 'ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin',
 413: 'assault rifle, assault gun',
 414: 'backpack, back pack, knapsack, packsack, rucksack, haversack',
 415: 'bakery, bakeshop, bakehouse',
 416: 'balance beam, beam',
 417: 'balloon',
 418: 'ballpoint, ballpoint pen, ballpen, Biro',
 419: 'Band Aid',
 420: 'banjo',
 421: 'bannister, banister, balustrade, balusters, handrail',
 422: 'barbell',
 423: 'barber chair',
 424: 'barbershop',
 425: 'barn',
 426: 'barometer',
 427: 'barrel, cask',
 428: 'barrow, garden cart, lawn cart, wheelbarrow',
 429: 'baseball',
 430: 'basketball',
 431: 'bassinet',
 432: 'bassoon',
 433: 'bathing cap, swimming cap',
 434: 'bath towel',
 435: 'bathtub, bathing tub, bath, tub',
 436: 'beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon',
 437: 'beacon, lighthouse, beacon light, pharos',
 438: 'beaker',
 439: 'bearskin, busby, shako',
 440: 'beer bottle',
 441: 'beer glass',
 442: 'bell cote, bell cot',
 443: 'bib',
 444: 'bicycle-built-for-two, tandem bicycle, tandem',
 445: 'bikini, two-piece',
 446: 'binder, ring-binder',
 447: 'binoculars, field glasses, opera glasses',
 448: 'birdhouse',
 449: 'boathouse',
 450: 'bobsled, bobsleigh, bob',
 451: 'bolo tie, bolo, bola tie, bola',
 452: 'bonnet, poke bonnet',
 453: 'bookcase',
 454: 'bookshop, bookstore, bookstall',
 455: 'bottlecap',
 456: 'bow',
 457: 'bow tie, bow-tie, bowtie',
 458: 'brass, memorial tablet, plaque',
 459: 'brassiere, bra, bandeau',
 460: 'breakwater, groin, groyne, mole, bulwark, seawall, jetty',
 461: 'breastplate, aegis, egis',
 462: 'broom',
 463: 'bucket, pail',
 464: 'buckle',
 465: 'bulletproof vest',
 466: 'bullet train, bullet',
 467: 'butcher shop, meat market',
 468: 'cab, hack, taxi, taxicab',
 469: 'caldron, cauldron',
 470: 'candle, taper, wax light',
 471: 'cannon',
 472: 'canoe',
 473: 'can opener, tin opener',
 474: 'cardigan',
 475: 'car mirror',
 476: 'carousel, carrousel, merry-go-round, roundabout, whirligig',
 477: "carpenter's kit, tool kit",
 478: 'carton',
 479: 'car wheel',
 480: 'cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM',
 481: 'cassette',
 482: 'cassette player',
 483: 'castle',
 484: 'catamaran',
 485: 'CD player',
 486: 'cello, violoncello',
 487: 'cellular telephone, cellular phone, cellphone, cell, mobile phone',
 488: 'chain',
 489: 'chainlink fence',
 490: 'chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour',
 491: 'chain saw, chainsaw',
 492: 'chest',
 493: 'chiffonier, commode',
 494: 'chime, bell, gong',
 495: 'china cabinet, china closet',
 496: 'Christmas stocking',
 497: 'church, church building',
 498: 'cinema, movie theater, movie theatre, movie house, picture palace',
 499: 'cleaver, meat cleaver, chopper',
 500: 'cliff dwelling',
 501: 'cloak',
 502: 'clog, geta, patten, sabot',
 503: 'cocktail shaker',
 504: 'coffee mug',
 505: 'coffeepot',
 506: 'coil, spiral, volute, whorl, helix',
 507: 'combination lock',
 508: 'computer keyboard, keypad',
 509: 'confectionery, confectionary, candy store',
 510: 'container ship, containership, container vessel',
 511: 'convertible',
 512: 'corkscrew, bottle screw',
 513: 'cornet, horn, trumpet, trump',
 514: 'cowboy boot',
 515: 'cowboy hat, ten-gallon hat',
 516: 'cradle',
 517: 'crane',
 518: 'crash helmet',
 519: 'crate',
 520: 'crib, cot',
 521: 'Crock Pot',
 522: 'croquet ball',
 523: 'crutch',
 524: 'cuirass',
 525: 'dam, dike, dyke',
 526: 'desk',
 527: 'desktop computer',
 528: 'dial telephone, dial phone',
 529: 'diaper, nappy, napkin',
 530: 'digital clock',
 531: 'digital watch',
 532: 'dining table, board',
 533: 'dishrag, dishcloth',
 534: 'dishwasher, dish washer, dishwashing machine',
 535: 'disk brake, disc brake',
 536: 'dock, dockage, docking facility',
 537: 'dogsled, dog sled, dog sleigh',
 538: 'dome',
 539: 'doormat, welcome mat',
 540: 'drilling platform, offshore rig',
 541: 'drum, membranophone, tympan',
 542: 'drumstick',
 543: 'dumbbell',
 544: 'Dutch oven',
 545: 'electric fan, blower',
 546: 'electric guitar',
 547: 'electric locomotive',
 548: 'entertainment center',
 549: 'envelope',
 550: 'espresso maker',
 551: 'face powder',
 552: 'feather boa, boa',
 553: 'file, file cabinet, filing cabinet',
 554: 'fireboat',
 555: 'fire engine, fire truck',
 556: 'fire screen, fireguard',
 557: 'flagpole, flagstaff',
 558: 'flute, transverse flute',
 559: 'folding chair',
 560: 'football helmet',
 561: 'forklift',
 562: 'fountain',
 563: 'fountain pen',
 564: 'four-poster',
 565: 'freight car',
 566: 'French horn, horn',
 567: 'frying pan, frypan, skillet',
 568: 'fur coat',
 569: 'garbage truck, dustcart',
 570: 'gasmask, respirator, gas helmet',
 571: 'gas pump, gasoline pump, petrol pump, island dispenser',
 572: 'goblet',
 573: 'go-kart',
 574: 'golf ball',
 575: 'golfcart, golf cart',
 576: 'gondola',
 577: 'gong, tam-tam',
 578: 'gown',
 579: 'grand piano, grand',
 580: 'greenhouse, nursery, glasshouse',
 581: 'grille, radiator grille',
 582: 'grocery store, grocery, food market, market',
 583: 'guillotine',
 584: 'hair slide',
 585: 'hair spray',
 586: 'half track',
 587: 'hammer',
 588: 'hamper',
 589: 'hand blower, blow dryer, blow drier, hair dryer, hair drier',
 590: 'hand-held computer, hand-held microcomputer',
 591: 'handkerchief, hankie, hanky, hankey',
 592: 'hard disc, hard disk, fixed disk',
 593: 'harmonica, mouth organ, harp, mouth harp',
 594: 'harp',
 595: 'harvester, reaper',
 596: 'hatchet',
 597: 'holster',
 598: 'home theater, home theatre',
 599: 'honeycomb',
 600: 'hook, claw',
 601: 'hoopskirt, crinoline',
 602: 'horizontal bar, high bar',
 603: 'horse cart, horse-cart',
 604: 'hourglass',
 605: 'iPod',
 606: 'iron, smoothing iron',
 607: "jack-o'-lantern",
 608: 'jean, blue jean, denim',
 609: 'jeep, landrover',
 610: 'jersey, T-shirt, tee shirt',
 611: 'jigsaw puzzle',
 612: 'jinrikisha, ricksha, rickshaw',
 613: 'joystick',
 614: 'kimono',
 615: 'knee pad',
 616: 'knot',
 617: 'lab coat, laboratory coat',
 618: 'ladle',
 619: 'lampshade, lamp shade',
 620: 'laptop, laptop computer',
 621: 'lawn mower, mower',
 622: 'lens cap, lens cover',
 623: 'letter opener, paper knife, paperknife',
 624: 'library',
 625: 'lifeboat',
 626: 'lighter, light, igniter, ignitor',
 627: 'limousine, limo',
 628: 'liner, ocean liner',
 629: 'lipstick, lip rouge',
 630: 'Loafer',
 631: 'lotion',
 632: 'loudspeaker, speaker, speaker unit, loudspeaker system, speaker system',
 633: "loupe, jeweler's loupe",
 634: 'lumbermill, sawmill',
 635: 'magnetic compass',
 636: 'mailbag, postbag',
 637: 'mailbox, letter box',
 638: 'maillot',
 639: 'maillot, tank suit',
 640: 'manhole cover',
 641: 'maraca',
 642: 'marimba, xylophone',
 643: 'mask',
 644: 'matchstick',
 645: 'maypole',
 646: 'maze, labyrinth',
 647: 'measuring cup',
 648: 'medicine chest, medicine cabinet',
 649: 'megalith, megalithic structure',
 650: 'microphone, mike',
 651: 'microwave, microwave oven',
 652: 'military uniform',
 653: 'milk can',
 654: 'minibus',
 655: 'miniskirt, mini',
 656: 'minivan',
 657: 'missile',
 658: 'mitten',
 659: 'mixing bowl',
 660: 'mobile home, manufactured home',
 661: 'Model T',
 662: 'modem',
 663: 'monastery',
 664: 'monitor',
 665: 'moped',
 666: 'mortar',
 667: 'mortarboard',
 668: 'mosque',
 669: 'mosquito net',
 670: 'motor scooter, scooter',
 671: 'mountain bike, all-terrain bike, off-roader',
 672: 'mountain tent',
 673: 'mouse, computer mouse',
 674: 'mousetrap',
 675: 'moving van',
 676: 'muzzle',
 677: 'nail',
 678: 'neck brace',
 679: 'necklace',
 680: 'nipple',
 681: 'notebook, notebook computer',
 682: 'obelisk',
 683: 'oboe, hautboy, hautbois',
 684: 'ocarina, sweet potato',
 685: 'odometer, hodometer, mileometer, milometer',
 686: 'oil filter',
 687: 'organ, pipe organ',
 688: 'oscilloscope, scope, cathode-ray oscilloscope, CRO',
 689: 'overskirt',
 690: 'oxcart',
 691: 'oxygen mask',
 692: 'packet',
 693: 'paddle, boat paddle',
 694: 'paddlewheel, paddle wheel',
 695: 'padlock',
 696: 'paintbrush',
 697: "pajama, pyjama, pj's, jammies",
 698: 'palace',
 699: 'panpipe, pandean pipe, syrinx',
 700: 'paper towel',
 701: 'parachute, chute',
 702: 'parallel bars, bars',
 703: 'park bench',
 704: 'parking meter',
 705: 'passenger car, coach, carriage',
 706: 'patio, terrace',
 707: 'pay-phone, pay-station',
 708: 'pedestal, plinth, footstall',
 709: 'pencil box, pencil case',
 710: 'pencil sharpener',
 711: 'perfume, essence',
 712: 'Petri dish',
 713: 'photocopier',
 714: 'pick, plectrum, plectron',
 715: 'pickelhaube',
 716: 'picket fence, paling',
 717: 'pickup, pickup truck',
 718: 'pier',
 719: 'piggy bank, penny bank',
 720: 'pill bottle',
 721: 'pillow',
 722: 'ping-pong ball',
 723: 'pinwheel',
 724: 'pirate, pirate ship',
 725: 'pitcher, ewer',
 726: "plane, carpenter's plane, woodworking plane",
 727: 'planetarium',
 728: 'plastic bag',
 729: 'plate rack',
 730: 'plow, plough',
 731: "plunger, plumber's helper",
 732: 'Polaroid camera, Polaroid Land camera',
 733: 'pole',
 734: 'police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria',
 735: 'poncho',
 736: 'pool table, billiard table, snooker table',
 737: 'pop bottle, soda bottle',
 738: 'pot, flowerpot',
 739: "potter's wheel",
 740: 'power drill',
 741: 'prayer rug, prayer mat',
 742: 'printer',
 743: 'prison, prison house',
 744: 'projectile, missile',
 745: 'projector',
 746: 'puck, hockey puck',
 747: 'punching bag, punch bag, punching ball, punchball',
 748: 'purse',
 749: 'quill, quill pen',
 750: 'quilt, comforter, comfort, puff',
 751: 'racer, race car, racing car',
 752: 'racket, racquet',
 753: 'radiator',
 754: 'radio, wireless',
 755: 'radio telescope, radio reflector',
 756: 'rain barrel',
 757: 'recreational vehicle, RV, R.V.',
 758: 'reel',
 759: 'reflex camera',
 760: 'refrigerator, icebox',
 761: 'remote control, remote',
 762: 'restaurant, eating house, eating place, eatery',
 763: 'revolver, six-gun, six-shooter',
 764: 'rifle',
 765: 'rocking chair, rocker',
 766: 'rotisserie',
 767: 'rubber eraser, rubber, pencil eraser',
 768: 'rugby ball',
 769: 'rule, ruler',
 770: 'running shoe',
 771: 'safe',
 772: 'safety pin',
 773: 'saltshaker, salt shaker',
 774: 'sandal',
 775: 'sarong',
 776: 'sax, saxophone',
 777: 'scabbard',
 778: 'scale, weighing machine',
 779: 'school bus',
 780: 'schooner',
 781: 'scoreboard',
 782: 'screen, CRT screen',
 783: 'screw',
 784: 'screwdriver',
 785: 'seat belt, seatbelt',
 786: 'sewing machine',
 787: 'shield, buckler',
 788: 'shoe shop, shoe-shop, shoe store',
 789: 'shoji',
 790: 'shopping basket',
 791: 'shopping cart',
 792: 'shovel',
 793: 'shower cap',
 794: 'shower curtain',
 795: 'ski',
 796: 'ski mask',
 797: 'sleeping bag',
 798: 'slide rule, slipstick',
 799: 'sliding door',
 800: 'slot, one-armed bandit',
 801: 'snorkel',
 802: 'snowmobile',
 803: 'snowplow, snowplough',
 804: 'soap dispenser',
 805: 'soccer ball',
 806: 'sock',
 807: 'solar dish, solar collector, solar furnace',
 808: 'sombrero',
 809: 'soup bowl',
 810: 'space bar',
 811: 'space heater',
 812: 'space shuttle',
 813: 'spatula',
 814: 'speedboat',
 815: "spider web, spider's web",
 816: 'spindle',
 817: 'sports car, sport car',
 818: 'spotlight, spot',
 819: 'stage',
 820: 'steam locomotive',
 821: 'steel arch bridge',
 822: 'steel drum',
 823: 'stethoscope',
 824: 'stole',
 825: 'stone wall',
 826: 'stopwatch, stop watch',
 827: 'stove',
 828: 'strainer',
 829: 'streetcar, tram, tramcar, trolley, trolley car',
 830: 'stretcher',
 831: 'studio couch, day bed',
 832: 'stupa, tope',
 833: 'submarine, pigboat, sub, U-boat',
 834: 'suit, suit of clothes',
 835: 'sundial',
 836: 'sunglass',
 837: 'sunglasses, dark glasses, shades',
 838: 'sunscreen, sunblock, sun blocker',
 839: 'suspension bridge',
 840: 'swab, swob, mop',
 841: 'sweatshirt',
 842: 'swimming trunks, bathing trunks',
 843: 'swing',
 844: 'switch, electric switch, electrical switch',
 845: 'syringe',
 846: 'table lamp',
 847: 'tank, army tank, armored combat vehicle, armoured combat vehicle',
 848: 'tape player',
 849: 'teapot',
 850: 'teddy, teddy bear',
 851: 'television, television system',
 852: 'tennis ball',
 853: 'thatch, thatched roof',
 854: 'theater curtain, theatre curtain',
 855: 'thimble',
 856: 'thresher, thrasher, threshing machine',
 857: 'throne',
 858: 'tile roof',
 859: 'toaster',
 860: 'tobacco shop, tobacconist shop, tobacconist',
 861: 'toilet seat',
 862: 'torch',
 863: 'totem pole',
 864: 'tow truck, tow car, wrecker',
 865: 'toyshop',
 866: 'tractor',
 867: 'trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi',
 868: 'tray',
 869: 'trench coat',
 870: 'tricycle, trike, velocipede',
 871: 'trimaran',
 872: 'tripod',
 873: 'triumphal arch',
 874: 'trolleybus, trolley coach, trackless trolley',
 875: 'trombone',
 876: 'tub, vat',
 877: 'turnstile',
 878: 'typewriter keyboard',
 879: 'umbrella',
 880: 'unicycle, monocycle',
 881: 'upright, upright piano',
 882: 'vacuum, vacuum cleaner',
 883: 'vase',
 884: 'vault',
 885: 'velvet',
 886: 'vending machine',
 887: 'vestment',
 888: 'viaduct',
 889: 'violin, fiddle',
 890: 'volleyball',
 891: 'waffle iron',
 892: 'wall clock',
 893: 'wallet, billfold, notecase, pocketbook',
 894: 'wardrobe, closet, press',
 895: 'warplane, military plane',
 896: 'washbasin, handbasin, washbowl, lavabo, wash-hand basin',
 897: 'washer, automatic washer, washing machine',
 898: 'water bottle',
 899: 'water jug',
 900: 'water tower',
 901: 'whiskey jug',
 902: 'whistle',
 903: 'wig',
 904: 'window screen',
 905: 'window shade',
 906: 'Windsor tie',
 907: 'wine bottle',
 908: 'wing',
 909: 'wok',
 910: 'wooden spoon',
 911: 'wool, woolen, woollen',
 912: 'worm fence, snake fence, snake-rail fence, Virginia fence',
 913: 'wreck',
 914: 'yawl',
 915: 'yurt',
 916: 'web site, website, internet site, site',
 917: 'comic book',
 918: 'crossword puzzle, crossword',
 919: 'street sign',
 920: 'traffic light, traffic signal, stoplight',
 921: 'book jacket, dust cover, dust jacket, dust wrapper',
 922: 'menu',
 923: 'plate',
 924: 'guacamole',
 925: 'consomme',
 926: 'hot pot, hotpot',
 927: 'trifle',
 928: 'ice cream, icecream',
 929: 'ice lolly, lolly, lollipop, popsicle',
 930: 'French loaf',
 931: 'bagel, beigel',
 932: 'pretzel',
 933: 'cheeseburger',
 934: 'hotdog, hot dog, red hot',
 935: 'mashed potato',
 936: 'head cabbage',
 937: 'broccoli',
 938: 'cauliflower',
 939: 'zucchini, courgette',
 940: 'spaghetti squash',
 941: 'acorn squash',
 942: 'butternut squash',
 943: 'cucumber, cuke',
 944: 'artichoke, globe artichoke',
 945: 'bell pepper',
 946: 'cardoon',
 947: 'mushroom',
 948: 'Granny Smith',
 949: 'strawberry',
 950: 'orange',
 951: 'lemon',
 952: 'fig',
 953: 'pineapple, ananas',
 954: 'banana',
 955: 'jackfruit, jak, jack',
 956: 'custard apple',
 957: 'pomegranate',
 958: 'hay',
 959: 'carbonara',
 960: 'chocolate sauce, chocolate syrup',
 961: 'dough',
 962: 'meat loaf, meatloaf',
 963: 'pizza, pizza pie',
 964: 'potpie',
 965: 'burrito',
 966: 'red wine',
 967: 'espresso',
 968: 'cup',
 969: 'eggnog',
 970: 'alp',
 971: 'bubble',
 972: 'cliff, drop, drop-off',
 973: 'coral reef',
 974: 'geyser',
 975: 'lakeside, lakeshore',
 976: 'promontory, headland, head, foreland',
 977: 'sandbar, sand bar',
 978: 'seashore, coast, seacoast, sea-coast',
 979: 'valley, vale',
 980: 'volcano',
 981: 'ballplayer, baseball player',
 982: 'groom, bridegroom',
 983: 'scuba diver',
 984: 'rapeseed',
 985: 'daisy',
 986: "yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum",
 987: 'corn',
 988: 'acorn',
 989: 'hip, rose hip, rosehip',
 990: 'buckeye, horse chestnut, conker',
 991: 'coral fungus',
 992: 'agaric',
 993: 'gyromitra',
 994: 'stinkhorn, carrion fungus',
 995: 'earthstar',
 996: 'hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa',
 997: 'bolete',
 998: 'ear, spike, capitulum',
 999: 'toilet tissue, toilet paper, bathroom tissue'
}


