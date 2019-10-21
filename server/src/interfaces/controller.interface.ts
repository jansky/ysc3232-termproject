import express from 'express';

/**
 * An interface for MVC controllers
 */
export interface ControllerInterface {
    /**
     * The router for the controller
     *
     * The URL mappings in the router will be registered by the main application to direct traffic to the
     * appropriate handlers in each controller object.
     */
    readonly router: express.Router
}