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

// First delete all data from the database
busStopModel.find({}).remove(err => {

    if(err) {
        console.error(err);
        mongoose.disconnect();
        process.exit(1);
        return;
    }

    busServiceModel.find({}).remove(err => {

        if(err) {
            console.error(err);
            mongoose.disconnect();
            process.exit(1);
            return;
        }

        busSegmentModel.find({}).remove( err => {

            if(err) {
                console.error(err);
                mongoose.disconnect();
                process.exit(1);
                return;
            }

            busRouteStopsModel.find({}).remove( err => {

                if(err) {
                    console.error(err);
                    mongoose.disconnect();
                    process.exit(1);
                    return;
                }

                // Get all bus stop, service, and route data from the LTA API
                let apiResponse =
                    Promise.all<BusStop[], BusService[], BusSegment[]>(
                        [api.getAllBusStops(), api.getAllBusServices(), api.getAllBusSegments(22.0, 30.0)]);

                apiResponse.then(([busStops, busServices, busSegments]) => {

                    // Save the raw data from the API
                    Promise.all<BusStop[], BusService[], BusSegment[]>([
                        busStopModel.insertMany(busStops),
                        busServiceModel.insertMany(busServices),
                        busSegmentModel.insertMany(busSegments)
                    ]).then(_ => {

                        console.log(`Saved ${busStops.length} bus stops.`);
                        console.log(`Saved ${busServices.length} bus services.`);
                        console.log(`Saved ${busSegments.length} fine-grain bus segments.`);

                        // Generate additional information used for hub-and-spoke
                        // and point-to-point route finding
                        Promise.all<BusSegment[], BusSegment[]>([
                            HubAndSpoke.generateHubToHubSegments(),
                            HubAndSpoke.generateSpokeToHubToSpokeSegments()
                        ]).then(([hubToHubSegments, spokeToHubToSpokeSegments]) => {

                            // Save this information too
                            Promise.all<BusSegment[], BusSegment[]>([
                                busSegmentModel.insertMany(hubToHubSegments),
                                busSegmentModel.insertMany(spokeToHubToSpokeSegments),

                            ]).then(_ => {

                                console.log(`Saved ${hubToHubSegments.length} hub-to-hub segments`);
                                console.log(`Saved ${spokeToHubToSpokeSegments.length} spoke-to-hub / hub-to-spoke segments`);


                                mongoose.disconnect();

                            }, failure => {
                                console.error(failure);
                                mongoose.disconnect();
                                process.exit(1);
                            })

                        }, failure => { console.error(failure); mongoose.disconnect(); process.exit(1); });




                    }, err => { console.error(err); mongoose.disconnect(); process.exit(1); });


                }, failure => { console.error(failure); mongoose.disconnect();process.exit(1); });

            });
        });
    });
});

