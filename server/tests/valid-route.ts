import Route from "../src/path-finding/route";
import ServiceTimeInformation from "../src/bus-service/service-time-information.interface";
import busSegmentModel from "../src/bus-segment/bus-segment.model";

/**
 * Determines if a bus service or segment is in service
 * @param service The bus service or segment under consideration
 * @param now The current date and time for route-finding purposes
 */
function isInService(service : ServiceTimeInformation, now : Date = new Date()) : boolean {

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

    return now > segmentActiveStartDate && now < segmentActiveEndDate;

}

/**
 * Determines if a given path is valid.
 *
 * We cannot check if the given route is the most optimal from origin to destination, but we can check that it is
 * actually a valid route using the Singapore public bus network
 * @param origin The unique code of the origin bus stop
 * @param destination The unique code of the destination bus stop
 * @param route The calculated route
 * @param nowtime The current date and time, for route-finding purposes
 */
async function isRouteValid(origin: string, destination: string, nowtime : Date, route : Route) : Promise<boolean> {

    const now = new Date(nowtime.getTime());

    // First perform some preliminary sanity checks
    if(route.segments.length < 1) return false;

    const firstSegment = route.segments[0];
    const lastSegment = route.segments[route.segments.length - 1];

    if(firstSegment.busStops.length < 1) return false;
    if(firstSegment.busStops[0].BusStopCode !== String(origin)) return false;

    if(lastSegment.busStops.length < 1) return false;
    if(lastSegment.busStops[lastSegment.busStops.length - 1].BusStopCode !== String(destination)) return false;

    let lastStopVisited : String = String(origin);

    for(let segment of route.segments) {

        if(segment.busStops.length < 1) return false;
        if(segment.busStops[0].BusStopCode !== lastStopVisited) return false;

        for(let i = 0; i < segment.busStops.length - 1; i++) {

            const stop_i = segment.busStops[i];
            const stop_i1 = segment.busStops[i + 1];

            const segments = (await busSegmentModel.find({
                ServiceNo: segment.busService.ServiceNo,
                Direction: segment.busService.Direction,
                OriginCode: stop_i.BusStopCode,
                DestinationCode: stop_i1.BusStopCode,
                SegmentType: "finegrain"
            })).filter(seg => isInService(seg, now));

            if(segments.length < 1) return false;

            lastStopVisited = stop_i1.BusStopCode;

        }

    }

    return true;

}

export default isRouteValid;