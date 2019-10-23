let script = {
	"url": "*://*.tubitv.com/(movies|series)/\\d+/*",

	"timeout": 1000,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('._1mbQP').first,
			year  = $('._3BhXb').first,
			image = $('._2TykB').first,
			type  = script.getType(); // described below

		title = title.textContent.trim();
		year  = +year.textContent.replace(/[^]*\((\d+)\)[^]*/g, '$1').trim();
		image = image.getAttribute('style').replace(/[^]+url\('([^]+?)'\)/, '$1');

		return { type, title, year, image };
	},

	"getType": () => (/^\/movies?/.test(top.location.pathname)? 'movie': 'show'),
};
