import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import loggingMiddleware from './middleware/logging';
import {ControllerInterface} from "./interfaces/controller.interface";

import config from './config';

class App {
    public app: express.Application;
    public port: number;

    constructor(controllers: ControllerInterface[]) {
        this.app = express();
        this.port = config.port;

        this.connectDB();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.json());
        this.app.use(loggingMiddleware.middleware);
    }

    private initializeControllers(controllers: ControllerInterface[]) {
        controllers.forEach(controller => {
           this.app.use('/', controller.router);
        });
    }

    private connectDB() {
        mongoose.connect(config.mongodb_url);
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Listening on port ${this.port}.`)
        });
    }
}

export default App;

