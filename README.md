# Dominion Card Image Generator

This is a web-app to generate mockups of fan cards for the deckbuilder card game [dominion](http://wiki.dominionstrategy.com).
You can find more information and discussion of the project in the [fan cards section of the dominion strategy forum](http://forum.dominionstrategy.com/index.php?topic=16622.msg791247#new).

Open the web-app [here](https://shardofhonor.github.io/dominion-card-generator/), start creating your own cards and share them with us! 
```
https://shardofhonor.github.io/dominion-card-generator/
```

### Disclaimer

The design of the cards is property of the creator of the game, Donald X. Vaccarino and Rio Grande Games.

### Run it yourself
This project runs directly on GitHub Pages.
If you want to host the generator yourself, please also run your own version of [cors-anywhere](https://github.com/Rob--W/cors-anywhere), whitelist your server and replace the following URL within the sourcecode.
```
https://dominion-card-generator-cors.herokuapp.com/
```

Before deploying the contents of `docs/`, run the service worker versioning step so
clients pick up new assets without a manual cache clear:

```
npm run update-sw-version
```

You can optionally provide `SW_VERSION=<commit-hash-or-build-id>` when running the
command; otherwise the script uses the current git commit hash or a timestamp.

### Favorites Import Format
The generator allows saving favorite cards in your browser. The favorites menu
now supports importing files in two formats:

1. A JSON array exported from the generator.
2. A simple CSV file where each line contains a card link.
