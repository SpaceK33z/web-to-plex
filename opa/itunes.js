let script = {
	"url": "*://itunes.apple.com/\\w{2,4}/(movie|tv(-season)?)/*",

	"ready": () => (!$('.section').empty && top.__NewCSP__),

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image, type = script.getType();

		switch(type) {
			case 'movie':
				title = $('[class~="movie-header__title"i]').first.textContent;
				year  = +$('time, [datetime]').first.textContent;
				image = ($('picture img, [class*="product"] ~ * picture img').first || {}).src;

				title = title.replace(RegExp(`\\s*\\(${ year }|\\d{4}\\)`), '');
				year  = year || +R.$1;
				break;

			case 'tv':
				title = $('[class~="show-header__title"i], h1[itemprop="name"], h1').first.textContent.replace(/\s*\((\d+)\)\s*/, '').trim();
				year  = +$('time, .release-date > *:last-child').first.textContent.replace(/[^]*(\d{4})[^]*?$/g, '$1').trim();
				image = $('picture img, [class*="product"] ~ * picture img').first.src;

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
		return /(\/\w+)?\/tv(-season)?\//.test(top.location.pathname)?
			'tv':
		'movie'
	},

	"adjustButton": () => {
		let button = $('.web-to-plex-button').first;

		button.attributes.style.value += '; box-sizing: border-box !important; font-size: 16px !important; line-height: normal !important;';
	},

	"minions": () => {
		let actions = $('.product-header > *:last-child > *:first-child');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion = furnish('a.web-to-plex-minion.we-button.we-button--outlined.we-button-external.icon.icon-external', {}, 'Web to Plex ');

			addMinions(minion);
			element.appendChild(minion);
		});
	},
};


top.__NewCSP__ = top.__NewCSP__ || false;
if(!top.__NewCSP__) {
	/* Add 'data:' to the CSP */
	let ContentSecurityPolicies = $('meta[http-equiv="Content-Security-Policy"]');

	if(ContentSecurityPolicies.empty)
		return;

	ContentSecurityPolicies.forEach(ContentSecurityPolicy =>
		ContentSecurityPolicy.content = ContentSecurityPolicy.content
			.split(';')
			.map(src => {
				let type;

				src = src.trim().split(' ');
				type = src[0];

				if(type == 'font-src')
					src.push('http://webtoplex.github.io', 'https://webtoplex.github.io');

				return src.join(' ');
			})
			.join(';')
	);

	top.__NewCSP__ = true;
}
