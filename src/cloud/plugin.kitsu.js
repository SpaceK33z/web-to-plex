// Web to Plex - Kitsu Plugin
// Aurthor(s) - @ephellon (2019)
let plugin = {
	"url": "*://*.kitsu.io/anime/*",

	"ready": () => !$('img[data-src][src]').empty,

	"timeout": 1000,

	"init": () => {
		let _title = /^\s*(?:english|romanized)\s+(.+)\s*$/i,
			_year  = /^\s*aired\s+.+(\d{4})(?:\s+to.+)?\s*$/i;

		let title = $('.media--information li').filter(e => _title.test(e.textContent))[0],
			year  = $('.media--information li').filter(e => _year.test(e.textContent))[0],
			image = $('.media-poster img').first,
			type  = plugin.getType();

		title = title.textContent.replace(_title, '$1');
		year  = +year.textContent.replace(_year, '$1');
		image = image.src;

		return {
			type,
			title,
			year,
			image
		};
	},

	"getType": () => {
		$('.media--information li').filter(e => /^\s*type\s+(movie|tv([\s\-]?show)?)\s*$/i.test(e.textContent));

		return /tv/i.test(RegExp.$1)? 'show': 'movie';
	},
};
