import express from 'express';
import {ControllerInterface} from 'interfaces/controller.interface';

/**
 * A controller for handling the index URL
 */
class MetaController implements ControllerInterface {
    /**
     * The router for this controller
     */
    public readonly router: express.Router = express.Router();

    /**
     * Constructs a new MetaController
     */
    constructor() {
        this.initializeRoutes();
    }

    /**
     * Initializes this controller's router
     */
    private initializeRoutes() {
        this.router.get('/', this.index);
    }

    /**
     * Handles the index (e.g., /) URL
     * @param request The HTTP request
     * @param response The HTTP response
     */
    private index(request: express.Request, response: express.Response) {
        response.send("Hello, world!");
    }

}

export default MetaController;