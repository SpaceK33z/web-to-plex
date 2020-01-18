let script = {
	"url": "*://play.google.com/store/(movies|tv)/details/*",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type  = script.getType(),
			title = $('h1').first,
			year  = $(`h1 ~ div span:${ type == 'movie'? 'first': 'last' }-of-type`).first,
			image = $('img[alt="cover art" i]').first;

		title = title.textContent.replace(/\s*\(\s*(\d{4})\s*\).*?$/, '').trim();
		year = +(year.textContent || R.$1).replace(/^.*?(\d{4})/, '$1').trim();
		image = (image || {}).src;

		return { type, title, year, image };
	},

	"getType": () => (
		location.pathname.startsWith('/store/movies')?
			'movie':
		'show'
	),
};
