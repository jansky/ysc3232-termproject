import * as express from 'express';

function middleware(request: express.Request, response: express.Response, next: express.NextFunction) {

    console.log(`${request.method} ${request.path}`);

    next();

}

export default {
    middleware: middleware
};