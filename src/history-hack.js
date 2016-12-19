const _script = document.createElement('script');
_script.text = `(${
function () {
	// injected DOM script is not a content script anymore,
	// it can modify objects and functions of the page
	const _pushState = history.pushState;
	history.pushState = function (state, title, url) {
		_pushState.call(this, state, title, url);
		window.dispatchEvent(new CustomEvent('pushstate-changed', { detail: state }));
	};
	// repeat the above for replaceState too
}})();`;

document.head.appendChild(_script);
document.head.removeChild(_script);
