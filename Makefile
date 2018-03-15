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

firefox: FORCE
	rm -rf build/firefox
	mkdir -p build
	cp -r src/. build/firefox
	rm build/firefox/manifest.json
	mv build/firefox/manifest_firefox.json build/firefox/manifest.json

release-chrome: FORCE
	rm -f pkg-chrome.zip
	cd src; zip -r ../pkg-chrome.zip **

build-firefox: FORCE firefox
	rm -f pkg-firefox.zip
	find build/firefox -name '.DS_Store' -type f -delete
	cd build/firefox; zip -r ../../pkg-firefox.zip **

release-firefox: FORCE build-firefox lint

publish: FORCE
	./node_modules/.bin/webstore upload --source pkg-chrome.zip --extension-id=$(EXTENSION_ID) --client-id=$(CLIENT_ID) --client-secret=$(CLIENT_SECRET) --refresh-token=$(REFRESH_TOKEN) --auto-publish
