import express from 'express';
import {ControllerInterface} from 'interfaces/controller.interface';
import busStopModel from "../bus-stop/bus-stop.model";
import BusStop from "../bus-stop/bus-stop.interface";
import Route from "./route";
import PointToPoint from "./point-to-point";
import HubAndSpoke from "./hub-and-spoke";
import LTAApi from "../lta/lta.api";
import config from "../config";
import BusArrival from "../bus-arrival/bus-arrival.interface";

/**
 * A controller that handles path-finding requests
 */
class PathFindingController implements ControllerInterface {
    /**
     * The router for this controller
     */
    public readonly router: express.Router = express.Router();

    /**
     * Constructs a new PathFindingController
     */
    constructor() {
        this.initializeRoutes();
    }

    /**
     * Initializes the router for this controller
     */
    private initializeRoutes() {
        this.router.get('/findroute', PathFindingController.findPath);
    }

    /**
     * Finds the shortest route between two bus stops.  This method uses the point-to-point and hub-and-spoke strategies.
     *
     * We first attempt to find a point-to-point path, since if it exists it will almost certainly be more optimal than
     * a comparable hub-and-spoke path. However, if a point-to-point path cannot be found, then we attempt to find a hub-
     * and-spoke path instead.
     *
     * @param origin The unique code of the origin bus stop
     * @param dest The unique code of the destination bus stop
     */
    private static async findShortestRoute(origin : string, dest : string) : Promise<Route> {

        try {
            const pointToPointRoute : Route = await PointToPoint.findPointToPointRoute(
                origin, dest
            );

            return pointToPointRoute;
        } catch(ePointToPoint) {

            console.log(`${new Date().toISOString()}: Unable to find a point-to-point route between ${origin} and ${dest}`);
            console.log(`${new Date().toISOString()}: Point-to-point path-finding failed because: ${ePointToPoint} (${ePointToPoint.stack})`);

            try {
                const hubAndSpokeRoute : Route = await HubAndSpoke.findHubAndSpokeRoute(
                    origin, dest
                );

               return hubAndSpokeRoute;
            }
            catch(eHubAndSpoke) {

                console.log(`${new Date().toISOString()}: Unable to find a route between ${origin} and ${dest}`);
                console.log(`${new Date().toISOString()}: Point-to-point path-finding failed because: ${ePointToPoint}`);
                console.log(`${new Date().toISOString()}: Hub-and-spoke path-finding failed because: ${eHubAndSpoke}`);

                throw new Error(`No such route`);

            }

        }

    }

    /**
     * Finds an optimal bus route for a given origin and destination point
     *
     * Given GPS coordinates for the origin and destination points, this method selects nearby origin and destination
     * bus stops, and an optimal path between them. We return the optimal combination of origin and destination bus stop
     * and route.
     *
     * This method is invoked by accessing the url endpoint /findroute with the following query string parameters:
     *
     * {@code originlat}: The latitude of the origin point
     * {@code originlong}: The longitude of the origin point
     * {@code destlat}: The latitude of the destination point
     * {@code destlong}: The longitude of the destination point
     *
     * @param request The HTTP Request
     * @param response The HTTP Response
     */
    private static async findPath(request: express.Request, response: express.Response) {

        const api = new LTAApi(config.lta_api_key);

        const originLat : number = parseFloat(request.query.originlat);
        const originLong : number = parseFloat(request.query.originlong);

        const destLat : number = parseFloat(request.query.destlat);
        const destLong : number = parseFloat(request.query.destlong);

        if(isNaN(originLat) || isNaN(originLong) || isNaN(destLat) || isNaN(destLong)) {
            response.send({'error': 'You must specify origin and destination coordinates'});
            return;
        }

        const originBusStops : BusStop[] = (await busStopModel.find({
            Location: {
                $near: {
                    $maxDistance: 1000,
                    $geometry: {
                        type: "Point",
                        coordinates: [originLong, originLat]
                    }
                }
            }
        }));

        if(originBusStops.length == 0) {
            response.send({'error': 'Unable to locate a bus stop near you.'});
            return;
        }

        const destBusStops : BusStop[] = (await busStopModel.find({
            Location: {
                $near: {
                    $maxDistance: 1000,
                    $geometry: {
                        type: "Point",
                        coordinates: [destLong, destLat]
                    }
                }
            }
        }));

        if(destBusStops.length == 0) {
            response.send({'error': 'Unable to locate a bus stop near your destination.'});
            return;
        }

        const getArrivalTimesWithBusStopCode = async (code : string) => {

            return {
                busStopCode: code,
                arrivalTimes: await api.getBusArrivalTimes(code)
            }

        };

        const busArrivalTimesPromise : Promise<{busStopCode : string, arrivalTimes: {[key: string]: BusArrival}}>[] = [];

        for(let i = 0; i < 3 && i < originBusStops.length; i++) {
            busArrivalTimesPromise.push(getArrivalTimesWithBusStopCode(originBusStops[i].BusStopCode as string));
        }

        for(let i = 0; i < 3 && i < destBusStops.length; i++) {
            busArrivalTimesPromise.push(getArrivalTimesWithBusStopCode(destBusStops[i].BusStopCode as string));
        }

        const possibleRoutes : Route[] = [];

        /* We consider the three nearest origin and destination bus stops within 1000 meters of the origin and destination
           points, for a total of 9 possible bus-routes considered.
         */
        for(let i = 0; i < 3 && i < originBusStops.length; i++) {

            for(let j = 0; j < 3 && j < destBusStops.length; j++){
                const originBusStop : BusStop = originBusStops[i];
                const destBusStop : BusStop = destBusStops[j];

                try {
                    //console.log(`Trying ${originBusStop.BusStopCode} (${originBusStop.Description})...`);
                    const route = await PathFindingController.findShortestRoute(originBusStop.BusStopCode as string, destBusStop.BusStopCode as string);
                    possibleRoutes.push(route);

                } catch(e) {
                    console.error(e);
                }
            }



        }

        if(possibleRoutes.length == 0) {
            response.send({'error': 'Unable to find a route to your destination'});
            return;
        }

        const busArrivalTimes : {busStopCode : string, arrivalTimes: {[key: string]: BusArrival}}[]
            = await Promise.all(busArrivalTimesPromise);

        const arrivalTimesByStop : {[key: string]: {[key: string]: BusArrival}} = {};

        busArrivalTimes.forEach(stop => {

            arrivalTimesByStop[stop.busStopCode] = stop.arrivalTimes;

        });

        const now = new Date();

        possibleRoutes.forEach(route => {

            const firstBusStop = route.segments[0].busStops[0];
            const firstBusService = route.segments[0].busService;

            try{
                const arrivalTime =
                    arrivalTimesByStop[firstBusStop.BusStopCode as string][firstBusService.ServiceNo as string];

                if(!arrivalTime) {
                    route.travelTime += 10; // In the absence of arrival information, assume the worst case
                    return;
                }

                /* The time to wait until the bus arrives, in minutes */
                const waitingTime = Math.floor(Math.abs(arrivalTime.EstimatedArrival.getTime() - now.getTime()) / (1000 * 60));

                route.travelTime += waitingTime;

            } catch(_e) {
                route.travelTime += 10;
            }

        });

        const shortestRoute = possibleRoutes.sort((routeA, routeB) => {

            if(routeA.travelTime < routeB.travelTime) return -1;
            else if(routeA.travelTime == routeB.travelTime) return 0;
            else return 1;

        })[0];

        response.send({'error': 'none', 'route': shortestRoute});
    }
}

export default PathFindingController;
