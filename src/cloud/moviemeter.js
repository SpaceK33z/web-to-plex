let script = {
	"url": "*://*.moviemeter.nl/film/\\d+",

	"ready": () => !$('.rating + p font').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.details span').first,
			year  = $('.details *').first,
			image = $('.poster').first,
			type  = script.getType();

		if(!title || !year)
			return 1000;

		year  = year.lastChild.textContent;
		title = title.textContent.replace(year, '').trim();
		year  = +year.replace(/\D+/g, '');
		image = image.src;

		return { type, title, year, image };
	},

	"getType": () => {
		let time = $('.rating + p font').last;

		time = time.textContent;

		if(/(series|show)/.test(time))
			return 'show';
		return 'film';
	},
};
