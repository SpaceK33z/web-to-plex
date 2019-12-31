let plugin = {
	"url": "*://*.freemoviescinema.com/watch/*",

	"ready": () => !$('.row .row h2 a').empty,

	"timeout": 1000,

	"init": (ready) => {
		let R = RegExp;

		let title, year, image,
			type = 'movie';

		title = $('.row .row h2 a').first;
		image = $('[class*="hero"i]').first;

		title = title.textContent.replace(/\s*\((\d{4})\)/, '');
		year = +R.$1;
		image = image.getAttribute('style').replace(/url\((["']?)([^]+?)\1\)/, '$1');

		return { type, title, year, image };
	},
};
