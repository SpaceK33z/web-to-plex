let NO_DEBUGGER = false;

let terminal =
	NO_DEBUGGER?
		{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
	console;

let check;

check = document.body.onload = event => {
	let video = document.querySelector('div > p + p');

	if(video && (video.src || video.textContent)) {
		let { src } = video;

		src = src || video.textContent;

		if(/^blob:/i.test(src))
			throw '<blob> URL detected. Unable to reform file.';

		try {
			top.postMessage({ href: `https://oload.fun/stream/${ src }?mime=true`, tail: 'MP4', type: 'SEND_VIDEO_LINK', from: 'oload' }, '*');
		} catch(error) {
			terminal.error('Failed to post message:', error);
		}
	} else {
		setTimeout(check, 500);
	}
};
