import express from 'express';
import {ControllerInterface} from 'interfaces/controller.interface';
import busStopModel from "../bus-stop/bus-stop.model";
import BusStop from "../bus-stop/bus-stop.interface";
import Route from "./route";
import PointToPoint from "./point-to-point";
import HubAndSpoke from "./hub-and-spoke";

class PathFindingController implements ControllerInterface {
    public readonly router: express.Router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/findroute', PathFindingController.findPath);
    }

    private static async findShortestRoute(origin : string, dest : string) : Promise<Route> {

        try {
            const pointToPointRoute : Route = await PointToPoint.findPointToPointRoute(
                origin, dest
            );

            return pointToPointRoute;
        } catch(ePointToPoint) {

            try {
                const hubAndSpokeRoute : Route = await HubAndSpoke.findHubAndSpokeRoute(
                    origin, dest
                );

               return hubAndSpokeRoute;
            }
            catch(eHubAndSpoke) {

                console.log(`${Date.now()}: Unable to find a route between ${origin} and ${dest}`);
                console.log(`${Date.now()}: Point-to-point path-finding failed because: ${ePointToPoint}`);
                console.log(`${Date.now()}: Hub-and-spoke path-finding failed because: ${eHubAndSpoke}`);

                throw new Error(`No such route`);

            }

        }

    }

    private static async findPath(request: express.Request, response: express.Response) {

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

        const destBusStop : BusStop = (await busStopModel.find({
            Location: {
                $near: {
                    $maxDistance: 1000,
                    $geometry: {
                        type: "Point",
                        coordinates: [destLong, destLat]
                    }
                }
            }
        }))[0];

        if(!destBusStop) {
            response.send({'error': 'Unable to locate a bus stop near your destination.'});
            return;
        }

        const possibleRoutes : Route[] = [];

        for(let i = 0; i < 3 && i < originBusStops.length; i++) {

            const originBusStop : BusStop = originBusStops[i];

            try {
                console.log(`Trying ${originBusStop.BusStopCode} (${originBusStop.Description})...`);
                const route = await PathFindingController.findShortestRoute(originBusStop.BusStopCode as string, destBusStop.BusStopCode as string);
                possibleRoutes.push(route);

            } catch(e) {
                console.error(e);
            }

        }

        if(possibleRoutes.length == 0) {
            response.send({'error': 'Unable to find a route to your destination'});
            return;
        }

        const shortestRoute = possibleRoutes.sort((routeA, routeB) => {

            if(routeA.travelTime < routeB.travelTime) return -1;
            else if(routeA.travelTime == routeB.travelTime) return 0;
            else return 1;

        })[0];

        response.send({'error': 'none', 'route': shortestRoute});
    }
}

export default PathFindingController;
