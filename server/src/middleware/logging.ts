import * as express from 'express';

/**
 * A middleware to log requests to the server
 * @param request The HTTP request
 * @param response The HTTP response
 * @param next The next middleware or response handler
 */
function middleware(request: express.Request, response: express.Response, next: express.NextFunction) {

    console.log(`${request.method} ${request.path}`);

    next();

}

export default {
    middleware: middleware
};