// optional
// "Friendly Name" requires: api|username|password|token
// api - the user's api tokens (external, such as TMDb/OMDb)
// username - the user's usernames (internal, such as Radarr/Sonarr/etc.)
// password - the user's passwords (internal)
// token - the user's tokens (internal)
// Example: "Web to Plex" requires: api, token

let script = {
	// required
	"url": "< URL RegExp >",
	// Example: *://*.amazon.*/*/video/(detail|buy)/*
	// *://         - match any protocol (http, https, etc.)
	// *.amazon     - match any sub-domain (www, ww5, etc.)
	// .*           - match any TLD (com, net, org, etc.)
	// /*           - match any path
	// (detail|buy) - match one of the items

	// optional
	"ready": () => { /* return a boolean to describe if the page is ready */ },

	// optional
	"timeout": 1000, // if the script fails to complete, retry after ... milliseconds

	// required
	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('#title').first,
			year  = $('#year').first,
			image = $('#image').first,
			type  = script.getType(); // described below

		return { type, title, year, image };
	},

	// optional | functioanlity only
	"getType": () => 'movie' || 'show',
};
