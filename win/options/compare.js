/** GitHub@alexey-bass
 * Simply compares two string version values.
 *
 * Example:
 * compareVer('1.1', '1.2') => -1
 * compareVer('1.1', '1.1') =>  0
 * compareVer('1.2', '1.1') =>  1
 * compareVer('2.23.3', '2.22.3') => 1
 *
 * Returns:
 * -1 = left is LOWER = right is GREATER
 *  0 = they are equal
 *  1 = left is GREATER = right is LOWER
 *  And FALSE if one of input versions are not valid
 *
 * @function
 * @param {String} left  Version #1
 * @param {String} right Version #2
 * @return {Integer|Boolean}
 * @author Alexey Bass (albass)
 * @since 2011-07-14
 */
function compareVer(left, right) {
    if(typeof left + typeof right != 'stringstring')
        return false;

    for(let a = left.split('.'), b = right.split('.'), i = 0, l = Math.max(a.length, b.length); i < l; i++) {
        if((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i])))
            return +1
            /* left is higher */;
        else if((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i])))
            return -1
            /* right is higher */;
    }

    return 0
    /* equal */;
}
