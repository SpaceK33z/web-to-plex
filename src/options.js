// Saves options to chrome.storage.sync.
function saveOptions() {
	var plexToken = document.getElementById('plex_token').value;
	var plexMachineId = document.getElementById('plex_machine_id').value;
	var plexUrlRoot = document.getElementById('plex_url_root').value;
	var plexLibraryId = document.getElementById('plex_library_id').value;
	chrome.storage.sync.set({
		plexToken,
		plexMachineId,
		plexUrlRoot,
		plexLibraryId,
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
	});
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
