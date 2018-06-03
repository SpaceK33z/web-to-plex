import {
	isPlainObject,
	size,
	values,
	reduce,
	each,
	has,
	isArray,
	isEmpty,
} from 'lodash-es';

// flattens an object (recursively!), similarly to Array#flatten
// e.g. flatten({ a: { b: { c: "hello!" } } }); // => "hello!"
function _flatten(object) {
	const check = isPlainObject(object) && size(object) === 1;
	return check ? _flatten(values(object)[0]) : object;
}

function _parse(xml) {
	const data = {};

	const isText = xml.nodeType === 3;
	const isElement = xml.nodeType === 1;
	const body = xml.textContent && xml.textContent.trim();
	const hasChildren = xml.children && xml.children.length;
	const hasAttributes = xml.attributes && xml.attributes.length;

	// if it's text just return it
	if (isText) {
		return xml.nodeValue.trim();
	}

	// if it doesn't have any children or attributes, just return the contents
	if (!hasChildren && !hasAttributes) {
		return body;
	}

	// if it doesn't have children but _does_ have body content, we'll use that
	if (!hasChildren && body.length) {
		data.text = body;
	}

	// if it's an element with attributes, add them to data.attributes
	if (isElement && hasAttributes) {
		data.attributes = reduce(
			xml.attributes,
			(obj, name, id) => {
				const attr = xml.attributes.item(id);
				obj[attr.name] = attr.value;
				return obj;
			},
			{}
		);
	}

	// recursively call #parse over children, adding results to data
	each(xml.children, child => {
		const name = child.nodeName;

		// if we've not come across a child with this nodeType, add it as an object
		// and return here
		if (!has(data, name)) {
			data[name] = _parse(child);
			return;
		}

		// if we've encountered a second instance of the same nodeType, make our
		// representation of it an array
		if (!isArray(data[name])) {
			data[name] = [data[name]];
		}

		// and finally, append the new child
		data[name].push(_parse(child));
	});

	// if we can, let's fold some attributes into the body
	each(data.attributes, (value, key) => {
		if (data[key] != null) {
			return;
		}
		data[key] = value;
		delete data.attributes[key];
	});

	// if data.attributes is now empty, get rid of it
	if (isEmpty(data.attributes)) {
		delete data.attributes;
	}

	// simplify to reduce number of final leaf nodes and return
	return _flatten(data);
}

export function parseXml(string) {
	const xml = new DOMParser().parseFromString(string, 'text/xml');
	return _parse(xml);
}
