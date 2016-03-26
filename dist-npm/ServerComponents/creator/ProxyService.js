"use strict";
var request = require('request');
/* Multiple storage engine supported, e.g. file system, mongo  */
var ProxyService = (function () {
    function ProxyService() {
    }
    ProxyService.prototype.init = function (apiServiceManager, server, config) {
        var _this = this;
        this.server = server;
        console.log('init proxy');
        this.baseUrl = apiServiceManager.BaseUrl + '/proxy';
        //console.log(this.baseUrl);
        server.get(this.baseUrl, function (req, res) {
            var id = req.query.url;
            console.log(id);
            _this.getUrl(id, res);
        });
    };
    ProxyService.prototype.shutdown = function () { };
    ProxyService.prototype.getUrl = function (feedUrl, res) {
        console.log('proxy request: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';
        var parseNumbers = function (str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };
        request(feedUrl, function (error, response, xml) {
            if (!error && response.statusCode == 200) {
                res.json(xml);
            }
            else {
                res.statusCode = 404;
                res.end();
            }
        });
    };
    return ProxyService;
}());
module.exports = ProxyService;
//# sourceMappingURL=ProxyService.js.map