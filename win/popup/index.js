function load(name) {
	return JSON.parse(localStorage.getItem(btoa(name)));
}

function save(name, data) {
	return localStorage.setItem(btoa(name), JSON.stringify(data));
}

let table = document.body.querySelector('table'),
	array = load('URLs');

if(array && array.length) {
	let strings = [],
		compiled = [],
		object = {},
		width = 3;

	for(let count = 0, length = Math.ceil(array.length / width); count < length;)
		for(let index = width * count++, name, url; index < count * width; index++)
			object[name = array[index]] = (!/^(null|undefined)?$/.test( url = load(`${ name }.url`) || '' ))?
`            <td id="local-${ name }" local="{:name} ({:url})" name="${ name }" url="${ url.replace(/^(.*?\/\/.*?\/).*$/, '$1') }">
				<a href="${ url }" target="_blank">
					<img alt="${ name }" src="../img/local.${ name }.png" />
					<label>${ name }</label>
				</a>
			</td>`: null;

	for(let index = 0, length = array.length, string; index < length; index++)
		if(string = object[array[index]])
			compiled.push(string);

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

	table.innerHTML = html + table.innerHTML;
}

document.body.onload = function() {
	let messages = {
			"and": "{:{*}}",
			"disabled": "Not yet implemented",
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

	let elements = document.querySelectorAll(selectors.join(','));

	for(let element, index = 0, length = elements.length; index < length; index++) {
		let number = 1;
		for(let attribute in messages)
			if(attribute in (element = elements[index]).attributes)
				element.title += `\n${(number++)}) ${ parse(messages[attribute], attribute, element) }.`;
	}
}
