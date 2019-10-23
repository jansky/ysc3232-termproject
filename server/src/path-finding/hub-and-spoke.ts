import BusSegment from "../bus-segment/bus-segment.interface";
import busServiceModel from "../bus-service/bus-service.model";
import BusService from "../bus-service/bus-service.interface";
import busSegmentModel from "../bus-segment/bus-segment.model";
import BusStop from "../bus-stop/bus-stop.interface";
import busStopModel from "../bus-stop/bus-stop.model";
import busRouteStopsModel from "../bus-route-stops/bus-route-stops.model";
import Graph = require("node-dijkstra");
import Route from "./route";
import BusSegmentsWithRoutes from "../bus-segment/bus-segments-with-routes.interface";
import BusRouteStops from "../bus-route-stops/bus-route-stops.interface";
import ServiceTimeInformation from "../bus-service/service-time-information.interface";
import RouteSegment from "./route-segment";
import * as util from "util";
const readline = require('readline');

class HubAndSpoke {

    private static isInService(service : ServiceTimeInformation, remark: string = "") : boolean {

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

    private static async generateHubAndSpokeGraph(origin : string, destination: string) : Promise<any> {

        const spokeToHubSegments = await busSegmentModel.find({
            OriginCode: origin,
            SegmentType: "spoketohub"
        });

        const hubToSpokeSegments = await busSegmentModel.find({
            DestinationCode: destination,
            SegmentType: "hubtospoke"
        });

        const hubToHubSegments = await busSegmentModel.find({
            SegmentType: "hubtohub"
        });

        const graph : any = {};
;
        const addSegments = (segments : BusSegment[]) => {
            for(let segment of segments) {
                if(!HubAndSpoke.isInService(segment, `${segment.ServiceNo}_${segment.Direction} from ${segment.OriginCode} to ${segment.DestinationCode}`)) continue;

                if(!graph.hasOwnProperty(segment.OriginCode)) graph[segment.OriginCode as string] = {};
                if(!graph.hasOwnProperty(segment.DestinationCode)) graph[segment.DestinationCode as string] = {};

                graph[segment.OriginCode as string][segment.DestinationCode as string] = segment.TravelTime;

            }
        };

        addSegments(spokeToHubSegments);
        addSegments(hubToHubSegments);
        addSegments(hubToSpokeSegments);


        return new Graph(graph);

    }

    public static async findHubAndSpokeRoute(originBusStop: string, destinationBusStop: string) : Promise<Route> {

        const graph = await HubAndSpoke.generateHubAndSpokeGraph(originBusStop, destinationBusStop);

        const path = graph.path(originBusStop, destinationBusStop);

        const routeSegments : RouteSegment[] = [];

        let travelTime  = 0;

        for(let i = 0; i < path.length - 1; i++) {

            const stop_i = path[i];
            const stop_i1 = path[i+1];

            const busRouteStops : BusRouteStops = (await busRouteStopsModel.find({
                OriginCode: stop_i,
                DestinationCode: stop_i1
            })).filter(brs => HubAndSpoke.isInService(brs))[0];

            if(!busRouteStops) {
                throw new Error(`No route between stops ${stop_i} and ${stop_i1}`);
            }

            if(travelTime != 0) travelTime += 5; // Estimated time for transfer

            travelTime += (busRouteStops.TravelTime as number);

            routeSegments.push({
                busService: busRouteStops.Service,
                busServiceOrigin: busRouteStops.ServiceOrigin,
                busServiceDestination: busRouteStops.ServiceDestination,
                busStops: busRouteStops.BusStops
            });

        }

        return {
            segments: routeSegments,
            travelTime: travelTime
        };
    }

    private static busStopCache : {[key: string]: BusStop} = {};
    private static busServiceCache : {[key: string]: BusService} = {};
    private static busRoutesGenerated = 0;

    private static async generateBusRouteStopsFromSegments(segments : BusSegment[], num: number = 0) : Promise<any> {

        const busStops : BusStop[] = [];
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];
        
        const getBusStop = async (code : String) => {

            let busStop : BusStop | null = null;

            if(HubAndSpoke.busStopCache.hasOwnProperty(code as string)) {
                busStop = HubAndSpoke.busStopCache[code as string];
            } else {
                busStop = await busStopModel.findOne({
                    BusStopCode: code
                });

                if(busStop) {
                    HubAndSpoke.busStopCache[code as string] = busStop;
                }

            }

            return busStop;
            
        };

        const getBusService = async (serviceNo: String, direction: Number) => {

            let busService : BusService | null = null;

            if(HubAndSpoke.busServiceCache.hasOwnProperty(`${serviceNo}_${direction}`)) {
                busService = HubAndSpoke.busServiceCache[`${serviceNo}_${direction}`];
            } else {
                busService = await busServiceModel.findOne({
                    ServiceNo: serviceNo,
                    Direction: direction
                });

                if(busService) {
                    HubAndSpoke.busServiceCache[`${serviceNo}_${direction}`] = busService;
                }
            }

            return busService;

        };

        if(!firstSegment || !lastSegment) {
            //throw new Error(`Cannot generate bus route stops if there are no segments`);
            return;
        }

        const service : BusService | null = await getBusService(firstSegment.ServiceNo, firstSegment.Direction);

        if(!service) {
            //throw new Error(`No such bus service ${firstSegment.ServiceNo} with direction ${firstSegment.Direction}`);
            return;
        }

        const serviceOrigin : BusStop | null = await getBusStop(service.OriginCode);

        if(!serviceOrigin) {
            return;
        }

        const serviceDestination : BusStop | null = await getBusStop(service.DestinationCode);

        if(!serviceDestination) {
            return;
        }


        for(let i = 0; i < segments.length; i++) {

            const segment = segments[i];

            const busStop : BusStop | null = await getBusStop(segment.OriginCode);

            if(!busStop) {
                return;
            }

            busStops.push(busStop);

            if(i == segments.length - 1) {

                const lastBusStop : BusStop | null = await getBusStop(segment.DestinationCode);

                if(!lastBusStop) {
                    //throw new Error(`No such bus stop ${segment.DestinationCode}`);
                    return;
                }

                busStops.push(lastBusStop);

            }

        }

        const travelTime = segments.reduce<number>((acc, seg, _index, _arr) => {
            return acc + (seg.TravelTime as number);
        }, 0);

        HubAndSpoke.busRoutesGenerated++;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`Generated spoke-to-hub-to-spoke for ${HubAndSpoke.busRoutesGenerated} segments...`);



