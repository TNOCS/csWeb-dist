import express = require('express');
import ApiManager = require('./ApiManager');
import Feature = ApiManager.Feature;
/**
 * Authentication API based on Satellizer, which uses a JSON Web Token for access control.
 */
export declare class AuthAPI {
    private manager;
    private server;
    private baseUrl;
    userUrl: string;
    loginUrl: string;
    signupUrl: string;
    constructor(manager: ApiManager.ApiManager, server: express.Express, baseUrl?: string);
    /** Read user details */
    private getUser(req, res);
    /** Update user details */
    private updateUser(req, res);
    /** Log in with Email */
    private login(req, res);
    /** Signup */
    private signup(req, res);
    /** Ensure that the user is authenticated by verifying his authorization token. */
    private ensureAuthenticated(req, res, next);
    /** Generate JSON Web Token */
    private static createJWT(user);
    /** Unlink the provider */
    private unlinkProvider(req, res);
    /** Login with Google */
    private googleLogin(req, res);
    private githubLogin(req, res);
    /** Login with LinkedIn */
    private linkedinLogin(req, res);
    /** Login with Windows Live */
    private windowsLiveLogin(req, res);
    /** Login with Facebook */
    private facebookLogin(req, res);
    /** Login with Yahoo */
    private yahooLogin(req, res);
    /** Login with Twitter */
    private twitterLogin(req, res);
    /** Login with Foursquare */
    private foursquareLogin(req, res);
    /** Login with Twitch */
    private twitchLogin(req, res);
}
export interface IUser {
    email: string;
    password?: string;
    displayName?: string;
    roles?: string;
    picture?: string;
    facebook?: string;
    foursquare?: string;
    google?: string;
    github?: string;
    linkedin?: string;
    live?: string;
    yahoo?: string;
    twitter?: string;
    twitch?: string;
}
export declare class User extends Feature implements IUser {
    static manager: ApiManager.ApiManager;
    password: string;
    email: string;
    displayName: string;
    roles: string;
    picture: string;
    facebook: string;
    foursquare: string;
    google: string;
    github: string;
    linkedin: string;
    live: string;
    yahoo: string;
    twitter: string;
    twitch: string;
    constructor(user?: IUser);
    /** Get the team layer with users based on the teamId. */
    private static getTeam(teamId, callback);
    /** Find the user by ID (i.e. email) */
    static findById(teamId: string, id: string, callback: (err: string, user: User) => void): void;
    /** Find one user by key */
    static findOne(teamId: string, keys: {
        [key: string]: string;
    }, callback: (err: string, user: User) => void): void;
    static load(): void;
    /** Save the user details */
    save(teamId: string, callback: (err: string) => void): void;
    /** Compare the received password with the known password */
    comparePassword(password: string, done: (err: Error, isMatch: boolean) => void): void;
}
