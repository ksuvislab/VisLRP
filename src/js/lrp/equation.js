import $ from 'jquery';
import * as algebra from 'algebra.js';
import katex from 'katex';

var inputLabels = {
    'theta0': 'Theta0 (&#952;<sub>0</sub>)',
    'theta1': 'Theta1 (&#952;<sub>1</sub>)',
    'gamma0': 'Gamma0 (&#947;<sub>0</sub>)',
    'gamma1': 'Gamma1 (&#947;<sub>1</sub>)',
    'gamma1p': 'Gamma1p (&#947;<sub>1p</sub>)',
    'gamma1n': 'Gamma1n (&#947;<sub>1n</sub>)',
    'gamma2': 'Gamma2 (&#947;<sub>2</sub>)',
    'eps': 'Epsilon (&#949;)',
    'alpha': 'Alpha (&#945;)',
    'beta': 'Beta (&#946;)',
}

export default function (container, segmentData) {

    //console.log(segmentData);

    container.empty();

    var subtitute = {};

    Object.keys(inputLabels).forEach(function(parameter) {
        subtitute[parameter] = (segmentData[parameter] > 0 && segmentData[parameter] < 4) ? segmentData[parameter].toString() : segmentData[parameter];
    });

    //console.log(subtitute);

    // Start left part with theta 0
    let theta0 = new algebra.Expression(subtitute['theta0']);
    let theta1_aj = new algebra.Expression(subtitute['theta1']);
    theta1_aj = theta1_aj.multiply('a_i');

    // w1 = wjk
    let gamma1_w1 = new algebra.Expression(subtitute['gamma1']);
    gamma1_w1 = gamma1_w1.multiply('w_{ij}');

    // w2 = wjk+
    let gamma1p_w2 = new algebra.Expression(subtitute['gamma1p']);
    gamma1p_w2 = gamma1p_w2.multiply('w_{ij}^{+}');

    // w3 = wjk-
    let gamma1n_w3 = new algebra.Expression(subtitute['gamma1n']);
    gamma1n_w3 = gamma1n_w3.multiply('w_{ij}^{-}');

    // w4 = wjk^2
    let gamma2_w4 = new algebra.Expression(subtitute['gamma2']);
    gamma2_w4 = gamma2_w4.multiply('w_{ij}^{2}');

    // Combine all left
    let left = theta1_aj.add(theta0);

    // Start right part and combine it
    let right = new algebra.Expression(subtitute['gamma0']);
    right = right.add(gamma1_w1);
    right = right.add(gamma1p_w2);
    right = right.add(gamma1n_w3);
    right = right.add(gamma2_w4)

    // Combine top part
    let rightStr = '(' + right.toString() + ')';
    let leftStr = '(' + left.toString() + ')';
    let topStr = leftStr + '' + rightStr;

    // Create bottom part and combine
    let epsilon = new algebra.Expression(subtitute['eps']);
    let bottomStr = epsilon.add(' \\Sigma_{i}' + topStr);

    // Add alpha and beta in front of it
    let alpha = new algebra.Expression(subtitute['alpha']);
    let beta = new algebra.Expression(subtitute['beta']);

    // Create an equation
    let alphaStr = alpha.toString() + '{{' + topStr + '\\over ' +  bottomStr + '}}';
    let betaStr = beta.toString() + '{{' + topStr + '\\over ' +  bottomStr + '}}';

    let equation = algebra.toTex('R_i = \\Sigma_j{(' + alphaStr + ' - ' + betaStr + ')}R_j');

    if (parseFloat(alpha.toString()) === 0) {
        equation = algebra.toTex('R_i = \\Sigma_j{(' + betaStr + ')}R_j');
    }

    if (parseFloat(beta.toString()) === 0) {
        equation = algebra.toTex('R_i = \\Sigma_j{(' + alphaStr + ')}R_j');
    }

    if (parseFloat(alpha.toString()) === 0 && parseFloat(beta.toString()) === 0) {
        equation = algebra.toTex('R_i = \\Sigma_k{(0)}R_j');
    }

    //console.log(segmentData);
    if (segmentData.method[0] === 'alpha-beta') {

        console.log('hello world');

        let theta0 = new algebra.Expression(0);
        let theta1_aj = new algebra.Expression(1);
        theta1_aj = theta1_aj.multiply('a_i');

        // w1 = wjk
        let gamma1_w1 = new algebra.Expression(0);
        gamma1_w1 = gamma1_w1.multiply('w_{ij}');

        // w2 = wjk+
        let gamma1p_w2 = new algebra.Expression(1);
        gamma1p_w2 = gamma1p_w2.multiply('w_{ij}^{+}');

        // w3 = wjk-
        let gamma1n_w3 = new algebra.Expression(1);
        gamma1n_w3 = gamma1n_w3.multiply('w_{ij}^{-}');

        // w4 = wjk^2
        let gamma2_w4 = new algebra.Expression(0);
        gamma2_w4 = gamma2_w4.multiply('w_{ij}^{2}');

        // Combine all left
        let left = theta1_aj.add(theta0);



        // Start right part and combine it
        let rightAlpha = new algebra.Expression(0);
        rightAlpha = rightAlpha.add(gamma1_w1);
        rightAlpha = rightAlpha.add(gamma1p_w2);
        rightAlpha = rightAlpha.add(gamma2_w4);

        let rightBeta = new algebra.Expression(0);
        rightBeta = rightBeta.add(gamma1_w1);
        rightBeta = rightBeta.add(gamma1n_w3);
        rightBeta = rightBeta.add(gamma2_w4);

        let epsilon = new algebra.Expression(0);
        let topAlpha = '(' + left.toString() + ')(' + rightAlpha.toString() + ')';
        let topBeta = '(' + left.toString() + ')(' + rightBeta.toString() + ')';
        let bottomAlpha = epsilon.add(' \\Sigma_{i}' + topAlpha);
        let bottomBeta = epsilon.add(' \\Sigma_{i}' + topBeta);


        // Add alpha and beta in front of it
        let alpha = new algebra.Expression(subtitute['alpha']);
        let beta = new algebra.Expression(subtitute['beta']);

        // Create an equation
        let alphaStr = alpha.toString() + '{{' + topAlpha + '\\over ' +  bottomAlpha + '}}';
        let betaStr = beta.toString() + '{{' + topBeta + '\\over ' +  bottomBeta + '}}';

        equation = algebra.toTex('R_i = \\Sigma_k{(' + alphaStr + ' - ' + betaStr + ')}R_j');
    }

    katex.render(equation, document.getElementById(container.attr('id')), {
        displayMode: false,
        output: 'html',
    });
}

function allIndexOf(str, toSearch) {
    var indices = [];
    for(var pos = str.indexOf(toSearch); pos !== -1; pos = str.indexOf(toSearch, pos + 1)) {
        indices.push(pos);
    }
    return indices;
}