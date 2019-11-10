import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import loggingMiddleware from './middleware/logging';
import {ControllerInterface} from "./interfaces/controller.interface";

import config from './config';

/**
 * A class representing the server application
 */
class App {
    /**
     * The ExpressJS server application
     */
    public app: express.Application;

    /**
     * The port the server will listen on
     *
     * This is initialized to the value of the port in the server
     * configuration.
     */
    public port: number;

    /**
     * Constructs a new server application
     * @param controllers A list of controllers that respond to HTTP requests
     */
    constructor(controllers: ControllerInterface[]) {
        this.app = express();
        this.port = config.port;

        this.connectDB();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    /**
     * Initializes middleware used by the server application
     */
    private initializeMiddlewares() {
        this.app.use(bodyParser.json());
        this.app.use(loggingMiddleware.middleware);
    }

    /**
     * Initializes controllers used by the server application
     * @param controllers The controllers to initialize
     */
    private initializeControllers(controllers: ControllerInterface[]) {
        // Essentially, we combine the routers from the separate controllers into one big router used by the main
        // server.
        controllers.forEach(controller => {
           this.app.use('/', controller.router);
        });
    }

    /**
     * Initializes the connection to the MongoDB database
     */
    private connectDB() {
        mongoose.connect(config.mongodb_url);
    }

    /**
     * Starts the server
     */
    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Listening on port ${this.port}.`)
        });
    }
}

export default App;

