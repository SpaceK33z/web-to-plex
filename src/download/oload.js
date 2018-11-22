let terminal =
//                { error: m => m, info: m => m, log: m => m, warn: m => m, group: m=> m, groupEnd: m => m } ||
                console;

document.body.onload = event => {
    let video = document.querySelector('div > p + p');

    if(video) {
        try {
            top.postMessage({ href: `https://oload.fun/stream/${ video.textContent }?mime=true`, tail: 'mp4', type: 'SEND_VIDEO_LINK', from: 'oload' }, '*');
        } catch(error) {
            terminal.log('Failed to post message:', error);
        }
    }
};
