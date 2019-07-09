function wait(on, then) {
    if (on && on())
        then && then();
    else
        setTimeout(() => wait(on, then), 50);
}

async function load(name = '') {
    if(!name) return;

    let storage = chrome.storage.sync || chrome.storage.local;

    name = 'Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''));

    return new Promise((resolve, reject) => {
        function LOAD(DISK) {
            let data = JSON.parse(DISK[name] || null);

            return resolve(data);
        }

        storage.get(null, DISK => {
            if (chrome.runtime.lastError)
                chrome.storage.local.get(null, LOAD);
            else
                LOAD(DISK);
        });
    });
}

async function save(name = '', data) {
    if(!name) return;

    let storage = chrome.storage.sync || chrome.storage.local;

    name = 'Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''));
    data = JSON.stringify(data);

    await storage.set({[name]: data}, () => data);

    return name;
}

async function kill(name) {
    let storage = chrome.storage.sync || chrome.storage.local;

    return storage.remove(['Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''))]);
}

function Notify(state, text, timeout = 7000, requiresClick = true) {
    return top.postMessage({ type: 'NOTIFICATION', data: { state, text, timeout, requiresClick } }, '*');
}

// the custom "on location change" event
function watchlocationchange(subject) {
    let locationchangecallbacks = watchlocationchange.locationchangecallbacks;

    watchlocationchange[subject] = watchlocationchange[subject] || location[subject];

    if (watchlocationchange[subject] != location[subject]) {
        let from = watchlocationchange[subject],
            to = location[subject],
            properties = { from, to },
            sign = code => btoa((code + '').replace(/\s+/g, ''));

        watchlocationchange[subject] = location[subject];

        for(let index = 0, length = locationchangecallbacks.length, callback, called; length > 0 && index < length; index++) {
            callback = locationchangecallbacks[index];
            called = locationchangecallbacks.called[sign(callback)];

            let event = new Event('locationchange', { bubbles: true });

            if(!called && callback && typeof callback == 'function') {
                locationchangecallbacks.called[sign(callback)] = true;
                window.addEventListener('beforeunload', event => {
                    event.preventDefault(false);

                    callback({ event, ...properties });
                });

                callback({ event, ...properties });

                open(to, '_self');
            } else {
                return /* The eventlistener was already called */;
            }
        }
    }
}
watchlocationchange.locationchangecallbacks = watchlocationchange.locationchangecallbacks || [];
watchlocationchange.locationchangecallbacks.called = watchlocationchange.locationchangecallbacks.called || {};

if(!('onlocationchange' in window))
    Object.defineProperty(window, 'onlocationchange', {
        set: callback => (typeof callback == 'function'? watchlocationchange.locationchangecallbacks.push(callback): null),
        get: () => watchlocationchange.locationchangecallbacks
    });

watchlocationchange.onlocationchangeinterval = watchlocationchange.onlocationchangeinterval || setInterval(() => watchlocationchange('href'), 1);
// at least 1s is needed to properly fire the event ._.

String.prototype.toCaps = String.prototype.toCaps || function toCaps(all) {
    /** Titling Caplitalization
     * Articles: a, an, & the
     * Conjunctions: and, but, for, nor, or, so, & yet
     * Prepositions: across, after, although, at, because, before, between, by, during, from, if, in, into, of, on, to, through, under, with, & without
     */
    let array = this.toLowerCase(),
        titles = /(?!^|(?:an?|the)\s+)\b(a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)?|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)(?!\s*$)\b/gi,
        cap_exceptions = /([\|\"\(]\s*[a-z]|[\:\.\!\?]\s+[a-z]|(?:^\b|[^\'\-\+]\b)[^aeiouy\d\W]+\b)/gi, // Punctuation exceptions, e.g. "And not I"
        all_exceptions = /\b((?:ww)?(?:m{1,4}(?:c?d(?:c{0,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?)?)?|c?d(?:c{0,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?)?|c{1,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?|x?l(?:x{0,3}(?:i?vi{0,3})?)?|x{1,3}(?:i?vi{0,3})?|i?vi{0,3}|i{1,3}))\b/gi, // Roman Numberals
        cam_exceptions = /\b((?:mr?s|[sdjm]r|mx)|(?:adm|cm?dr?|chf|c[op][lmr]|cpt|gen|lt|mjr|sgt)|doc|hon|prof)(?:\.|\b)/gi, // Titles (Most Common?)
        low_exceptions = /'([\w]+)/gi; // Apostrphe cases

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
        .replace(all_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
        .replace(cap_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
        .replace(low_exceptions, ($0, $1, $$, $_) => $0.toLowerCase())
        .replace(cam_exceptions, ($0, $1, $$, $_) => $1[0].toUpperCase() + $1.slice(1, $1.length).toLowerCase() + '.');

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
    parent.queryBy = parent.queryBy || function queryBy(selectors, container = parent) {
        // Helpers
        let copy  = array => [...array],
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
            .replace(/<([^<,]+)?/g, ($0, $1, $$, $_) => (ancestor = $1, --generations, ''))
            .replace(/^\s+|\s+$/g, '');

          let elements = query(selector),
              parents = [], parent;

          for(; generations < 0; generations++)
            elements.forEach( element => {
                let P = element, Q = P.parentElement, R = (Q? Q.parentElement: {}),
                    E = C => [...query(ancestor, C)],
                    F, G;

                for(let I = 0, L = -generations; ancestor && !!R && !!Q && !!P && I < L; I++)
                  parent = !!~E(R).indexOf(Q)? Q: G;

                for(let I = 0, L = -generations; !!Q && !!P && I < L; I++)
                  parent = Q = (P = Q).parentElement;

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
            },
            child: {
                value: index => media[index - 1],
                ...properties
            },
            empty: {
                value: !media.length,
                ...properties
            },
        });

        return media;
    };

/** Adopted from <https://github.com/crislin2046/createElement>
 * LICENSE: MIT (2018)
 */
    parent.furnish = parent.furnish || function furnish(TAGNAME, ATTRIBUTES = {}, ...CHILDREN) {
        let u = v => v && v.length, R = RegExp, name = TAGNAME, attributes = ATTRIBUTES, children = CHILDREN;

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
            ([name, value]) => (/^(on|(?:(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)|value)$)/.test(name))?
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
                    element.appendChild(
                        parent.createTextNode(child)
                    )
            );

        return element;
    }
})(document);
