const __script__ = document.createElement('script');

// injected DOM script is not a content script anymore,
// it can modify objects and functions of the page
__script__.text = `(${
function() {
	const __pushState__ = window.history.pushState,
          __replaceState__ = window.history.replaceState;

	window.history.pushState = function(state, title, url) {
		__pushState__.call(this, state, title, url);
		window.dispatchEvent(new CustomEvent('pushstate-changed', { detail: state }));
	};

    window.history.replaceState = function(state, title, url) {
		__replaceState__.call(this, state, title, url);
		window.dispatchEvent(new CustomEvent('pushstate-changed', { detail: state }));
	};
}
})();`;

document.head.appendChild(__script__);
document.head.removeChild(__script__);
