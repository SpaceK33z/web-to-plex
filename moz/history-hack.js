let __script__ = document.createElement('script');

// Injected DOM script is not a content script anymore;
// It can modify objects and functions of the page
__script__.text = `(${
function() {
	let history = window.history,
		__pushState__ = history.pushState,
		__replaceState__ = history.replaceState;

	history.pushState = function(state, title, url) {
	__pushState__.call(this, state, title, url);

	window.dispatchEvent(new CustomEvent('pushstate-changed', { detail: state }));
	};

	history.replaceState = function(state, title, url) {
	__replaceState__.call(this, state, title, url);

	window.dispatchEvent(new CustomEvent('pushstate-changed', { detail: state }));
	};
}
})();`;

document.head.appendChild(__script__);
document.head.removeChild(__script__);
