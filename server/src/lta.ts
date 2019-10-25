import busSegmentModel from "./bus-segment/bus-segment.model";
const mongoose = require('mongoose');
import config from './config';
import LTAApi from "./lta/lta.api";
import busStopModel from "./bus-stop/bus-stop.model";
import busServiceModel from "./bus-service/bus-service.model";
import BusService from "./bus-service/bus-service.interface";
import BusStop from "./bus-stop/bus-stop.interface";
import BusSegment from "./bus-segment/bus-segment.interface";
import HubAndSpoke from "./path-finding/hub-and-spoke";
import busRouteStopsModel from "./bus-route-stops/bus-route-stops.model";

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

            busRouteStopsModel.find({}).remove( err => {

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
                        console.log(`Saved ${busSegments.length} fine-grain bus segments.`);

                        Promise.all<BusSegment[], BusSegment[]>([
                            HubAndSpoke.generateHubToHubSegments(),
                            HubAndSpoke.generateSpokeToHubToSpokeSegments()
                        ]).then(([hubToHubSegments, spokeToHubToSpokeSegments]) => {

                            Promise.all<BusSegment[], BusSegment[]>([
                                busSegmentModel.insertMany(hubToHubSegments),
                                busSegmentModel.insertMany(spokeToHubToSpokeSegments),

                            ]).then(_ => {

                                console.log(`Saved ${hubToHubSegments.length} hub-to-hub segments`);
                                console.log(`Saved ${spokeToHubToSpokeSegments.length} spoke-to-hub-to-spoke segments`);


                                mongoose.disconnect();

                            }, failure => { console.error(failure); mongoose.disconnect();})

                        }, failure => { console.error(failure); mongoose.disconnect();});




                    }, err => { console.error(err); mongoose.disconnect(); });


                }, failure => { console.error(failure); mongoose.disconnect(); });

            });
        });
    });
});

