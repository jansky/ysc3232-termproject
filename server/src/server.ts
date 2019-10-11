import App from './app';
import MetaController from "./meta/meta.controller";

const app = new App([
    new MetaController()
]);

app.listen();