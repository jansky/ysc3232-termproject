import App from './app';
import MetaController from "./meta/meta.controller";
import PathFindingController from "./path-finding/path-finding.controller";

const app = new App([
    new MetaController(),
    new PathFindingController()
]);

app.listen();