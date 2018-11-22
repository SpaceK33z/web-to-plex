# Web to Plex (BETA Channel) ![Icon](src/img/48.png)

![Logo](src/img/256.png)

This browser extension searches your [Plex Media Server (PMS)](https://www.plex.tv/downloads/) for matching media on sites like [IMDb](https://imdb.com), letting you immediately open the movie or TV show in Plex, if it is available. If the item isn't found on your PMS, then a download button is added instead.

Optionally, you can configure [Sonarr](https://sonarr.tv/) (TV Shows), [Radarr](https://radarr.video/) (Movies), [Watcher 3](https://nosmokingbandit.github.io/) (Movies), and/or [CouchPotato](https://couchpota.to/) (Both) in the extension's options. After that, you can immediately add a TV show or movie to CouchPotato/Sonarr/Radarr/Watcher with one click, right from your favorite site.

If you don't feel like actually downloading the movie, or want a simple watchlist, you can also use the built-in "Plex It!" feature to bookmark the current page.

![Examples](example.png)

----

## Status: 307 (TEMP-RD)

This is the BETA (testing) version, please visit [Web to Plex](https://github.com/SpaceK33z/web-to-plex) for the stable version.

----

## Features:

- Can save media directly from noted sites (file downloads/magnet URLs)
  - Right-click | Web to Plex | Save as "Show/Movie (Year)"
- Can push requests to your chosen NZB manager
  - [Radarr](https://radarr.video/)
  - [Sonarr](https://sonarr.tv/)
  - [CouchPotato](https://couchpota.to/)
  - [Watcher 3](https://nosmokingbandit.github.io/) ("Watcher, version 3")
- Offers search options via right-click (context menu)
  - Right-click | Web to Plex | Find "Show/Movie (Year)"
- Offers a Plex-like GUI
  - Web to Plex button
  - Settings page
  - Pop-up page
- Offers a status via the browser badge and button
  - Orange/Yellow: item is on Plex
  - Blue (button): item isn't on Plex, but can be sent for
  - Grey (badge)/Red (button): item is unavailable/not found
  - Grey (button): item is loading
- Offers an easy login feature
  - Offers an API login feature
- Offers a "Direct Plex URL" feature
  - i.e. you can specify `localhost:32400` as your Plex URL to avoid bandwidth usage for Plex requests

## Supported sites: *Site (button location)*

*Given in order of completion*

1.  [Movieo](http://movieo.me/)
2.  [IMDb](http://imdb.com/)
3.  [Trakt.tv](https://trakt.tv/)
4.  [Letterboxd](https://letterboxd.com/)
5.  [GoStream](https://gostream.site/)<sup>1</sup>
    - Replaced Flenix
6.  [TV Maze](http://www.tvmaze.com/)
7.  [The TVDb](https://www.thetvdb.com/)
8.  [The MovieDb](https://www.themoviedb.org/)
9.  [VRV](https://vrv.co/)<sup>2</sup>
10. [Hulu](https://hulu.com/)<sup>2/3/4</sup>
11. [Google Play Store](https://play.google.com/store/movies/)
    - Also runs on Google search results
12. [iTunes](https://itunes.apple.com/)<sup>3/5</sup>
13. [Metacritic](http://www.metacritic.com/)<sup>4</sup>
14. [Fandango](https://www.fandango.com/)
15. [Amazon](https://www.amazon.com/)<sup>5</sup>
16. [Vudu](https://www.vudu.com/)
17. [Verizon](https://www.tv.verizon.com/)
18. [CouchPotato](http://couchpotato.life/)
19. [Rotten Tomatoes](https://www.rottentomatoes.com/)
20. [ShowRSS](https://showrss.info/)<sup>1</sup> (button isn't meant to appear)
21. [Netflix](https://netflix.com/)<sup>3</sup>
22. [Toloka](https://toloka.to/)<sup>6</sup>
23. [Shana Project](https://www.shanaproject.com/)<sup>6</sup>
24. [My Anime List](https://myanimelist.com/)<sup>6</sup>

*Notes*

- `1` *This site uses the `Right click | Web to Plex | Save as...` feature (file download), or a direct link (usually magnet URL).*
- `2` *This site has a loading issue, simply refresh the page if the button doesn't appear.*
- `3` *This site doesn't allow media browsing, or requires a subscription beforehand.*
- `4` *This site is network intensive (loads slowly). Be patient.*
- `5` *This site is known to update frequently, support may change without notice.*
- `6` *This site is only supported via a plugin (enabled in the settings)*

## In Progress sites (adding support):

- Nothing here... for now

## En Progress sites (may add support):

- Nothing here... for now

## Installing Web to Plex

- **Download the [CRX](https://github.com/Ephellon/web-to-plex/raw/master/src.crx)**

- **Download the [ZIP](https://github.com/Ephellon/web-to-plex/raw/master/src.zip)**

- **Download the [SRC](https://github.com/Ephellon/web-to-plex/archive/master.zip)**

## Requirements

+ [**Plex Media Server v1.4.3.0**](https://www.plex.tv/downloads/#getdownload) or higher

+ Before using the [extension](chrome://extensions), you must configure the settings

## Issues & Contributions

If you have any problem with the extension, please don't hesitate to [submit an issue](https://github.com/Ephellon/web-to-plex/issues/new).

All contributions are welcome.
