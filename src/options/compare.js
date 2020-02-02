/** function compareVer({String|Number} L, {String|Number} R) => {Integer|Boolean};
 * Simply compares two version values.
 *
 * Examples:
 * compareVer('1.1', '1.2') => -1
 * compareVer('1.1', '1.1') =>  0
 * compareVer('1.2', '1.1') => +1
 * compareVer('2.23.3', '2.22.3') => +1
 *
 * Returns:
 * -1    => L < R: L is LOWER <-> R is HIGHER
 *  0    => L = R: L and R are EQUAL
 * +1    => L > R: L is HIGHER <-> R is LOWER
 * false => one of the versions is invalid
 *
 * @function
 * @param  {String|Number} L Version #1
 * @param  {String|Number} R Version #2
 * @return {Integer|Boolean}
 * @author Alexey Bass (GitHub@alexey-bass)
 * @since  2011-07-14
 */
function compareVer(L, R) {
    if(!/^(string|number)(string|number)$/i.test(typeof L + typeof R))
        return false;

    L += '';
    R += '';

    let pI = Number.parseInt || parseInt || (string => +string.replace(/^\s*(-?\d+)[^]*$/, '$1')),
        mx = Math.max || ((...numbers) => numbers.sort((a, b) => +a < +b? +1: -1)[0]);

    for(let a = L.split('.'), b = R.split('.'), i = 0, l = mx(a.length, b.length), p = pI; i < l; i++) {
        if((a[i] && !b[i] && p(a[i]) > 0) || (p(a[i]) > p(b[i])))
            return +1
            /* L > R */;
        else if((b[i] && !a[i] && p(b[i]) > 0) || (p(a[i]) < p(b[i])))
            return -1
            /* L < R */;
    }

    return 0
    /* L = R */;
}
