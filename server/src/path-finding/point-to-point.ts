import ServiceTimeInformation from "../bus-service/service-time-information.interface";
import busSegmentModel from "../bus-segment/bus-segment.model";
import BusSegment from "../bus-segment/bus-segment.interface";
import Graph = require("node-dijkstra");
import Route from "./route";
import busStopModel from "../bus-stop/bus-stop.model";
import busServiceModel from "../bus-service/bus-service.model";
import RouteSegment from "./route-segment";
import busRouteStopsModel from "../bus-route-stops/bus-route-stops.model";
import BusRouteStops from "../bus-route-stops/bus-route-stops.interface";

/**
 * A class to perform point-to-point path-finding between bus stops
 *
 * For many combinations of origin and destination bus stops, it is possible to find an optimal route between them
 * by taking a bus from the origin and (i) proceeding directly to the destination on that route, or (ii) transferring
 * to another bus somewhere in between that leads directly to the destination bus stop.
 *
 * In an ideal case, the path-finding method here produces a bus route with zero to one transfers (hence the name point-
 * to-point). However, we cannot guarantee this to be the case with our algorithm. The Dijkstra graph we produce here
 * contains *all* bus routes leading from the origin and to the destination, so there exists an opportunity for more than
 * one transfer. Nonetheless, in most cases this path-finding method either produces a path with zero to one transfers, or
 * fails to find a path at all. If we do find a path here, it is usually better than the path produced by the hub-and-spoke
 * method.
 *
 */
class PointToPoint {

    /**
     * Determines if a bus service or segment is in service
     * @param service The bus service or segment under consideration
     * @param nowtime The current date and time, for route-finding purposes
     */
    private static isInService(service: ServiceTimeInformation, nowtime : Date = new Date()) : boolean {

        const now = new Date(nowtime.getTime());

        let segmentActiveStartHour = NaN;
        let segmentActiveStartMinute = NaN;
        let segmentActiveEndHour = NaN;
        let segmentActiveEndMinute = NaN;

        switch(now.getDay()) {
            case 0:
                segmentActiveStartHour = parseInt((service.SUN_FirstBus as string).slice(0, 2));
                segmentActiveStartMinute = parseInt((service.SUN_FirstBus as string).slice(2,4));
                segmentActiveEndHour = parseInt((service.SUN_LastBus as string).slice(0,2));
                segmentActiveEndMinute = parseInt((service.SUN_LastBus as string).slice(2,4));
                break;
            case 6:
                segmentActiveStartHour = parseInt((service.SAT_FirstBus as string).slice(0, 2));
                segmentActiveStartMinute = parseInt((service.SAT_FirstBus as string).slice(2,4));
                segmentActiveEndHour = parseInt((service.SAT_LastBus as string).slice(0,2));
                segmentActiveEndMinute = parseInt((service.SAT_LastBus as string).slice(2,4));
                break;
            default:
                segmentActiveStartHour = parseInt((service.WD_FirstBus as string).slice(0, 2));
                segmentActiveStartMinute = parseInt((service.WD_FirstBus as string).slice(2,4));
                segmentActiveEndHour = parseInt((service.WD_LastBus as string).slice(0,2));
                segmentActiveEndMinute = parseInt((service.WD_LastBus as string).slice(2,4));
                break;
        }

        if(isNaN(segmentActiveStartHour) || isNaN(segmentActiveEndMinute) ||
            isNaN(segmentActiveEndHour) || isNaN(segmentActiveStartMinute)) return false;

        const segmentActiveStartDate = new Date(now.getTime());
        segmentActiveStartDate.setHours(segmentActiveStartHour, segmentActiveStartMinute, 0, 0);

        const segmentActiveEndDate = new Date(now.getTime());
        segmentActiveEndDate.setHours(segmentActiveEndHour, segmentActiveEndMinute, 59, 999);

        if(segmentActiveEndDate < segmentActiveStartDate) {

            segmentActiveEndDate.setDate(segmentActiveEndDate.getDate() + 1);
        }

        //console.log(`${segmentActiveStartHour}${segmentActiveStartMinute} - ${segmentActiveEndHour}${segmentActiveEndMinute} (${segmentActiveStartDate} - ${segmentActiveEndDate})`);

        return now > segmentActiveStartDate && now < segmentActiveEndDate;
    }

