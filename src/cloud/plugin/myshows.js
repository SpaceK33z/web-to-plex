// Web to Plex - My Shows Plugin
// Aurthor(s) - @enchained (2018)

let plugin = {
	"url": "*://*.myshows.me/view/\\d+/*",

	"init": (ready) => {
		let specific = /\/\/(\w{2})\./.test(location.origin);

		let title = (
				specific?
					document.queryBy('h1[itemprop="name"]').first.textContent:
				document.queryBy('main > h1').first.textContent
			).trim(),

			year = +(document.queryBy('div.clear > p.flat')
				.first.textContent.trim()
				.replace(/[^]*?(\d{4})[^]*/, '$1')),

			IMDbID = document.queryBy('[href*="/title/tt"]')
				.first.href.replace(/[^]*(tt\d+)[^]*/, '$1');

		return {
			type: 'show',
			title,
			year,
			IMDbID,
		};
	},
};
