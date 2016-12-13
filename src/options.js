// Saves options to chrome.storage.sync.
function saveOptions() {
	var plexToken = document.getElementById('plex_token').value;
	var plexMachineId = document.getElementById('plex_machine_id').value;
	var plexUrlRoot = document.getElementById('plex_url_root').value;
	var plexLibraryId = document.getElementById('plex_library_id').value;
	var couchpotatoUrlRoot = document.getElementById('couchpotato_url_root').value;
	var couchpotatoToken = document.getElementById('couchpotato_token').value;
	var couchpotatoBasicAuthUsername = document.getElementById('couchpotato_basic_auth_username').value;
	var couchpotatoBasicAuthPassword = document.getElementById('couchpotato_basic_auth_password').value;

	if (couchpotatoUrlRoot) {
		// When asking permissions the URL needs to have a trailing slash.
		chrome.permissions.request({
			origins: [`${couchpotatoUrlRoot}/`]
		});
	}

	chrome.storage.sync.set({
		plexToken,
		plexMachineId,
		plexUrlRoot,
		plexLibraryId,
		couchpotatoUrlRoot,
		couchpotatoToken,
		couchpotatoBasicAuthUsername,
		couchpotatoBasicAuthPassword,
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
	// Use default value color = 'red' and likesColor = true.
	chrome.storage.sync.get(null, function(items) {
		document.getElementById('plex_token').value = items.plexToken || '';
		document.getElementById('plex_machine_id').value = items.plexMachineId || '';
		document.getElementById('plex_url_root').value = items.plexUrlRoot || '';
		document.getElementById('plex_library_id').value = items.plexLibraryId || '';
		document.getElementById('couchpotato_url_root').value = items.couchpotatoUrlRoot || '';
		document.getElementById('couchpotato_token').value = items.couchpotatoToken || '';
		document.getElementById('couchpotato_basic_auth_username').value = items.couchpotatoBasicAuthUsername || '';
		document.getElementById('couchpotato_basic_auth_password').value = items.couchpotatoBasicAuthPassword || '';
	});
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
