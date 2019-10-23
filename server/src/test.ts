import LTAApi from "./lta/lta.api";
import config from "./config";
import mongoose from "mongoose";
import DijkstraGraph from "./path-finding/graph";
import RouteFinder from "./path-finding/route-finder";
import * as util from "util";
import HubAndSpoke from "./path-finding/hub-and-spoke";
import PointToPoint from "./path-finding/point-to-point";

const api = new LTAApi(config.lta_api_key);

mongoose.connect(config.mongodb_url);

//const routeFinder = new RouteFinder(graph);

// 17101 to 99099 - Blk 352 - Changi Village Ter
// 17091 to 51071 - Aft Clementi Ave 1 - Macritchie Rsvr
//HubAndSpoke.findHubAndSpokeRoute('17099', '99009').then(route => {
//PointToPoint.findPointToPointRoute
PointToPoint.findPointToPointRoute('17091', '51071').then(route =>{

    console.log(util.inspect(route, {showHidden: false, depth: null}));
    //console.log(JSON.stringify(route));
    mongoose.disconnect();

}, failure => { console.log(failure); mongoose.disconnect(); });

