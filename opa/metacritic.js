let script = {
	"url": "*://*.metacritic.com/(movie|tv|list)/*",

	"ready": () => !!top.AbsoluteReady,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image,
			type = script.getType();

		switch(type) {
			case 'tv':
			case 'movie':
				title  = $('.product_page_title > *, .product_title').first;
				year   = $('.product_page_title > .release_year, .product_data .release_data').first;
				image  = $('.summary_img').first;

				title = title.textContent.replace(/\s+/g, ' ').trim();
				year  = +year.textContent.replace(/\s+/g, ' ').replace(/.*(\d{4}).*$/, '$1').trim();
				image = (image || {}).src;

				type = type == 'tv'? 'show': type;

				return { type, title, year, image };
				break;

			case 'list':
				/* Not yet implemented */
				break;

			default:
				/* Error */
				return {};
				break;
		}
	},

	"getType": () => {
		/^\/(movie|tv|list)\//.test(top.location.pathname);

		let type = RegExp.$1;

		return type;
	},

	"process": (element) => {
		/* Not implemented... Metacritic has too much sh*t loading to even try to open a console */
		/* Targeted for v5/v6 */
	},
};

if(!top.WaitingOnAbsoluteReady) {
	top.addEventListener('load', event => {
		top.AbsoluteReady = true;

		$('.web-to-plex-button a.list-action').first.onclick = event => event;
	});

	top.WaitingOnAbsoluteReady = true;
}
