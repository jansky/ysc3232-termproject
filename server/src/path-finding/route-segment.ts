import BusService from "../bus-service/bus-service.interface";
import BusStop from "../bus-stop/bus-stop.interface";

/**
 * A segment of a calculated bus route
 *
 * A segment refers to a portion of the bus route which can be completed by traveling on one bus service between the
 * origin and destination bus stops.
 */
interface RouteSegment {
    busService : BusService
    busServiceOrigin: BusStop
    busServiceDestination: BusStop
    busStops: BusStop[]
}

export default RouteSegment;