import LTAApi from "./lta/lta.api";
import config from "./config";
import mongoose from "mongoose";
import DijkstraGraph from "./path-finding/graph";
import RouteFinder from "./path-finding/route-finder";
import * as util from "util";

const api = new LTAApi(config.lta_api_key);

mongoose.connect(config.mongodb_url);

DijkstraGraph.loadGraphFromFile("dijkstra_graph.json").then(graph => {

    const routeFinder = new RouteFinder(graph);

    routeFinder.findRoute('17091', '99009').then(route => {

        console.log(util.inspect(route, {showHidden: false, depth: null}));
        mongoose.disconnect();

    }, failure => { console.log(failure); mongoose.disconnect(); });


}, failure => { console.log(failure); mongoose.disconnect(); });