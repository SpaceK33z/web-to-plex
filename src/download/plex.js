/** plxdwnld - Pip Longrun / Ephellon
*
* This project is licensed under the terms of the MIT license, see https://piplongrun.github.io/plxdwnld/LICENSE.txt
*
* @author      Pip Longrun <pip.longrun@protonmail.com>
* @version     0.2
* @see         https://piplongrun.github.io/plxdwnld/
*
*/

let plxdwnld = (() => {
	let self = {}, R = RegExp,
		baseURI, AccessToken,
		RegExps = {
			clientID:   /server\/([a-f\d]{40})\//i,
			metadataID: /key=%2Flibrary%2Fmetadata%2F(\d+)/i,
		},
		URLExps = {
			API_resource:   'https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}',
			API_library:    '{baseuri}/library/metadata/{id}?X-Plex-Token={token}',
			download:       '{baseuri}{partkey}?download=1&X-Plex-Token={token}',
		},
		access_token_path = '//Device[@clientIdentifier=\'{clientID}\']/@accessToken',
		base_uri_path = '//Device[@clientIdentifier=\'{clientID}\']/Connection[@local=0]/@uri',
		part_key_path = '//Media/Part[1]/@key';

	// Errors
	let ERROR = {
		EMPTY:          'No response data was received',
		NOT_PLEX:       'You are not browsing (or logged into) Plex',
		NOT_MEDIA:      'You are not viewing a media item',
		INVALID_TOKEN:  'Unable to find a valid Access Token',
	};

	let getXML = (url, callback) => {
		fetch(`//cors-anywhere.herokuapp.com/${ url }`, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
			.then(Q => Q.text())
			.then(text => {
				if(!text.length)
					throw ERROR.EMPTY;

				let Parser = new DOMParser(),
					XML = Parser.parseFromString(text, 'text/xml');

				callback(XML);
			})
			.catch(error => { throw error });
	};

	let getMetadata = (XML) => {
		let clientID = RegExps.clientID.test(location.href)?
			R.$1:
		null;

		if(clientID) {
			let access_token_node = XML.evaluate(
					access_token_path.replace(/{clientid}/ig, clientID),
					XML,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				),
				base_uri_node = XML.evaluate(
					base_uri_path.replace(/{clientid}/ig, clientID),
					XML,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);

			if(access_token_node.singleNodeValue && base_uri_node.singleNodeValue) {
				AccessToken = access_token_node.singleNodeValue.textContent;
				baseURI = base_uri_node.singleNodeValue.textContent;

				let metadataID = RegExps.metadataID.test(location.href)?
					R.$1:
				null;

				if(metadataID)
					getXML(
						URLExps.API_library
							.replace(/{baseuri}/ig, baseURI)
							.replace(/{id}/ig, metadataID)
							.replace(/{token}/ig, AccessToken)
						, GetDownloadURL
					);
				else
					throw ERROR.NOT_MEDIA;
			} else {
				throw ERROR.INVALID_TOKEN;
			}
		} else {
			throw ERROR.NOT_MEDIA;
		}
	};

	let GetDownloadURL = (XML) => {
		let part_key_node = XML.evaluate(part_key_path, XML, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

		if(part_key_node.singleNodeValue) {
			let href = URLExps.download
					.replace(/{baseuri}/ig, baseURI)
					.replace(/{partkey}/ig, part_key_node.singleNodeValue.textContent)
					.replace(/{token}/ig, AccessToken);

			top.postMessage({ href, tail: 'MP4', type: 'SEND_VIDEO_LINK', from: 'plex' }, '*');
		} else {
			throw ERROR.NOT_MEDIA;
		}
	};

	self.init = () => {
		if(localStorage.myPlexAccessToken !== undefined)
			getXML(URLExps.API_resource.replace(/{token}/ig, localStorage.myPlexAccessToken), getMetadata);
		else
			throw ERROR.NOT_PLEX;
	};

	return self;
})();

let NO_DEBUGGER = false;

let terminal =
	NO_DEBUGGER?
		{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
	console;

let check;

check = document.body.onload = event => {
	let loading = document.querySelector('.loading');

	if(!loading) {
		setTimeout(() => {
			try {
				plxdwnld.init();
			} catch(error) {
				terminal.error('Failed to post message:', error);
				setTimeout(check, 5000);
			}
		}, 5000)
	} else {
		setTimeout(check, 500);
	}
};
