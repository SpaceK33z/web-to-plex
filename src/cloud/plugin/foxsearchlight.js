let plugin = {
	"url": "*://*.foxsearchlight.com/(?!films|search|$)",

	"ready": () => (getComputedStyle($('.pace').first).opacity == '0'),

	"timeout": 5000,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.lockout h1').first,
			year  = $('.lockout h3').first,
			image = $('.poster img').first;

		if(!title)
			return -1;

		title = title.textContent.trim();
		image = image.src;

		year.textContent.replace(/(\d{4})\s*$/, '$1');
		year = +R.$1 || YEAR;

		return { type: 'film', title, year, image };
	},
};