        await new busRouteStopsModel({
           Service: service,
           ServiceOrigin: serviceOrigin,
           ServiceDestination: serviceDestination,
           OriginCode: firstSegment.OriginCode,
           DestinationCode: lastSegment.DestinationCode,
           BusStops: busStops,
           WD_FirstBus: firstSegment.WD_FirstBus,
           WD_LastBus: firstSegment.WD_LastBus,
           SAT_FirstBus: firstSegment.SAT_FirstBus,
           SAT_LastBus: firstSegment.SAT_LastBus,
           SUN_FirstBus: firstSegment.SUN_FirstBus,
           SUN_LastBus: firstSegment.SUN_LastBus,
           TravelTime: travelTime
        }).save();

        return;

    }

    public static async generateHubToHubSegments() : Promise<BusSegment[]> {

        const busServices : BusService[] = await busServiceModel.find({});
        const hubToHubSegments : BusSegment[] = [];
        const hubToHubRouteStopPromises : Promise<any>[] = [];

        let numHandled = 0;

        for(let service of busServices) {

            const serviceSegments : BusSegment[] = await busSegmentModel.find({
                ServiceNo: service.ServiceNo,
                Direction: service.Direction,
                SegmentType: "finegrain"
            }).sort('Sequence');

            const travelTime = serviceSegments.reduce<number>((acc, segment, _index, _arr) => {

                return acc + (segment.TravelTime as number);

            }, 0);

            const firstSegment = serviceSegments[0];

            if(!firstSegment) {
                console.error(`No first segment for bus route ${service.ServiceNo} with direction ${service.Direction}`);
                continue;
            }

            hubToHubSegments.push(new busSegmentModel({
                ServiceNo: service.ServiceNo,
                Direction: service.Direction,
                OriginCode: service.OriginCode,
                DestinationCode: service.DestinationCode,
                TravelTime: travelTime,
                WD_FirstBus: firstSegment.WD_FirstBus,
                WD_LastBus: firstSegment.WD_LastBus,
                SAT_FirstBus: firstSegment.SAT_FirstBus,
                SAT_LastBus: firstSegment.SAT_LastBus,
                SUN_FirstBus: firstSegment.SUN_LastBus,
                SUN_LastBus: firstSegment.SUN_LastBus,
                Sequence: 0,
                SegmentType: "hubtohub"
            }));

            hubToHubRouteStopPromises.push(HubAndSpoke.generateBusRouteStopsFromSegments(serviceSegments, numHandled));

            numHandled += 1;

        }

        await Promise.all(hubToHubRouteStopPromises);

        return  hubToHubSegments;

    }



    public static async generateSpokeToHubToSpokeSegments() : Promise<BusSegment[]> {

        const busServices : BusService[] = await busServiceModel.find({});
        const hubToSpokeToHubSegments : BusSegment[] = [];
        const hubToHubRouteStopPromises : Promise<BusRouteStops|null>[] = [];

        let handledBusServices = 0;

        console.log("");

        for(let service of busServices) {

            const originCode = service.OriginCode;
            const destinationCode = service.DestinationCode;

            const serviceSegments: BusSegment[] = await busSegmentModel.find({
                ServiceNo: service.ServiceNo,
                Direction: service.Direction,
                SegmentType: "finegrain"
            }).sort('Sequence');

            const firstSegment = serviceSegments[0];

            if(!firstSegment) {
                console.error(`No first segment for bus route ${service.ServiceNo} with direction ${service.Direction}`);
                continue;
            }

            for(let i = 1; i < serviceSegments.length; i++) {

                const segment = serviceSegments[i];

                const timeFromOrigin = serviceSegments.reduce<number>((acc, seg, _index, _arr) => {

                    if(seg.Sequence < segment.Sequence) {
                        return acc + (seg.TravelTime as number);
                    } else {
                        return acc;
                    }

                }, 0);

                const timeToDestination = serviceSegments.reduce<number>((acc, seg, _index, _arr) => {

                    if(seg.Sequence >= segment.Sequence) {
                        return acc + (seg.TravelTime as number);
                    } else {
                        return acc;
                    }

                }, 0);

                hubToHubRouteStopPromises.push(HubAndSpoke.generateBusRouteStopsFromSegments(
                    serviceSegments.filter((seg, _index, _arr) => {
                        return seg.Sequence < segment.Sequence;
                    })
                , handledBusServices));

                hubToHubRouteStopPromises.push(HubAndSpoke.generateBusRouteStopsFromSegments(
                    serviceSegments.filter((seg, _index, _arr) => {
                        return seg.Sequence >= segment.Sequence;
                    })
                , handledBusServices));

                hubToSpokeToHubSegments.push(new busSegmentModel({
                    ServiceNo: service.ServiceNo,
                    Direction: service.Direction,
                    OriginCode: originCode,
                    DestinationCode: segment.OriginCode,
                    TravelTime: timeFromOrigin,
                    WD_FirstBus: firstSegment.WD_FirstBus,
                    WD_LastBus: firstSegment.WD_LastBus,
                    SAT_FirstBus: firstSegment.SAT_FirstBus,
                    SAT_LastBus: firstSegment.SAT_LastBus,
                    SUN_FirstBus: firstSegment.SUN_LastBus,
                    SUN_LastBus: firstSegment.SUN_LastBus,
                    Sequence: i,
                    SegmentType: "hubtospoke"
                }));

                hubToSpokeToHubSegments.push(new busSegmentModel({
                    ServiceNo: service.ServiceNo,
                    Direction: service.Direction,
                    OriginCode: segment.OriginCode,
                    DestinationCode: destinationCode,
                    TravelTime: timeToDestination,
                    WD_FirstBus: firstSegment.WD_FirstBus,
                    WD_LastBus: segment.WD_LastBus,
                    SAT_FirstBus: segment.SAT_FirstBus,
                    SAT_LastBus: segment.SAT_LastBus,
                    SUN_FirstBus: segment.SUN_LastBus,
                    SUN_LastBus: segment.SUN_LastBus,
                    Sequence: i,
                    SegmentType: "spoketohub"
                }));

            }

            handledBusServices += 1;

        }

        console.log("");
        await Promise.all(hubToHubRouteStopPromises);

        return hubToSpokeToHubSegments;

    }

}

export default HubAndSpoke;
