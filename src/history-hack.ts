const _script = document.createElement('script');
_script.text = `(${function() {
	// injected DOM script is not a content script anymore,
	// it can modify objects and functions of the page
	const _pushState = window.history.pushState;
	window.history.pushState = function(data: any, title?: string, url?: string) {
		_pushState.call(this, data, title, url);
		window.dispatchEvent(
			new CustomEvent('pushstate-changed', { detail: data })
		);
	};
	// repeat the above for replaceState too
}})();`;

document.head.appendChild(_script);
document.head.removeChild(_script);