    /**
     * Produces a Dijkstra graph for point-to-point path-finding
     *
     * To perform point-to-point path-finding, we produce a Dijkstra graph of a subset of the entire bus network
     * containing only paths leading from the origin bus stop and paths leading to the destination bus stop.
     * @param origin The unique code for the origin bus stop
     * @param destination The unique code for the destination bus stop
     * @param now The current date and time, for route-finding purposes
     * @returns A object containing the Dijkstra graph, as well as all of the bus services that satisfy the point-to-point
     * path-finding criteria (i.e., lead from the origin and to the destination)
     */
    private static async generatePointToPointGraph(origin: string, destination: string, now : Date = new Date()) : Promise<any> {

        const originSegments = (await busSegmentModel.find({
            OriginCode: origin,
            SegmentType: "finegrain"
        })).filter(seg => PointToPoint.isInService(seg, now));

        const destinationSegments = (await busSegmentModel.find({
            DestinationCode: destination,
            SegmentType: "finegrain"
        })).filter(seg => PointToPoint.isInService(seg, now));

        const servicesToDestination : any[] = [];

        const graph : any = {};

        for(let segment of originSegments) {

            /* We encode the bus services in this format because it can be directly used in a MongoDB query
               for the BusRouteStops object corresponding to the entire bus route.
             */
            servicesToDestination.push({
                "Service.ServiceNo": segment.ServiceNo,
                "Service.Direction": segment.Direction,
                "SegmentType": "hubtohub"
            });

            const sameRouteSegments : BusSegment[] = (await busSegmentModel.find({
                ServiceNo: segment.ServiceNo,
                Direction: segment.Direction,
                Sequence: { $gte : segment.Sequence },
                SegmentType: "finegrain"
            })).filter(seg => PointToPoint.isInService(seg, now));

            for(let sameRouteSegment of sameRouteSegments) {

                if(!graph.hasOwnProperty(sameRouteSegment.OriginCode)) graph[sameRouteSegment.OriginCode as string] = {};
                if(!graph.hasOwnProperty(sameRouteSegment.DestinationCode)) graph[sameRouteSegment.DestinationCode as string] = {};

                graph[sameRouteSegment.OriginCode as string][sameRouteSegment.DestinationCode as string] = sameRouteSegment.TravelTime;

            }

        }

        for(let segment of destinationSegments) {

            servicesToDestination.push({
                "Service.ServiceNo": segment.ServiceNo,
                "Service.Direction": segment.Direction,
                "SegmentType": "hubtohub"
            });

            const sameRouteSegments : BusSegment[] = (await busSegmentModel.find({
                ServiceNo: segment.ServiceNo,
                Direction: segment.Direction,
                Sequence: { $lte : segment.Sequence },
                SegmentType: "finegrain"
            })).filter(seg => PointToPoint.isInService(seg, now));

            for(let sameRouteSegment of sameRouteSegments) {

                if(!graph.hasOwnProperty(sameRouteSegment.OriginCode)) graph[sameRouteSegment.OriginCode as string] = {};
                if(!graph.hasOwnProperty(sameRouteSegment.DestinationCode)) graph[sameRouteSegment.DestinationCode as string] = {};

                graph[sameRouteSegment.OriginCode as string][sameRouteSegment.DestinationCode as string] = sameRouteSegment.TravelTime;

            }

        }

        return {
            graph: new Graph(graph),
            servicesToDestination: servicesToDestination
        };

    }

