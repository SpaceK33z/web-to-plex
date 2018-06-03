# Empty rule to force other rules to be updated.
FORCE:

include env
release: FORCE commit-version release-chrome release-firefox

lint: FORCE
	node_modules/.bin/addons-linter pkg-firefox.zip

commit-version: FORCE
	test $(version)
	sed -i '/"version"/c\ \ \ "version": "$(version)",' src/manifest.json src/manifest_firefox.json
	git commit -am "$(version)"
	git tag "v$(version)"

release-chrome: FORCE
	rm -f pkg-chrome.zip
	npm run -s build
	cd build; zip -r ../pkg-chrome.zip **

build-firefox: FORCE
	rm -f pkg-firefox.zip
	FIREFOX=1 npm run -s build
	find build -name '.DS_Store' -type f -delete
	cd build; zip -r ../pkg-firefox.zip **

release-firefox: FORCE build-firefox lint

publish: FORCE
	./node_modules/.bin/webstore upload --source pkg-chrome.zip --extension-id=$(EXTENSION_ID) --client-id=$(CLIENT_ID) --client-secret=$(CLIENT_SECRET) --refresh-token=$(REFRESH_TOKEN) --auto-publish
