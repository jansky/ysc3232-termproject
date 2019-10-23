import Graph from 'node-dijkstra';
import Route from "./route";
import busSegmentModel from "../bus-segment/bus-segment.model";
import BusSegment from "../bus-segment/bus-segment.interface";
import RouteSegment from "./route-segment";
import busServiceModel from "../bus-service/bus-service.model";
import busStopModel from "../bus-stop/bus-stop.model";

const util = require('util');

/**
 * A class to perform path finding between bus stops
 */
class RouteFinder {

    private graph : any;

    /**
     * Constructs a RouteFinder with the given Dijkstra graph
     * @param graph A Dijkstra graph representing the Singapore public bus network
     */
    constructor(graph : any) {

        this.graph = graph;

    }

    /**
     * Finds the shortest bus route between two bus stops
     * @param originBusStop The unique code of the origin bus stop
     * @param destinationBusStop The unique code of the destination bus stop
     */
    public async findRoute(originBusStop : string, destinationBusStop : string) : Promise<Route> {

        const path : string[] = this.graph.path(originBusStop, destinationBusStop);

        let possibleRoutes : any[] = [];

        for(let i = 0; i < path.length - 1; i++) {

            const stop_i = path[i];
            const stop_i1 = path[i + 1];

            const segmentsBetween : BusSegment[] = await busSegmentModel.find({
                OriginCode: stop_i,
                DestinationCode: stop_i1
            });

            if(possibleRoutes.length == 0) {

                segmentsBetween.forEach(segment => {

                    possibleRoutes.push({
                        segments: [segment],
                        time: segment.TravelTime,
                        remove: "no"
                    });

                });

                continue;

            }

            let possibleToNotTransfer = false;

            for(let possibleRoute of possibleRoutes) {

                const lastSegment : BusSegment = possibleRoute.segments[possibleRoute.segments.length - 1];

                const nonTransferSegment : BusSegment | undefined = segmentsBetween.find(segment =>
                    segment.ServiceNo == lastSegment.ServiceNo && segment.Direction == lastSegment.Direction
                );

                if(nonTransferSegment) {
                    possibleToNotTransfer = true;

                    possibleRoute.segments.push(nonTransferSegment);
                    possibleRoute.time += nonTransferSegment.TravelTime;
                    possibleRoute.remove = "no";
                } else {

                    const newSegment = segmentsBetween[0];

                    possibleRoute.segments.push(newSegment);
                    possibleRoute.time += (newSegment.TravelTime  as number) + 5; // Transfer time penalty
                    possibleRoute.remove = "ifPossibleToNotTransfer";

                }

            }

            /*
             * If a route between the two bus stops without a transfer is possible, then remove all routes
             * that involve a transfer. Otherwise, we keep all of the routes.
             */
            possibleRoutes = possibleRoutes.filter((possibleRoute, _index, _arr) => {

                return !(possibleToNotTransfer && possibleRoute.remove == "ifPossibleToNotTransfer");

            });

        }

        /*
         * We select the route which has the least travel time
         */
        const selectedRoute = possibleRoutes.sort((possibleRouteA, possibleRouteB) => {
            if(possibleRouteA.time < possibleRouteB.time) return -1;
            else if(possibleRouteA.time == possibleRouteB.time) return 0;
            else return 1;
        })[0];

        const route : Route = {
            segments: [],
            travelTime: selectedRoute.time
        };

        for(let j = 0; j < selectedRoute.segments.length; j++) {

            const busSegment = selectedRoute.segments[j];

            const busStopCodeI = await busStopModel.findOne({
                BusStopCode: busSegment.OriginCode
            });

            const busStopCodeI1 = await busStopModel.findOne({
                BusStopCode: busSegment.DestinationCode
            });

            if(!busStopCodeI || !busStopCodeI1) {
                throw new Error(`No such bus stops ${busSegment.OriginCode} or ${busSegment.DestinationCode}`);
            }

            if(route.segments.length == 0) {

                const busService = await busServiceModel.findOne({
                    ServiceNo: busSegment.ServiceNo,
                    Direction: busSegment.Direction
                });

                if(!busService) {
                    throw new Error(`No such bus service ${busSegment.ServiceNo} with direction ${busSegment.Direction}`);
                }

                const busServiceOrigin = await busStopModel.findOne({
                    BusStopCode: busService.OriginCode
                });

                if(!busServiceOrigin) {
                    throw new Error(`No such bus stop ${busService.OriginCode}`);
                }

                const busServiceDestination = await busStopModel.findOne({
                   BusStopCode: busService.DestinationCode
                });

                if(!busServiceDestination) {
                    throw new Error(`No such bus stop ${busService.DestinationCode}`);
                }

                const routeSegment : RouteSegment = {
                    busService: busService,
                    busServiceOrigin: busServiceOrigin,
                    busServiceDestination: busServiceDestination,
                    busStops: selectedRoute.segments.length == 1 ? [busStopCodeI, busStopCodeI1] : [busStopCodeI]
                };

                route.segments.push(routeSegment);

                continue;
            }

            const lastSegment = route.segments[route.segments.length - 1];

            if(lastSegment.busService.ServiceNo == busSegment.ServiceNo && lastSegment.busService.Direction == busSegment.Direction) {

                lastSegment.busStops.push(busStopCodeI);

                if(j == selectedRoute.segments.length - 1) {
                    lastSegment.busStops.push(busStopCodeI1);
                }

                continue;

            }

            const busService = await busServiceModel.findOne({
                ServiceNo: busSegment.ServiceNo,
                Direction: busSegment.Direction
            });

            if(!busService) {
                throw new Error(`No such bus service ${busSegment.ServiceNo} with direction ${busSegment.Direction}`);
            }

            const busServiceOrigin = await busStopModel.findOne({
                BusStopCode: busService.OriginCode
            });

            if(!busServiceOrigin) {
                throw new Error(`No such bus stop ${busService.OriginCode}`);
            }

            const busServiceDestination = await busStopModel.findOne({
                BusStopCode: busService.DestinationCode
            });

            if(!busServiceDestination) {
                throw new Error(`No such bus stop ${busService.DestinationCode}`);
            }

            const lastSegmentLastStop = await busStopModel.findOne({
               BusStopCode: selectedRoute.segments[j - 1].DestinationCode
            });

            if(!lastSegmentLastStop) {
                throw new Error(`No such bus stop ${selectedRoute.segments[j - 1].DestinationCode}`);
            }

            lastSegment.busStops.push(lastSegmentLastStop);

            if(!busService) {
                throw new Error(`No such bus service ${busSegment.ServiceNo} with direction ${busSegment.Direction}`);
            }

            const routeSegment : RouteSegment = {
                busService: busService,
                busServiceOrigin: busServiceOrigin,
                busServiceDestination: busServiceDestination,
                busStops: j == selectedRoute.segments.length - 1 ? [busStopCodeI, busStopCodeI1] : [busStopCodeI]
            };

            route.segments.push(routeSegment);


        }

        return route;

    }

}

export default RouteFinder;
