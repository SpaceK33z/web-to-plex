**We're currently in the process of making a v4 release which will contain the features listed below. The currently available version on the Chrome and Firefox webstore won't contain these features!**

# Web to Plex ![Icon](src/img/48.png)

![Examples](example.png)

This browser extension searches your [Plex Media Server (PMS)](https://www.plex.tv/downloads/) for matching media on sites like [IMDb](https://imdb.com), letting you immediately open the movie or TV show in Plex, if it is available. If the item isn't found on your PMS, then a download button is added instead.

----

## Features:

- Can save media directly from noted sites (file downloads/magnet URLs)
  - Right-click | Web to Plex | Save as "Show/Movie (Year)"
- Can push requests to your chosen download manager
  - [Radarr](https://radarr.video/)
  - [Sonarr](https://sonarr.tv/)
  - [CouchPotato](https://couchpota.to/)
  - [Watcher 3](https://nosmokingbandit.github.io/)
  - [Ombi](https://ombi.io/)
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

# Download Managers

Optionally, you can configure your download manager(s) (see support table) in the extension's options. After that, you can immediately add a TV show or movie with one click, right from your favorite site.

## Supported Managers
| Manager                                         | Movie Support | TV Show Support | Searchable
| ----------------------------------------------- | ------------- | --------------- | ----------
| [Watcher 3](https://nosmokingbandit.github.io/) | Yes           |                 |
| [CouchPotato](https://couchpota.to/)            | Yes           | Yes             |
| [Radarr](https://radarr.video/)                 | Yes           |                 | Yes
| [Sonarr](https://sonarr.tv/)                    |               | Yes             | Yes
| [Ombi](https://ombi.io/)                        | Yes           | Yes             | Yes

If you don't feel like actually downloading the movie, or want a simple watchlist, you can also use the built-in "Plex It!" feature to bookmark the current page.

## Supported sites

1.  [Movieo](http://movieo.me/)
2.  [IMDb](http://imdb.com/)
3.  [Trakt.tv](https://trakt.tv/)
4.  [Letterboxd](https://letterboxd.com/)
5.  [GoStream](https://gostream.site/)<sup>1</sup>
6.  [TV Maze](http://www.tvmaze.com/)
7.  [The TVDb](https://www.thetvdb.com/)
8.  [The MovieDb](https://www.themoviedb.org/)
9.  [VRV](https://vrv.co/)<sup>2</sup>
10. [Hulu](https://hulu.com/)<sup>2/3/4</sup>
11. [Google Play Store](https://play.google.com/store/movies/)
12. Google Search (search results)
13. [iTunes](https://itunes.apple.com/)<sup>3/5</sup>
14. [Metacritic](http://www.metacritic.com/)<sup>4</sup>
15. [Fandango](https://www.fandango.com/)
16. [Amazon](https://www.amazon.com/)<sup>5</sup>
17. [Vudu](https://www.vudu.com/)
18. [Verizon](https://www.tv.verizon.com/)
19. [CouchPotato](http://couchpotato.life/)
20. [Rotten Tomatoes](https://www.rottentomatoes.com/)
21. [ShowRSS](https://showrss.info/)<sup>1</sup> (button isn't meant to appear)
22. [Netflix](https://netflix.com/)<sup>3</sup>
23. [Toloka](https://toloka.to/)<sup>6</sup>
24. [Shana Project](https://www.shanaproject.com/)<sup>6</sup>
25. [My Anime List](https://myanimelist.com/)<sup>6</sup>
26. [YouTube](https://youtube.com/)
27. [Flickmetrix (Cinesift)](https://flickmetrix.com/)
28. [Allociné](https://www.allocine.fr/)
29. [MovieMeter](https://www.moviemeter.nl/)
30. [JustWatch](https://justwatch.com/)

*Notes*

- `1` *This site uses the `Right click | Web to Plex | Save as...` feature (file download), or a direct link (usually magnet URL).*
- `2` *This site has a loading issue, simply refresh the page if the button doesn't appear.*
- `3` *This site doesn't allow media browsing, or requires a subscription beforehand.*
- `4` *This site is network intensive (loads slowly). Be patient.*
- `5` *This site is known to update frequently, support may change without notice.*
- `6` *This site is only supported via a plugin (enabled in the settings)*

## Installing Web to Plex

**Download on [Chrome Webstore](https://chrome.google.com/webstore/detail/movieo-to-plex/kmcinnefmnkfnmnmijfmbiaflncfifcn).**

**Download on [FireFox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/web-to-plex/).**

**Download the [SRC](https://github.com/Ephellon/web-to-plex/archive/master.zip)**

## Requirements

+ [**Plex Media Server v1.4.3.0**](https://www.plex.tv/downloads/#getdownload) or higher

+ Before using the [extension](chrome://extensions), you must configure the settings

## Issues & Contributions

If you have any problem with the extension, please don't hesitate to [submit an issue](https://github.com/SpaceK33z/web-to-plex/issues/new).

All contributions are welcome.
