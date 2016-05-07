    var unirest = require('unirest');
    var express = require('express');
    var events = require('events');

    var getFromApi = function(endpoint, args) {
        // console.log('Where is Adele');
        var emitter = new events.EventEmitter();
        unirest.get('https://api.spotify.com/v1/' + endpoint)
            .qs(args)
            .end(function(response) {
                if (response.ok) {
                    // console.log(emitter);
                    emitter.emit('end', response.body);
                } else {
                    console.log('I am an error');
                    emitter.emit('error', response.code);
                }
            });
        return emitter;
    };

    var app = express();
    app.use(express.static('public'));

    app.get('/search/:name', function(req, res) {
        var searchReq = getFromApi('search', {
            q: req.params.name,
            limit: 1,
            type: 'artist'
        });

        searchReq.on('end', function(item) {
            var artist = item.artists.items[0];
            searchReq.emit('getRelatedArtists', artist);
        })

        searchReq.on('getRelatedArtists', function(artist) {
            var relatedRequest = getFromApi('artists/' + artist.id + '/related-artists'); // sets emmitter to relatedRequest
            // getFromApi 'end' now points here
            relatedRequest.on('end', function(related) {
                var result = { // create new object to hold original artist and array of related artists
                        artist: artist,
                        related: related
                    }
                res.json(result); // send new obj to handlebars. (Had to faff with Handlebars template to make this work)
            });
        });
        searchReq.on('error', function(code) {
            res.sendStatus(code);
        });
    });
    app.listen(8080);
