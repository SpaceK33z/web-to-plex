/* plugn.js (Plugin) - Web to Plex */
/* global config */

let DISABLE_DEBUGGER = false;

let scribe =
    DISABLE_DEBUGGER?
        { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
    console;

let LAST, LAST_JS, LAST_INSTANCE, LAST_ID, LAST_TYPE, FOUND = {};

function load(name) {
    return JSON.parse(localStorage.getItem(btoa(name)));
}

function save(name, data) {
    return localStorage.setItem(btoa(name), JSON.stringify(data));
}

function GetConsent(origin) {
    return load('permission:' + origin);
}

function RandomName(length = 16, symbol = '') {
    let values = [];

    window.crypto.getRandomValues(new Uint32Array(length)).forEach((value, index, array) => values.push(value.toString(36)));

    return values.join(symbol).replace(/^[^a-z]+/i, '');
};

let running = [], instance = RandomName(), TAB, cache = {};

let tabchange = tabs => {
    let tab = tabs[0];

    if(!tab || FOUND[instance]) return;

    TAB = tab;

    let id  = tab.id,
        url = tab.url,
        org, ali, js,
        type, cached;

    if(
        !url
        || /^(?:chrome|debugger|view-source)/i.test(url)
        // || (!!~running.indexOf(id) && !!~running.indexOf(instance))
    )
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url  = new URL(url);
    org  = url.origin;
    ali  = url.host.replace(/^(ww\w+\.|\w{2}\.)/i, '');
    can  = GetConsent(ali);
    type = (load(`builtin:${ ali }`) + '') == 'true'? 'script': 'plugin';
    js   = load(`${ type }:${ ali }`);
    code = cache[ali];

    if(!can || !js) return;

    if(code) {
        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
            // Sorry, but the instance needs to be callable multiple times
            chrome.tabs.executeScript(id, { code }, results => handle(results, id, instance, js, type));
        });

        return setTimeout(() => cache = {}, 1e6);
    }

    let name = (DISABLE_DEBUGGER? instance: `top.${ instance }`); // makes debugging easier

    let file = (!DISABLE_DEBUGGER)?
                    (type === 'script')?
                        chrome.runtime.getURL(`cloud/${ js }.js`):
                    chrome.runtime.getURL(`cloud/plugin.${ js }.js`):
                `https://ephellon.github.io/web.to.plex/${ type }s/${ js }.js`;

    fetch(file, { mode: 'cors' })
        .then(response => response.text())
        .then(code => {
            chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                // Sorry, but the instance needs to be callable multiple times
                chrome.tabs.executeScript(id, { code:
                    (LAST = cache[ali] =
`/* tabchange */
${ name } = (${ name } || (${ name }$ = $ => {
    'use strict';

    ${ code }

    ;top.onlocationchange = event => ${ type }.init();

    let InjectedReadyState;

    return (${ type }.RegExp = RegExp(
        ${ type }.url
        /*.replace(/\\|.*?(\\)|$)/g,'')*/
        .replace(/^\\*\\:/,'\\\\w{3,}:')
        .replace(/\\*\\./g,'([^\\\\.]+\\\\.)?')
        .replace(/\\/\\*/g,'/[^$]*'),'i')
    ).test
    ("${ url.href }")?
    /* URL matches pattern */
        ${ type }.ready?
        /* Injected file has the "ready" property */
        (InjectedReadyState =
            ${ type }.ready.constructor.name == 'AsyncFunction'?
            /* "ready" is an async function */
                ${ type }.ready():
            /* "ready" is a sync (normal) function */
            ${ type }.ready()
        )?
            /* Injected file is ready */
                ${ type }.init( InjectedReadyState ):
            /* Injected file isn't ready */
            (${ type }.timeout || 1000):
        /* Injected file doesn't have the "ready" property */
        ${ type }.init():
    /* URL doesn't match pattern */
(    console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+${ type }.url+"' ("+${ type }.RegExp+")"), 5000);
})(document.queryBy));

console.log('[${ name }]', ${ name });

;${ name };`
                ) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = js, LAST_TYPE = type))
            })
        })
        .then(() => running.push(id, instance))
        .catch(error => { throw error });
};

let handle = async(results, tabID, instance, script, type) => {
    let InstanceWarning = `[${ type.toUpperCase() }:${ script }] Instance failed to execute @${ tabID }#${ instance }`;

    if((!results || !results[0] || !instance) && !FOUND[instance])
        try {
            instance = RandomName();
            tabchange([ TAB ]);
            return;
        } catch(error) {
            return scribe.warn(InstanceWarning);
        }

    let data = await results[0];

    if(typeof data == 'number')
        return setTimeout(() => { let { request, sender, callback } = (processMessage.properties || {}); processMessage(request, sender, callback) }, data);
    if(typeof data != 'object')
        return /* setTimeout */;

    try {
        chrome.tabs.insertCSS(tabID, { file: 'sites/common.css' });
        chrome.tabs.sendMessage(tabID, { data, script, instance, instance_type: 'script', type: 'POPULATE' });
    } catch(error) {
        throw new Error(InstanceWarning + ' - ' + String(error));
    }
};

chrome.tabs.onUpdated.addListener((tabID, changes, tab) => {
    instance = RandomName();
    tabchange([tabID]);
});

