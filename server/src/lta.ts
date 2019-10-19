import busSegmentModel from "./bus-segment/bus-segment.model";
import fs = require('fs');
const mongoose = require('mongoose');
import config from './config';
import LTAApi from "./lta/lta.api";
import busStopModel from "./bus-stop/bus-stop.model";
import busServiceModel from "./bus-service/bus-service.model";
import BusService from "./bus-service/bus-service.interface";
import BusStop from "./bus-stop/bus-stop.interface";
import BusSegment from "./bus-segment/bus-segment.interface";
import graph from "./path-finding/graph";

const api = new LTAApi(config.lta_api_key);

mongoose.connect(config.mongodb_url);

busStopModel.find({}).remove(err => {

    if(err) {
        console.error(err);
        return;
    }

    busServiceModel.find({}).remove(err => {

        if(err) {
            console.error(err);
            return;
        }

        busSegmentModel.find({}).remove( err => {

            if(err) {
                console.error(err);
                return;
            }

            let apiResponse =
                Promise.all<BusStop[], BusService[], BusSegment[]>(
                    [api.getAllBusStops(), api.getAllBusServices(), api.getAllBusSegments(22.0, 30.0)]);

            apiResponse.then(([busStops, busServices, busSegments]) => {

                Promise.all<BusStop[], BusService[], BusSegment[]>([
                    busStopModel.insertMany(busStops),
                    busServiceModel.insertMany(busServices),
                    busSegmentModel.insertMany(busSegments)
                ]).then(_ => {

                    console.log(`Saved ${busStops.length} bus stops.`);
                    console.log(`Saved ${busServices.length} bus services.`);
                    console.log(`Saved ${busSegments.length} bus segments.`);

                    const dijkstraGraph = graph.makeGraph(busSegments);

                    fs.writeFile("dijkstra_graph.json", JSON.stringify(dijkstraGraph), err => {

                        mongoose.disconnect();

                        if(err) {
                            console.error(err);
                            return;
                        }
                        
                        console.log("Wrote dijkstra graph.");

                    })



                }, err => { console.error(err); mongoose.disconnect(); });


            }, failure => { console.error(err); mongoose.disconnect(); });

        });
    });
});

