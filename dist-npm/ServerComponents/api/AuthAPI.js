"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var qs = require("querystring");
var bcrypt = require("bcryptjs");
// import colors = require('colors');
var cors = require("cors");
var jwt = require("jwt-simple");
// import moment = require('moment');
// import mongoose = require('mongoose');
var request = require("request");
var Winston = require("winston");
var ApiManager = require("./ApiManager");
var Feature = ApiManager.Feature;
var ApiResult = ApiManager.ApiResult;
var config = require("./config");
var dateExt = require('../helpers/DateUtils');
/**
 * Authentication API based on Satellizer, which uses a JSON Web Token for access control.
 */
var AuthAPI = (function () {
    function AuthAPI(manager, server, baseUrl) {
        if (baseUrl === void 0) { baseUrl = "/api"; }
        this.manager = manager;
        this.server = server;
        this.baseUrl = baseUrl;
        User.manager = manager;
        baseUrl += '/auth/:teamId';
        Winston.info('Authentication REST service: ' + baseUrl);
        this.userUrl = baseUrl + '/me';
        this.loginUrl = baseUrl + '/login';
        this.signupUrl = baseUrl + '/signup';
        // Force HTTPS on Heroku
        if (server.get('env') === 'production') {
            server.use(function (req, res, next) {
                var protocol = req.get('x-forwarded-proto');
                protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
            });
        }
        //enables cors, used for external swagger requests
        this.server.use(cors());
        // Read user details
        this.server.get(this.userUrl, this.ensureAuthenticated, this.getUser);
        // Update user details
        this.server.put(this.userUrl, this.ensureAuthenticated, this.updateUser);
        // Log in with Email
        this.server.post(this.loginUrl, this.login);
        // Signup
        this.server.post(this.signupUrl, this.signup);
        // Unlink Provider
        this.server.post(this.baseUrl + '/unlink', this.ensureAuthenticated, this.unlinkProvider);
        // Login with Google
        this.server.post(this.baseUrl + '/google', this.googleLogin);
        // Login with Github
        this.server.post(this.baseUrl + '/github', this.githubLogin);
        // Login with LinkedIn
        this.server.post(this.baseUrl + '/linkedin', this.linkedinLogin);
        // Login with Windows Live
        this.server.post(this.baseUrl + '/live', this.windowsLiveLogin);
        // Login with Facebook
        this.server.post(this.baseUrl + '/facebook', this.facebookLogin);
        // Login with Yahoo
        this.server.post(this.baseUrl + '/yahoo', this.yahooLogin);
        // Login with Twitter
        this.server.post(this.baseUrl + '/twitter', this.twitterLogin);
        // Login with Foursquare
        this.server.post(this.baseUrl + '/foursquare', this.foursquareLogin);
        // Login with Twitch
        this.server.post(this.baseUrl + '/twitch', this.twitchLogin);
    }
    /** Read user details */
    AuthAPI.prototype.getUser = function (req, res) {
        User.findById(req.params.teamId, req.user, function (err, user) {
            if (err) {
                Winston.error('Error: couldn\'t find user: team ' + req.params.teamId, ', user ' + req.user);
                return res.status(401).send({ message: 'Couldn\'t find user.' });
            }
            else {
                res.send(user);
            }
        });
    };
    /** Update user details */
    AuthAPI.prototype.updateUser = function (req, res) {
        User.findById(req.params.teamId, req.user, function (err, user) {
            if (!user) {
                Winston.warn('Updating user not possible. User not found: Team ' + req.params.teamId, ', user ' + req.user);
                return res.status(400).send({ message: 'User not found' });
            }
            user.displayName = req.body.displayName || user.displayName;
            user.email = req.body.email || user.email;
            user.save(req.params.teamId, function (err) {
                res.status(200).end();
            });
        });
    };
    /** Log in with Email */
    AuthAPI.prototype.login = function (req, res) {
        User.findById(req.params.teamId, req.body.email, function (err, user) {
            if (!user) {
                return res.status(401).send({ message: 'Wrong email and/or password' });
            }
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (!isMatch) {
                    return res.status(401).send({ message: 'Wrong email and/or password' });
                }
                res.send({ token: AuthAPI.createJWT(user) });
            });
        });
    };
    /** Signup */
    AuthAPI.prototype.signup = function (req, res) {
        User.findById(req.params.teamId, req.body.email, function (err, existingUser) {
            if (existingUser) {
                return res.status(409).send({ message: 'Email is already taken' });
            }
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    var user = new User({
                        displayName: req.body.displayName,
                        email: req.body.email,
                        password: hash
                    });
                    user.save(req.params.teamId, function () {
                        res.send({ token: AuthAPI.createJWT(user) });
                    });
                });
            });
        });
    };
    /** Ensure that the user is authenticated by verifying his authorization token. */
    AuthAPI.prototype.ensureAuthenticated = function (req, res, next) {
        //Winston.error(`AuthN team ${req.params.teamId}`);
        if (!req.headers['authorization']) {
            return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
        }
        var token = req.headers['authorization'].split(' ')[1];
        //Winston.error(`Token received: ${token}`);
        //var user: IUser = { displayName: 'Erik', email: 'erik.vullings@gmail.com', password: '1234' };
        //var testPayload = AuthAPI.createJWT(user);
        //Winston.error(`Token expected: ${jwt.encode(testPayload, config.TOKEN_SECRET) }`);
        var payload = null;
        try {
            payload = jwt.decode(token, config.TOKEN_SECRET);
        }
        catch (err) {
            Winston.error("Error " + err.message);
            return res.status(401).send({ message: err.message });
        }
        if (payload.exp <= Date.now()) {
            return res.status(401).send({ message: 'Token has expired' });
        }
        req.user = payload.sub;
        //Winston.error('Passed ensureAuthenticated...')
        next();
    };
    /** Generate JSON Web Token */
    AuthAPI.createJWT = function (user) {
        var now = new Date();
        var payload = {
            sub: user.email,
            iat: now.getTime(),
            exp: now.addDays(14).getTime()
        };
        return jwt.encode(payload, config.TOKEN_SECRET);
    };
    /** Unlink the provider */
    AuthAPI.prototype.unlinkProvider = function (req, res) {
        var provider = req.body.provider;
        var providers = ['facebook', 'foursquare', 'google', 'github', 'linkedin', 'live', 'twitter', 'yahoo'];
        if (providers.indexOf(provider) === -1) {
            return res.status(400).send({ message: 'Unknown OAuth Provider' });
        }
        User.findById(req.params.teamId, req.user, function (err, user) {
            if (!user) {
                return res.status(400).send({ message: 'User Not Found' });
            }
            user[provider] = undefined;
            user.save(req.params.teamId, function (err) {
                res.status(200).end();
            });
        });
    };
    /** Login with Google */
    AuthAPI.prototype.googleLogin = function (req, res) {
        var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
        var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.GOOGLE_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        // Step 1. Exchange authorization code for access token.
        request.post(accessTokenUrl, { json: true, form: params }, function (err, response, token) {
            var accessToken = token.access_token;
            var headers = { Authorization: 'Bearer ' + accessToken };
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, headers: headers, json: true }, function (err, response, profile) {
                if (profile.error) {
                    return res.status(500).send({ message: profile.error.message });
                }
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { google: profile.sub }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.google = profile.sub;
                            user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, function () {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { google: profile.sub }, function (err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.google = profile.sub;
                        user.picture = profile.picture.replace('sz=50', 'sz=200');
                        user.displayName = profile.name;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    // Login with Github
    AuthAPI.prototype.githubLogin = function (req, res) {
        var accessTokenUrl = 'https://github.com/login/oauth/access_token';
        var userApiUrl = 'https://api.github.com/user';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.GITHUB_SECRET,
            redirect_uri: req.body.redirectUri
        };
        // Step 1. Exchange authorization code for access token.
        request.get({ url: accessTokenUrl, qs: params }, function (err, response, accessToken) {
            accessToken = qs.parse(accessToken);
            var headers = { 'User-Agent': 'Satellizer' };
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function (err, response, profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { github: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.github = profile.id;
                            user.picture = user.picture || profile.avatar_url;
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { github: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.github = profile.id;
                        user.picture = profile.avatar_url;
                        user.displayName = profile.name;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    /** Login with LinkedIn */
    AuthAPI.prototype.linkedinLogin = function (req, res) {
        var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
        var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.LINKEDIN_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        // Step 1. Exchange authorization code for access token.
        request.post(accessTokenUrl, { form: params, json: true }, function (err, response, body) {
            if (response.statusCode !== 200) {
                return res.status(response.statusCode).send({ message: body.error_description });
            }
            var params = {
                oauth2_access_token: body.access_token,
                format: 'json'
            };
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, qs: params, json: true }, function (err, response, profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { linkedin: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.linkedin = profile.id;
                            user.picture = user.picture || profile.pictureUrl;
                            user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { linkedin: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.linkedin = profile.id;
                        user.picture = profile.pictureUrl;
                        user.displayName = profile.firstName + ' ' + profile.lastName;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    /** Login with Windows Live */
    AuthAPI.prototype.windowsLiveLogin = function (req, res) {
        async.waterfall([
            // Step 1. Exchange authorization code for access token.
            function (done) {
                var accessTokenUrl = 'https://login.live.com/oauth20_token.srf';
                var params = {
                    code: req.body.code,
                    client_id: req.body.clientId,
                    client_secret: config.WINDOWS_LIVE_SECRET,
                    redirect_uri: req.body.redirectUri,
                    grant_type: 'authorization_code'
                };
                request.post(accessTokenUrl, { form: params, json: true }, function (err, response, accessToken) {
                    done(null, accessToken);
                });
            },
            // Step 2. Retrieve profile information about the current user.
            function (accessToken, done) {
                var profileUrl = 'https://apis.live.net/v5.0/me?access_token=' + accessToken.access_token;
                request.get({ url: profileUrl, json: true }, function (err, response, profile) {
                    done(err, profile);
                });
            },
            function (profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { live: profile.id }, function (err, user) {
                        if (user) {
                            return res.status(409).send({ message: 'There is already a Windows Live account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, existingUser) {
                            if (!existingUser) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            existingUser.live = profile.id;
                            existingUser.displayName = existingUser.displayName || profile.name;
                            existingUser.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(existingUser);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user or return an existing account.
                    User.findOne(req.params.teamId, { live: profile.id }, function (err, user) {
                        if (user) {
                            return res.send({ token: AuthAPI.createJWT(user) });
                        }
                        var newUser = new User();
                        newUser.live = profile.id;
                        newUser.displayName = profile.name;
                        newUser.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(newUser);
                            res.send({ token: token });
                        });
                    });
                }
            }
        ]);
    };
    /** Login with Facebook */
    AuthAPI.prototype.facebookLogin = function (req, res) {
        var accessTokenUrl = 'https://graph.facebook.com/v2.3/oauth/access_token';
        var graphApiUrl = 'https://graph.facebook.com/v2.3/me';
        var params = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.FACEBOOK_SECRET,
            redirect_uri: req.body.redirectUri
        };
        // Step 1. Exchange authorization code for access token.
        request.get({ url: accessTokenUrl, qs: params, json: true }, function (err, response, accessToken) {
            if (response.statusCode !== 200) {
                return res.status(500).send({ message: accessToken.error.message });
            }
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: graphApiUrl, qs: accessToken, json: true }, function (err, response, profile) {
                if (response.statusCode !== 200) {
                    return res.status(500).send({ message: profile.error.message });
                }
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { facebook: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.facebook = profile.id;
                            user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                            user.displayName = user.displayName || profile.name;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { facebook: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.facebook = profile.id;
                        user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        user.displayName = profile.name;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    /** Login with Yahoo */
    AuthAPI.prototype.yahooLogin = function (req, res) {
        var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
        var clientId = req.body.clientId;
        var clientSecret = config.YAHOO_SECRET;
        var formData = {
            code: req.body.code,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        var headers = { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') };
        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, headers: headers, json: true }, function (err, response, body) {
            var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + body.xoauth_yahoo_guid + '/profile?format=json';
            var headers = { Authorization: 'Bearer ' + body.access_token };
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: socialApiUrl, headers: headers, json: true }, function (err, response, body) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { yahoo: body.profile.guid }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Yahoo account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.yahoo = body.profile.guid;
                            user.displayName = user.displayName || body.profile.nickname;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { yahoo: body.profile.guid }, function (err, existingUser) {
                        if (existingUser) {
                            return res.send({ token: AuthAPI.createJWT(existingUser) });
                        }
                        var user = new User();
                        user.yahoo = body.profile.guid;
                        user.displayName = body.profile.nickname;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    /** Login with Twitter */
    AuthAPI.prototype.twitterLogin = function (req, res) {
        var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
        var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
        var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';
        // Part 1 of 2: Initial request from Satellizer.
        if (!req.body.oauth_token || !req.body.oauth_verifier) {
            var requestTokenOauth = {
                consumer_key: config.TWITTER_KEY,
                consumer_secret: config.TWITTER_SECRET,
                callback: req.body.redirectUri
            };
            // Step 1. Obtain request token for the authorization popup.
            request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function (err, response, body) {
                var oauthToken = qs.parse(body);
                // Step 2. Send OAuth token back to open the authorization screen.
                res.send(oauthToken);
            });
        }
        else {
            // Part 2 of 2: Second request after Authorize app is clicked.
            var accessTokenOauth = {
                consumer_key: config.TWITTER_KEY,
                consumer_secret: config.TWITTER_SECRET,
                token: req.body.oauth_token,
                verifier: req.body.oauth_verifier
            };
            // Step 3. Exchange oauth token and oauth verifier for access token.
            request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function (err, response, accessToken) {
                accessToken = qs.parse(accessToken);
                var profileOauth = {
                    consumer_key: config.TWITTER_KEY,
                    consumer_secret: config.TWITTER_SECRET,
                    oauth_token: accessToken.oauth_token
                };
                // Step 4. Retrieve profile information about the current user.
                request.get({
                    url: profileUrl + accessToken.screen_name,
                    oauth: profileOauth,
                    json: true
                }, function (err, response, profile) {
                    // Step 5a. Link user accounts.
                    if (req.headers.authorization) {
                        User.findOne(req.params.teamId, { twitter: profile.id }, function (err, existingUser) {
                            if (existingUser) {
                                return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
                            }
                            var token = req.headers.authorization.split(' ')[1];
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            User.findById(req.params.teamId, payload.sub, function (err, user) {
                                if (!user) {
                                    return res.status(400).send({ message: 'User not found' });
                                }
                                user.twitter = profile.id;
                                user.displayName = user.displayName || profile.name;
                                user.picture = user.picture || profile.profile_image_url.replace('_normal', '');
                                user.save(req.params.teamId, function (err) {
                                    res.send({ token: AuthAPI.createJWT(user) });
                                });
                            });
                        });
                    }
                    else {
                        // Step 5b. Create a new user account or return an existing one.
                        User.findOne(req.params.teamId, { twitter: profile.id }, function (err, existingUser) {
                            if (existingUser) {
                                return res.send({ token: AuthAPI.createJWT(existingUser) });
                            }
                            var user = new User();
                            user.twitter = profile.id;
                            user.displayName = profile.name;
                            user.picture = profile.profile_image_url.replace('_normal', '');
                            user.save(req.params.teamId, function (err) {
                                res.send({ token: AuthAPI.createJWT(user) });
                            });
                        });
                    }
                });
            });
        }
    };
    /** Login with Foursquare */
    AuthAPI.prototype.foursquareLogin = function (req, res) {
        var accessTokenUrl = 'https://foursquare.com/oauth2/access_token';
        var profileUrl = 'https://api.foursquare.com/v2/users/self';
        var formData = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.FOURSQUARE_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, json: true }, function (err, response, body) {
            var params = {
                v: '20140806',
                oauth_token: body.access_token
            };
            // Step 2. Retrieve information about the current user.
            request.get({ url: profileUrl, qs: params, json: true }, function (err, response, profile) {
                profile = profile.response.user;
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { foursquare: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Foursquare account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.foursquare = profile.id;
                            user.picture = user.picture || profile.photo.prefix + '300x300' + profile.photo.suffix;
                            user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { foursquare: profile.id }, function (err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.foursquare = profile.id;
                        user.picture = profile.photo.prefix + '300x300' + profile.photo.suffix;
                        user.displayName = profile.firstName + ' ' + profile.lastName;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    /** Login with Twitch */
    AuthAPI.prototype.twitchLogin = function (req, res) {
        var accessTokenUrl = 'https://api.twitch.tv/kraken/oauth2/token';
        var profileUrl = 'https://api.twitch.tv/kraken/user';
        var formData = {
            code: req.body.code,
            client_id: req.body.clientId,
            client_secret: config.TWITCH_SECRET,
            redirect_uri: req.body.redirectUri,
            grant_type: 'authorization_code'
        };
        // Step 1. Exchange authorization code for access token.
        request.post({ url: accessTokenUrl, form: formData, json: true }, function (err, response, accessToken) {
            var params = {
                oauth_token: accessToken.access_token
            };
            // Step 2. Retrieve information about the current user.
            request.get({ url: profileUrl, qs: params, json: true }, function (err, response, profile) {
                // Step 3a. Link user accounts.
                if (req.headers.authorization) {
                    User.findOne(req.params.teamId, { twitch: profile._id }, function (err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({ message: 'There is already a Twitch account that belongs to you' });
                        }
                        var token = req.headers.authorization.split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        User.findById(req.params.teamId, payload.sub, function (err, user) {
                            if (!user) {
                                return res.status(400).send({ message: 'User not found' });
                            }
                            user.twitch = profile._id;
                            user.picture = user.picture || profile.logo;
                            user.displayName = user.displayName || profile.name;
                            user.email = user.email || profile.email;
                            user.save(req.params.teamId, function (err) {
                                var token = AuthAPI.createJWT(user);
                                res.send({ token: token });
                            });
                        });
                    });
                }
                else {
                    // Step 3b. Create a new user account or return an existing one.
                    User.findOne(req.params.teamId, { twitch: profile._id }, function (err, existingUser) {
                        if (existingUser) {
                            var token = AuthAPI.createJWT(existingUser);
                            return res.send({ token: token });
                        }
                        var user = new User();
                        user.twitch = profile._id;
                        user.picture = profile.logo;
                        user.displayName = profile.name;
                        user.email = profile.email;
                        user.save(req.params.teamId, function (err) {
                            var token = AuthAPI.createJWT(user);
                            res.send({ token: token });
                        });
                    });
                }
            });
        });
    };
    return AuthAPI;
}());
exports.AuthAPI = AuthAPI;
var User = (function (_super) {
    __extends(User, _super);
    function User(user) {
        var _this = _super.call(this) || this;
        _this.properties = {};
        if (user) {
            _this.email = user.email;
            _this.password = user.password;
            _this.displayName = user.displayName;
            if (user.roles)
                _this.roles = user.roles;
            if (user.picture)
                _this.picture = user.picture;
        }
        ;
        return _this;
    }
    Object.defineProperty(User.prototype, "password", {
        // TODO Do we need to emove the pwd from the User object, even though it is hashed?
        get: function () { return this.properties['password']; },
        set: function (value) { this.properties['password'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "email", {
        get: function () { return this.id; },
        set: function (value) { this.id = value.toLowerCase(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "displayName", {
        get: function () { return this.properties['displayName']; },
        set: function (value) { this.properties['displayName'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "roles", {
        get: function () { return this.properties['roles']; },
        set: function (value) { this.properties['roles'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "picture", {
        get: function () { return this.properties['picture']; },
        set: function (value) { this.properties['picture'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "facebook", {
        get: function () { return this.properties['facebook']; },
        set: function (value) { this.properties['facebook'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "foursquare", {
        get: function () { return this.properties['foursquare']; },
        set: function (value) { this.properties['foursquare'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "google", {
        get: function () { return this.properties['google']; },
        set: function (value) { this.properties['google'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "github", {
        get: function () { return this.properties['github']; },
        set: function (value) { this.properties['github'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "linkedin", {
        get: function () { return this.properties['linkedin']; },
        set: function (value) { this.properties['linkedin'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "live", {
        get: function () { return this.properties['live']; },
        set: function (value) { this.properties['live'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "yahoo", {
        get: function () { return this.properties['yahoo']; },
        set: function (value) { this.properties['yahoo'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "twitter", {
        get: function () { return this.properties['twitter']; },
        set: function (value) { this.properties['twitter'] = value; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "twitch", {
        get: function () { return this.properties['twitch']; },
        set: function (value) { this.properties['twitch'] = value; },
        enumerable: true,
        configurable: true
    });
    /** Get the team layer with users based on the teamId. */
    User.getTeam = function (teamId, callback) {
        User.manager.getLayer(teamId, {}, function (cb) {
            if (cb.result !== ApiResult.OK) {
                User.manager.addUpdateLayer({ id: teamId, storage: 'file', type: 'dynamicgeojson' }, { source: 'auth' }, function (cb2) {
                    callback(null, cb2.layer);
                });
            }
            else {
                callback(null, cb.layer);
            }
        });
    };
    /** Find the user by ID (i.e. email) */
    User.findById = function (teamId, id, callback) {
        User.getTeam(teamId, function (err, team) {
            if (err) {
                callback(err, null);
            }
            else {
                var found;
                team.features.some(function (user) {
                    if (user.id !== id)
                        return false;
                    found = new User({ email: user.id });
                    found.properties = user.properties;
                    return true;
                });
                if (found)
                    callback('', found);
                else
                    callback('User not found', null);
            }
        });
    };
    /** Find one user by key */
    User.findOne = function (teamId, keys, callback) {
        var key = keys[0];
        var val = keys[key];
        User.getTeam(teamId, function (err, team) {
            if (err) {
                callback(err, null);
            }
            else {
                team.features.some(function (user) {
                    if (!user.properties || !user.properties.hasOwnProperty(key) || user.properties[key] !== val)
                        return false;
                    callback('', new User(user));
                    return true;
                });
            }
        });
    };
    User.load = function () {
    };
    /** Save the user details */
    User.prototype.save = function (teamId, callback) {
        User.manager.addFeature(teamId, this, { source: 'auth' }, function (cb) {
            if (cb.result === ApiResult.OK) {
                callback('');
                //User.manager.updateFeature()
            }
            else {
                callback(cb.error);
            }
        });
    };
    /** Compare the received password with the known password */
    User.prototype.comparePassword = function (password, done) {
        bcrypt.compare(password, this.password, function (err, isMatch) {
            done(err, isMatch);
        });
    };
    return User;
}(Feature));
exports.User = User;
//# sourceMappingURL=AuthAPI.js.map