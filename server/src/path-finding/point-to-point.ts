import ServiceTimeInformation from "../bus-service/service-time-information.interface";
import busSegmentModel from "../bus-segment/bus-segment.model";
import BusSegment from "../bus-segment/bus-segment.interface";
import Graph = require("node-dijkstra");
import Route from "./route";
import busStopModel from "../bus-stop/bus-stop.model";
import busServiceModel from "../bus-service/bus-service.model";
import RouteSegment from "./route-segment";

class PointToPoint {

    private static isInService(service: ServiceTimeInformation) : boolean {
        const now = new Date();

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

        const segmentActiveStartDate = new Date();
        segmentActiveStartDate.setHours(segmentActiveStartHour, segmentActiveStartMinute, 0, 0);

        const segmentActiveEndDate = new Date();
        segmentActiveEndDate.setHours(segmentActiveEndHour, segmentActiveEndMinute, 59, 999);

        if(segmentActiveEndDate < segmentActiveStartDate) {

            segmentActiveEndDate.setDate(segmentActiveEndDate.getDate() + 1);
        }

        //console.log(`${remark}: ${segmentActiveStartHour}${segmentActiveStartMinute} - ${segmentActiveEndHour}${segmentActiveEndMinute} (${segmentActiveStartDate} - ${segmentActiveEndDate})`);

        return now > segmentActiveStartDate && now < segmentActiveEndDate;
    }

    private static async generatePointToPointGraph(origin: string, destination: string) : Promise<any> {

        const originSegments = (await busSegmentModel.find({
            OriginCode: origin,
            SegmentType: "finegrain"
        })).filter(seg => PointToPoint.isInService(seg));

        const destinationSegments = (await busSegmentModel.find({
            DestinationCode: destination,
            SegmentType: "finegrain"
        })).filter(seg => PointToPoint.isInService(seg));

        const servicesToDestination : any = {};

        const graph : any = {};

        for(let segment of originSegments) {

            servicesToDestination[`${segment.ServiceNo}_${segment.Direction}`] = true;

            const sameRouteSegments : BusSegment[] = (await busSegmentModel.find({
                ServiceNo: segment.ServiceNo,
                Direction: segment.Direction,
                Sequence: { $gte : segment.Sequence },
                SegmentType: "finegrain"
            })).filter(seg => PointToPoint.isInService(seg));

            for(let sameRouteSegment of sameRouteSegments) {

                servicesToDestination[`${sameRouteSegment.ServiceNo}_${sameRouteSegment.Direction}`] = true;

                if(!graph.hasOwnProperty(sameRouteSegment.OriginCode)) graph[sameRouteSegment.OriginCode as string] = {};
                if(!graph.hasOwnProperty(sameRouteSegment.DestinationCode)) graph[sameRouteSegment.DestinationCode as string] = {};

                graph[sameRouteSegment.OriginCode as string][sameRouteSegment.DestinationCode as string] = sameRouteSegment.TravelTime;

            }

        }

        for(let segment of destinationSegments) {

            servicesToDestination[`${segment.ServiceNo}_${segment.Direction}`] = true;

            const sameRouteSegments : BusSegment[] = (await busSegmentModel.find({
                ServiceNo: segment.ServiceNo,
                Direction: segment.Direction,
                Sequence: { $lte : segment.Sequence },
                SegmentType: "finegrain"
            })).filter(seg => PointToPoint.isInService(seg));

            for(let sameRouteSegment of sameRouteSegments) {

                servicesToDestination[`${sameRouteSegment.ServiceNo}_${sameRouteSegment.Direction}`] = true;

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

    public static async findPointToPointRoute(originBusCode: string, destinationBuscode: string) : Promise<Route> {

        const graph = await PointToPoint.generatePointToPointGraph(originBusCode, destinationBuscode);

        const path = graph.graph.path(originBusCode, destinationBuscode);

        if(!path) {
            throw new Error(`No such path`);
        }

        let possibleRoutes : any[] = [];

        for(let i = 0; i < path.length - 1; i++) {

            const stop_i = path[i];
            const stop_i1 = path[i + 1];

            const segmentsBetween : BusSegment[] = (await busSegmentModel.find({
                OriginCode: stop_i,
                DestinationCode: stop_i1,
                SegmentType: "finegrain"
            })).filter(seg => PointToPoint.isInService(seg));

            if(segmentsBetween.length == 0)
                throw new Error(`No such route`);

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

                    /* We prefer to transfer to a route leading directly to the destination */
                    /*const newSegment = segmentsBetween.sort((busSegmentA, busSegmentB) => {

                        const aContains = graph.servicesToDestination.hasOwnProperty(`${busSegmentA.ServiceNo}_${busSegmentA.Direction}`);
                        const bContains = graph.servicesToDestination.hasOwnProperty(`${busSegmentB.ServiceNo}_${busSegmentB.Direction}`);

                        if(aContains && !bContains) return -1;
                        else if(!aContains && bContains) return 1;
                        else return 0;

                    })[0];*/

                    const newSegment = segmentsBetween.filter(segment =>
                        graph.servicesToDestination.hasOwnProperty(`${segment.ServiceNo}_${segment.Direction}`))[0];

                    if(!newSegment) {
                        throw new Error(`No such route`);
                    }

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

export default PointToPoint;