    /**
     * Finds a route between two bus stops using the point-to-point method
     * @param originBusCode The unique code of the origin bus stop
     * @param destinationBusCode The unique code of the destination bus stop
     * @param now The current date and time, for route-finding purposes
     */
    public static async findPointToPointRoute(originBusCode: string, destinationBusCode: string, now : Date = new Date()) : Promise<Route> {

        const graph = await PointToPoint.generatePointToPointGraph(originBusCode, destinationBusCode, now);

        const result = graph.graph.path(originBusCode, destinationBusCode, { cost: true});

        const path : string[] = result.path;
        const cost : number = result.cost;

        if(!path) {
            throw new Error(`No such path`);
        }

        const segments : RouteSegment[] = [];

        /* Get details of all bus routes that can be used to traverse the path */
        const serviceRoutes = await busRouteStopsModel.find({
            $or: graph.servicesToDestination
        });

        /* We find the optimal way to traverse the list of bus stops by performing a search in rounds:

           From the origin bus stop, we find the bus route that allows us to proceed along the path for the longest
           distance without transferring. When we get to a point where we must transfer, we start a new round with the
           latest bus stop and repeat until we eventually arrive at the destination.
         */

        /* The length of the longest bus route with no transfers in the current round */
        let maxSegmentLength : {route: any, length: number} = {route: null, length: 0};
        /* The number bus stop of the starting bus stop for each bus service being considered in the current round */
        const startPos : {[key: string]: number} = {};
        /* The number bus stop of the ending bus stop for each bus service being considered in the current round */
        const endPos : {[key: string]: number} = {};

        /* The number of the current bus stop being considered from the path */
        let stopNo = 0;
        /* Whether any one of the bus services allows us to go one stop further without transferring */
        let haveStepped = false;
        /* Whether any one of the bus services allows us to go one stop further without transferring,
           *in the current round*
         */
        let advancedInRound = false;

        const initRound = () => {

            const stopCode = path[stopNo];

            //console.log(`Initializing new round from ${stopCode}...`);

            advancedInRound = false;

            serviceRoutes.forEach(route => {

                const serviceKey = `${route.Service.ServiceNo}_${route.Service.Direction}`;

                /* By default, assume that the bus service does not include the current bus stop */
                maxSegmentLength = {route: null, length: 0};
                startPos[serviceKey] = -1;
                endPos[serviceKey] = -1;

                /* If the current bus stop is on the bus service's route, set the start and end position for the round */
                for(let i = 0; i < route.BusStops.length; i++) {

                    if(route.BusStops[i].BusStopCode == stopCode) {
                        startPos[serviceKey] = i;
                        endPos[serviceKey] = i;
                        break;
                    }

                }


            });

            /*serviceRoutes.forEach(route => {

                const serviceKey = `${route.Service.ServiceNo}_${route.Service.Direction}`;

                console.log(`\t${serviceKey} startPos = ${startPos[serviceKey]}`);
                console.log(`\t${serviceKey} endPos = ${endPos[serviceKey]}`);

            });*/

        };

        /* Determines whether we can go to the next stop in the path on a given bus service without transferring */
        const canStepTo = (route : BusRouteStops, stopCode : String) => {

            const serviceKey = `${route.Service.ServiceNo}_${route.Service.Direction}`;

            if(endPos[serviceKey] >= route.BusStops.length - 1) return false;

            return route.BusStops[endPos[serviceKey] + 1].BusStopCode == stopCode;

        };

        /* Once we have found an optimal route for the round, we add it to the final route we will return */
        const pushSegment = (route : BusRouteStops) => {

            const serviceKey = `${route.Service.ServiceNo}_${route.Service.Direction}`;

            const busStops = route.BusStops.slice(startPos[serviceKey], endPos[serviceKey] + 1);

            //console.log(`Pushing route segment with service ${serviceKey} from ${busStops[0].BusStopCode} to ${busStops[busStops.length - 1].BusStopCode}`);

            segments.push({
                busService: route.Service,
                busServiceOrigin: route.ServiceOrigin,
                busServiceDestination: route.ServiceDestination,
                busStops: busStops
            });

        };

        initRound();

        let stepCount = 0;

        while(stopNo < path.length - 1){

            const stop_i = path[stopNo];
            const stop_i1 = path[stopNo + 1];

            haveStepped = false;

            //console.log(`Step ${stepCount}:`);

            /* For each bus route, see if we can step to the next stop in the path without transferring */
            serviceRoutes.forEach(route => {

                const serviceKey = `${route.Service.ServiceNo}_${route.Service.Direction}`;
                if(startPos[serviceKey] < 0) {
                    //console.log(`\t${serviceKey} cannot step from ${stop_i} to ${stop_i1} (the initial stop of the round is not in its route).`);
                    return;
                }

                if(canStepTo(route, stop_i1)) {
                    //console.log(`\t${serviceKey} can step from ${stop_i} to ${stop_i1} (segment length of ${endPos[serviceKey] + 1 - startPos[serviceKey]})`);
                    advancedInRound = true;
                    endPos[serviceKey] += 1;
                    haveStepped = true;

                    const newLength = endPos[serviceKey] - startPos[serviceKey];

                    if(newLength > maxSegmentLength.length) {
                        maxSegmentLength = {route: route, length: newLength};
                    }
                } else {
                    //console.log(`\t${serviceKey} cannot step from ${stop_i} to ${stop_i1}.`);
                }

            });

            stepCount += 1;

            /* If we can't move at all during the round, then we can't find a route for the given path */
            if(!advancedInRound) {
                throw new Error(`No such route`);
            }

            /* At this point, if haveStepped = false, then at least one bus services allows us to make progress
               without transferring, but we cannot continue any further without transferring. We start a new round
               to find the rest of the bus route.
             */
            if(!haveStepped) {

                pushSegment(maxSegmentLength.route);
                initRound();
                stepCount = 0;
            } else {
                stopNo += 1;
            }

        }

        /* When we reach the destination we will exit the while loop, but haveStepped will be true. We finalize things
           by pushing the current portion of the route under consideration.
         */
        pushSegment(maxSegmentLength.route);

        return {
            segments: segments,
            travelTime: cost + ((segments.length - 1 ) * 5) // Transfer penalty
        };

    }

}

export default PointToPoint;