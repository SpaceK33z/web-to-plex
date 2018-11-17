(() => {

String.prototype.toCaps = function toCaps(all) {
    /** Titling Caplitalization
     * Articles: a, an, & the
     * Conjunctions: and, but, for, nor, or, so, & yet
     * Prepositions: across, after, although, at, because, before, between, by, during, from, if, in, into, of, on, to, through, under, with, & without
     */
    let array = this.toLowerCase(),
        titles = /(?!^|(?:an?|the)\s+)\b(a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)(?!\s*$)\b/gi,
        cap_exceptions = /([\|\"\(]\s*[a-z]|[\:\.\!\?]\s+[a-z]|(?:^\b|[^\'\-\+]\b)[^aeiouy\d\W]+\b)/gi,  // Punctuation exceptions, e.g. "And not I"
        all_exceptions = /\b((?:ww)?(?:m+[dclxvi]*|d+[clxvi]*|c+[lxvi]*|l+[xvi]*|x+[vi]*|v+i*|i+))\b/gi; // Roman Numberals

    array = array.split(/\s+/);

    let index, length, string, word;
    for(index = 0, length = array.length, string = [], word; index < length; index++) {
        word = array[index];

        if(word)
            string.push( word[0].toUpperCase() + word.slice(1, word.length) );
    }

    string = string.join(' ');

    if(!all)
        string = string
          .replace(titles, ($0, $1, $$, $_) => $1.toLowerCase())
          .replace(cap_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
          .replace(all_exceptions, ($0, $1, $$, $_) => $1.toUpperCase());

    return string;
};

(function(parent) {
/* SortBy.js */
/** Usage + Example
 // document.queryBy( selectors )...

 let index = 0;
 // the order given is the order handled
 document.queryBy("div:last-child, div:nth-child(2), div:first-child")
   .forEach((element, index, array) => element.innerHTML = index + 1);

 // output w/sortBySelector:
 <div>3</div>
 <div>2</div>
 <div>1</div> <!-- handles the last div first, like the selector -->

 // output w/o sortBySelector:
 <div>1</div>
 <div>2</div>
 <div>3</div>
 */
    parent.queryBy = function queryBy(selectors, container = parent) {
        // Helpers
        let copy = array => [].slice.call(array),
            query = (SELECTORS, CONTAINER = container) => CONTAINER.querySelectorAll(SELECTORS);

        // Get rid of enclosing syntaxes: [...] and (...)
        let regexp = /(\([^\(\)]+?\)|\[[^\[\]]+?\])/g,
            pulled = [],
            media  = [],
            index, length;

        // The index shouldn't be longer than the length of the selector's string
        // Keep this to prevent infinite loops
        for(index = 0, length = selectors.length; index++ < length && regexp.test(selectors);)
          selectors = selectors.replace(regexp, ($0, $1, $$, $_) => '\b--' + pulled.push($1) + '\b');

        let order       = selectors.split(','),
            dummy       = copy(order),
            output      = [],
            generations = 0;

        // Replace those syntaxes (they were ignored)
        for(index = 0, length = dummy.length, order = [], regexp = /[\b]--(\d+)[\b]/g; index < length; index++)
          order.push(dummy[index].replace(regexp, ($0, $1, $$, $_) => pulled[+$1 - 1]));

        // Make sure to put the elements in order
        // Handle the :parent (pseudo) selector
        for(index = 0, length = order.length; index < length; generations = 0, index++) {
          let selector = order[index], ancestor;

          selector = selector
            .replace(/\:nth-parent\((\d+)\)/g, ($0, $1, $$, $_) => (generations -= +$1, ''))
            .replace(/(\:{1,2}parent\b|<\s*(\*|\s*(,|$)))/g, ($0, $$, $_) => (--generations, ''))
            .replace(/<([^<,]+)?/g, ($0, $1, $$, $_) => (ancestor = $1, --generations, ''));

          let elements = query(selector),
              parents = [], parent;

          for(; generations < 0; generations++)
            elements.forEach( element => {
              let P = element,
                  E = C => [].slice.call(query(ancestor, C)),
                  F;

              for(let I = 0, L = -generations; ancestor && !!P && I < L; I++)
                P = !!~E(P.parentElement).indexOf(P)? P: P.parentElement;

              parent = ancestor? !~E(P.parentElement).indexOf(P)? null: P: P.parentElement;

              if(!~parents.indexOf(parent))
                parents.push(parent);
            });
          media.push(parents.length? parents: elements);
        }

        // Create a continuous array from the sub-arrays
        for(index = 1, length = media.length; index < length; index++)
          media.splice(0, 1, copy(media[0]).concat( copy(media[index]) ));
        output = [].slice.call(media[0]).filter( value => value );

        // Remove repeats
        for(index = 0, length = output.length, media = []; index < length; index++)
          if(!~media.indexOf(output[index]))
            media.push(output[index]);

        let properties = { writable: false, enumerable: false, configurable: false };

        Object.defineProperties(media, {
            first: {
                value: media[0],
                ...properties
            },
            last: {
                value: media[media.length - 1],
                ...properties
            }
        });

        return media;
    };

/** Adopted from <https://github.com/crislin2046/createElement>
 * LICENSE: MIT (2018)
 */
    parent.furnish = function furnish(name, attributes = {}, ...children) {
      let u = v => v && v.length, R = RegExp;

      if( !u(name) )
        throw TypeError(`TAGNAME cannot be ${ (name === '')? 'empty': name }`);

      let options = attributes.is === true? { is: true }: null;

      delete attributes.is;

      name = name.split(/([#\.][^#\.\[\]]+)/).filter( u );

      if(name.length <= 1)
        name = name[0].split(/^([^\[\]]+)(\[.+\])/).filter( u );

      if(name.length > 1)
        for(let n = name, i = 1, l = n.length, t, v; i < l; i++)
          if((v = n[i].slice(1, n[i].length)) && (t = n[i][0]) == '#')
            attributes.id = v;
          else if(t == '.')
            attributes.classList = [].slice.call(attributes.classList || []).concat(v);
          else if(/\[(.+)\]/.test(n[i]))
            R.$1.split('][').forEach(N => attributes[(N = N.split('=', 2))[0]] = N[1] || '');
      name = name[0];

      let element = document.createElement(name, options);

      if(attributes.classList instanceof Array)
        attributes.classList = attributes.classList.join(' ');

      Object.entries(attributes).forEach(
        ([name, value]) => (/^(on|(?:inner|outer)(?:HTML|Text)|class(?:List|Name)$|value)/.test(name))?
          element[name] = value:
        element.setAttribute(name, value)
      );

      children
        .filter( child => child !== undefined && child !== null )
        .forEach(
          child =>
            child instanceof Element?
              element.append(child):
            child instanceof Node?
              element.appendChild(child):
            parent.createTextNode(child)
        );

      return element;
    }
})(document);

let PRIMITIVE = Symbol.toPrimitive,
    queryBy = document.queryBy,
    furnish = document.furnish;

queryBy[PRIMITIVE] = furnish[PRIMITIVE] = String.prototype.toCaps[PRIMITIVE] = () => 'function furnish() { [foreign code] }';

})();