import express from 'express';

export interface ControllerInterface {
    readonly router: express.Router
}