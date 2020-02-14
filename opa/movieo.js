let script = {
	"url": "*://*.movieo.me/*",

	"ready": () => !$('.share-box, .zopim').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image, IMDbID,
			type = script.getType();

		switch(type) {
			case 'movie':
				title = $('#doc_title').first;
				year  = $('meta[itemprop="datePublished"i]').first;
				image = $('img.poster').first;

				title  = title.dataset.title.trim();
				year   = +year.content.slice(0, 4);
				image  = (image || {}).src;
				IMDbID = script.getIMDbID();
				break;

			case 'list':
				let items = $('[data-title][data-id]'),
					options = [];

				items.forEach((element, index, array) => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});

				return options;
				break;

			default:
				/* Error */
				return {};
				break;
		}

		return { type, title, year, image, IMDbID };
	},

	"getType": () => {
		let type = /\/(black|seen|watch)?lists?\//i.test(top.location.pathname)?
				'list':
			'movie';

		return type;
	},

	"getIMDbID": () => {
		let link = $(
			'.tt-parent[href*="imdb.com/title/tt"i]'
		).first;

		if(link)
			return link.href.replace(/^[^]*\/title\//i, '');
	},

	"process": (element) => {
		let title = $('.title', element).first,
			image = $('.poster-cont', element).first,
			year, type = 'movie';

		title = title.textContent.trim().replace(/\s*\((\d{4})\)/, '');
		year  = +RegExp.$1;
		image = image.dataset.src;

		return { type, title, year, image };
	},

	"minions": () => {
		// The button text in the "Comments" button takes up too much space, so we hide it
		// It's very clear that it's about comments event without the text
		let comments = $('.mid-top-actions .comments-link .txt');

		if(!comments.empty)
			comments.forEach(comment => comment.remove());

		let actions = $('.mid-top-actions');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion = furnish('a.web-to-plex-minion.button.comments-link', {}, 'Web to Plex');

			addMinions(minion);
			element.appendChild(minion);
		});
	},
};
