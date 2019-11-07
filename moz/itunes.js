let script = {
	"url": "",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image, type = script.getType();

		switch(type) {
			case 'movie':
				title = $('[class*="movie-header__title"i]').first.textContent;
				year  = +$('[datetime]').first.textContent;
				image = ($('[class*="product"] ~ * picture img').first || {}).src;

				title = title.replace(RegExp(`\\s*\\(${ year }|\\d{4}\\)`), '');
				year  = year || +R.$1;
				break;

			case 'tv':
				title = $('h1[itemprop="name"], h1').first.textContent.replace(/\s*\((\d+)\)\s*/, '').trim();
				year  = +$('.release-date > *:last-child').first.textContent.replace(/[^]*(\d{4})[^]*?$/g, '$1').trim();
				image = $('[class*="product"] ~ * picture img').first.src;

				title = title.replace(RegExp(`\\s*\\(${ year }\\)`), '');
				break;

			default:
				/* Error */
				return {};
		}

		setTimeout(script.adjustButton, 1000);

		return { type, title, year, image };
	},

	"getType": () => {
		return /(\/\w+)?\/tv-season\//.test(top.location.pathname)?
			'tv':
		'movie'
	},

	"adjustButton": () => {
		let button = $('.web-to-plex-button').first;

		button.attributes.style.value += '; box-sizing: border-box !important; font-size: 16px !important; line-height: normal !important;';
	},
};