// workaround for the above
chrome.tabs.onActivated.addListener(change => {
    instance = RandomName();

    chrome.tabs.get(change.tabId, tab => tabchange([ tab ]));
});

chrome.tabs.onUpdated.addListener((ID, change, tab) => {
    instance = RandomName();

    if(change.status == 'complete' && !tab.discarded)
        tabchange([ tab ]);
    else if(!tab.discarded)
        setTimeout(() => tabchange([ tab ]), 1000);
});

// listen for a page load
let processMessage;

chrome.runtime.onMessage.addListener(processMessage = (request, sender, callback) => {
    let { options } = request,
        tab = TAB || {},
        { id, url, href } = tab,
        org;

    processMessage.properties = { request, sender, callback };

    if(
        !url
        || /^(?:chrome|debugger|view-source)/i.test(url)
        // || (!!~running.indexOf(id) && !!~running.indexOf(instance))
    )
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url = new URL(url);
    org = url.origin;

    let name = (DISABLE_DEBUGGER? instance: `top.${ instance }`); // makes debugging easier

    if(request && request.options) {
        let { type } = request,
            { plugin, script } = options,
            _type = type.toLowerCase();

        type = type.toUpperCase();

        let file = (!DISABLE_DEBUGGER)?
                        (_type === 'script')?
                            chrome.runtime.getURL(`cloud/${ script }.js`):
                        chrome.runtime.getURL(`cloud/plugin.${ plugin }.js`):
                    `https://ephellon.github.io/web.to.plex/${ _type }s/${ options[_type] }.js`;

        switch(type) {
            case 'PLUGIN':
                fetch(file, { mode: 'cors' })
                    .then(response => response.text())
                    .then(code => {
                        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                            // Sorry, but the instance needs to be callable multiple times
                            chrome.tabs.executeScript(id, { code:
                                (LAST = cache[plugin] =
`/* plugin */
${ name } = (${ name } || (${ name }$ = $ => {
'use strict';

${ code }

;top.onlocationchange = event => plugin.init();

let PluginReadyState;

return (plugin.RegExp = RegExp(
    plugin.url
    /*.replace(/\\|.*?(\\)|$)/g,'')*/
    .replace(/^\\*\\:/,'\\\\w{3,}:')
    .replace(/\\*\\./g,'([^\\\\.]+\\\\.)?')
    .replace(/\\/\\*/g,'/[^$]*'),'i')
).test
("${ url.href }")?
/* URL matches pattern */
    plugin.ready?
    /* Plugin has the "ready" property */
    (PluginReadyState =
        plugin.ready.constructor.name == 'AsyncFunction'?
        /* "ready" is an async function */
            plugin.ready():
        /* "ready" is a sync (normal) function */
        plugin.ready()
    )?
        /* Plugin is ready */
            plugin.init( PluginReadyState ):
        /* Script isn't ready */
        (plugin.timeout || 1000):
    /* Plugin doesn't have the "ready" property */
    plugin.init():
/* URL doesn't match pattern */
(console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '" + plugin.url + "' (" + plugin.RegExp + ")"), 5000);
})(document.queryBy));

console.log('[${ name }]', ${ name });

;${ name };`
) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = plugin, LAST_TYPE = type))
                        })
                    })
                    .then(() => running.push(id, instance))
                    .catch(error => { throw error });
                break;

            case 'SCRIPT':
            fetch(file, { mode: 'cors' })
                .then(response => response.text())
                .then(code => {
                    chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                        // Sorry, but the instance needs to be callable multiple times
                        chrome.tabs.executeScript(id, { code:
                            (LAST = cache[script] =
`/* script */
${ name } = (${ name } || (${ name }$ = $ => {
'use strict';

${ code }

;top.onlocationchange = event => script.init();

let ScriptReadyState;

return (script.RegExp = RegExp(
    script.url
    // .replace(/\\|.*?(\\)|$)/g,'')
    .replace(/^\\*\\:/,'\\\\w{3,}:')
    .replace(/\\*\\./g,'([^\\\\.]+\\\\.)?')
    .replace(/\\/\\*/g,'/[^$]*'),'i')
).test
("${ url.href }")?
/* URL matches pattern */
    script.ready?
    /* Script has the "ready" property */
    (ScriptReadyState =
        script.ready.constructor.name == 'AsyncFunction'?
        /* "ready" is an async function */
            script.ready():
        /* "ready" is a sync (normal) function */
        script.ready()
    )?
        /* Script is ready */
            script.init( ScriptReadyState ):
        /* Script isn't ready */
        (script.timeout || 1000):
    /* Script doesn't have the "ready" property */
    script.init():
/* URL doesn't match pattern */
(console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '" + script.url + "' (" + script.RegExp + ")"), 5000);
})(document.queryBy));

console.log('[${ name }]', ${ name });

;${ name };`
) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = script, LAST_TYPE = type))
                    })
                })
                .then(() => running.push(id, instance))
                .catch(error => { throw error });
                break;

            case '_INIT_':
                chrome.tabs.executeScript(id, { code: LAST }, results => handle(results, LAST_ID, LAST_INSTANCE, LAST_JS, LAST_TYPE));
                break;

            case 'FOUND':
                FOUND[request.instance] = request.found;
                break;

            default:
                instance = RandomName();
                return false;
        };
    }

    return true;
});
