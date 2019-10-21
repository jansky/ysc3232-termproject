import express from 'express';
import {ControllerInterface} from 'interfaces/controller.interface';

/**
 * A controller for handling the index URL
 */
class MetaController implements ControllerInterface {
    public readonly router: express.Router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/', this.index);
    }

    private index(request: express.Request, response: express.Response) {
        response.send("Hello, world!");
    }

}

export default MetaController;