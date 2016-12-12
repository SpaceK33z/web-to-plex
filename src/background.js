// At this point you might want to think, WHY would you want to do
// these requests in a background page instead of the content script?
// This is because Movieo is served over HTTPS, so it won't accept requests to
// HTTP servers. Unfortunately, many people use CouchPotato over HTTP.
function viewCouchpotato(request, sendResponse) {
	axios.get(request.url, {
		params: { id: request.imdbId },
		auth: request.couchpotatoBasicAuth,
	})
	.then((res) => {
		const success = res.data.success;
		sendResponse({ success, status: success ? res.data.media.status : null });
	})
	.catch((err) => {
		sendResponse({ err });
	});
}

function addCouchpotato(request, sendResponse) {
	axios.get(request.url, {
		params: { identifier: request.imdbId },
		auth: request.couchpotatoBasicAuth,
	})
	.then((res) => {
		sendResponse({ success: res.data.success });
	})
	.catch((err) => {
		sendResponse({ err });
	});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type == 'VIEW_COUCHPOTATO') {
		viewCouchpotato(request, sendResponse);
		return true;
	}

	if (request.type == 'ADD_COUCHPOTATO') {
		addCouchpotato(request, sendResponse);
		return true;
	}
});
