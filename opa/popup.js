function load(name, decompress_data = false) {
	let data;

	name = btoa(name);
	data = localStorage.getItem(name);

	if(decompress_data)
		data = iBWT(unzip(decompress(data)));

	return JSON.parse(data);
}

function save(name, data, compress_data = false) {
	name = btoa(name);
	data = JSON.stringify(data);

	if(compress_data)
		data = compress(zip(BWT(data)));

	return localStorage.setItem(name, data);
}

let $ = top.$ = (selector, all) => (all? [...document.querySelectorAll(selector)]: document.querySelector(selector)),
	table = $('table'),
	managers = load('URLs'),
	builtins = (load('builtin') || []),
	plugins  = (load('plugin') || []);

if(managers && managers.length) {
	let strings = [],
		compiled = [],
		object = {},
		width = 3;

	for(let count = 0, length = Math.ceil(managers.length / width); count < length;)
		for(let index = width * count++, name, url; index < count * width; index++)
			object[name = managers[index]] = (!/^(null|undefined)?$/.test( url = load(`${ name }.url`) || '' ))?
`            <td id="local-${ name }" local="{:name} ({:url})" name="${ name }" url="${ url.replace(/^(.*?\/\/.*?\/).*$/, '$1') }">
				<a href="${ url }" target="_blank">
					<img alt="${ name }" src="local.${ name }.png" />
					<label>${ name }</label>
				</a>
			</td>`: null;

	for(let array = [...managers, ...builtins, ...plugins], index = 0, length = array.length, string; index < length; index++)
		if(string = object[array[index]]) {
			compiled.push(string);
		} else if(/(\w+):(true|false)/i.test(array[index])) {
			let { $1, $2 } = RegExp,
				element = $(`#${ $1 }`);

			$2 = $2 == 'true';

			if(element)
				($2)?
					element.removeAttribute('disabled'):
				element.setAttribute('disabled', '');
		}

	for(let index = 0, length = compiled.length, string = ''; index <= length; index++) {
		if((index > 0 && index % 3 == 0) || index >= length)
			strings.push(string),
			string = '';
		if(index < length)
			string += compiled[index];
	}

	let html = '';

	strings.map(string =>
		html +=
`       <tr>
		${ string }
		</tr>`
	);

	table.innerHTML = `<tbody>${html}</tbody>` + table.innerHTML;
}

document.body.onload = function() {
	let messages = {
			"and": "{:{*}}",
			"disabled": "Disabled in settings",
			"is-shy": "Can only be accessed via: {*}",
			"is-slow": "Resource intensive (loads slowly)",
			"is-dead": "Isn't meant to show the Web to Plex button",
			"local": "Opens a link to ^{*}",
			"not-safe": "Updated irregularly, may drop support",
			"pop-ups": "Contains annoying/intrusive ads and/or pop-ups",
			"save-file": "Uses {*} before using your manager(s)",
			// $0.99 one time; $0.99 - $9.99/mon
			"cost-cash-low": "At least {*} (fair)",
			// $9.99 one time; $9.99 - $29.99/mon
			"cost-cash-med": "At least {*} (pricy)",
			// $29.99 one time; $29.99 - $99.99/mon
			"cost-cash-hig": "At least {*} (expensive)"
		},
		parse = (string, attribute, element) => {
			return string
				.replace(/\{\$\}/g, element.title)
				.replace(/\{\*\}/g, element.getAttribute(attribute))
				.replace(/\{\:([\w\- ]+)\}/g, ($0, $1, $$, $_) =>
					$1.split(' ').map($1 => parse(element.getAttribute($1), $1, element))
				)
				.replace(/\^([a-z])/gi, ($0, $1, $$, $_) => $1.toUpperCase());
		},
		selectors = [];

	for(let key in messages)
		selectors.push(`[${ key }]`);

	let elements = $(selectors.join(','), true);

	for(let element, index = 0, length = elements.length; index < length; index++) {
		let number = 1;
		for(let attribute in messages)
			if(attribute in (element = elements[index]).attributes)
				element.title += `\n${(number++)}) ${ parse(messages[attribute], attribute, element) }.`;
	}
}

function xip(string) {
	return compress(zip(BWT(string)));
}

function unxip(string) {
	return iBWT(unzip(decompress(string)));
}

/* Zipping Algorithm */
function zip(string = '') {
	return string.replace(/(\w)(\1{4,})/g, ($0, $1, $2, $$, $_) => $1 + `{${$2.length.toString(36)}}`);
}

/* Un-Zipping Algorithm */
function unzip(string = '') {
	let from36 = (n, x = 0) => n.split('').reverse().map((v, i) => x += '0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(v) * 36**i)[-1] || x;

	return string.replace(/(\w)\{([a-z\d]+)\}/gi, ($0, $1, $2, $$, $_) => $1.repeat(from36($2) + 1));
}

/* BWT Sorting Algorithm */
function BWT(string = '') {
    if(/^[\x32]*$/.test(string))
        return '';

    let _a = `\u0001${ string }`,
        _b = `\u0001${ string }\u0001${ string }`,
        p_ = [];

    for(let i = 0; i < _a.length; i++)
        p_.push(_b.slice(i, _a.length + i));

    p_ = p_.sort();

    return p_.map(P => P.slice(-1)[0]).join('');
}

/* BWT Desorting Algorithm */
function iBWT(string = '') {
    if(/^[\x32]*$/.test(string))
        return '';

    let a = string.split('');

    let O = q => {
        let x = 0;
        for(let i = 0; i < a.length; i++)
            if(a[i] < q)
                x++;
        return x;
    };

    let C = (n, q) => {
        let x = 0;
        for(let i = 0; i < n; i++)
            if(a[i] === q)
                x++;
        return x;
    };

    let b = 0,
        c = '',
        d = a.length + 1;

    while(a[b] !== '\u0001' && d--) {
        c = a[b] + c;
        b = O(a[b]) + C(b, a[b]);
    }

    return c;
}

/* LZW Compression Algorithm */
function compress(string = '') {
	let dictionary = {},
		phrases    = (string + ''),
		phrase     = phrases[0],
		medium     = [],
		output     = [],
		index      = 255,
		character;

	if(string.length < 1)
		return;

	let at = (w = phrase, d = dictionary) =>
		(w.length > 1)?
			d[`@${ w }`]:
		w.charCodeAt(0);

	for(let i = 1, l = phrases.length; i < l; i++)
		if(dictionary[`@${ phrase }${ character = phrases[i] }`] !== undefined) {
			phrase += character;
		} else {
			medium.push(at(phrase));
			dictionary[`@${ phrase }${ character }`] = index++;
			phrase = character;
		}
	medium.push(at(phrase));

	for(let i = 0, l = medium.length; i < l; i++)
		output.push(String.fromCharCode(medium[i]));

	return output.join('');
}

/* LZW Decompression Algorithm */
function decompress(string = '') {
	let dictionary = {},
		phrases    = (string + ''),
		character  = phrases[0],
		word       = {
			now:  '',
			last: character,
		},
		output     = [character],
		index      = 255;

	if(string.length < 1)
		return;

	for(let i = 1, l = phrases.length, code; i < l; i++) {
		code = phrases.charCodeAt(i);

		if(code < 255)
			word.now = phrases[i];
		else if((word.now = dictionary[`@${ code }`]) === undefined)
			word.now = word.last + character;

		output.push(word.now);
		character = word.now[0];
		dictionary[`@${ index++ }`] = word.last + character;
		word.last = word.now;
	}

	return output.join('');
}
