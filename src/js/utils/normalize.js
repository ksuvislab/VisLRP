/**
 * Normalize value by ranges
 * @param {*} value : actual value
 * @param {*} r1 : [min, max]
 * @param {*} r2 : [value1, value2]
 */
export default function(value, r1, r2) {
    return (value - r1[0] ) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
}