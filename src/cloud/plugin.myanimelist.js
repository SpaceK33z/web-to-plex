// Web to Plex - My Anime List Plugin
// Aurthor(s) - @ephellon (2018)

let plugin = {
	"url": "*://*.myanimelist.net/anime/\\d+/*",

	"init": () => {
		let title = document.queryBy('table h2:nth-of-type(1) + *')
				.first.textContent.replace(/^[^\:]+:/, '')
				.trim(),
			type = document.queryBy('table h2:nth-of-type(2) + *')
				.first.textContent.trim()
				.toLowerCase()
				.split(/\s+/)
				.reverse()[0],
			year = +(document.queryBy('table h2:nth-of-type(2) ~ .spaceit ~ .spaceit')
				.first.textContent.trim()
				.replace(/[^]*(\d{4})[^]*/, '$1')),
			image = document.queryBy('table img')
				.first.src;

		return {
			type,
			title,
			year,
			image
		};
	},
};
