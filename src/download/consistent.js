let NO_DEBUGGER = false;

let terminal =
    NO_DEBUGGER?
        { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
    console;

let check;

check = document.body.onload = event => {
    let video = document.querySelector('video');

    if(video && video.src) {
        try {
            top.postMessage({ href: video.src, tail: 'mp4', type: 'SEND_VIDEO_LINK', from: 'consistent' }, '*');
        } catch(error) {
            terminal.error('Failed to post message:', error);
        }
    } else {
        setTimeout(check, 500);
    }
};
