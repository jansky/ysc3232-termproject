import BusStop from "../bus-stop/bus-stop.interface";
import BusService from "../bus-service/bus-service.interface";
import ServiceTimeInformation from "../bus-service/service-time-information.interface";

/**
 * An interface for objects storing bus route descriptions.
 *
 * Dijkstra path-finding only returns a list of bus stops to traverse to get from origin to destination. To get from a
 * list of bus stops to an actual bus route that can be followed by a user, we store descriptions of bus routes between
 * two stops.
 *
 * Here, a route refers to the list of stops that you must traverse using one bus service to get from a given origin
 * bus stop to a given destination bus stop.
 */
interface BusRouteStops extends ServiceTimeInformation {
    /**
     * The bus service used to traverse the bus stops
     */
    Service: BusService,
    /**
     * The first stop of the bus service
     */
    ServiceOrigin: BusStop,
    /**
     * The last stop of the bus service
     */
    ServiceDestination: BusStop,
    /**
     * The unique code of the first stop of the route
     */
    OriginCode: String,
    /**
     * The unique code of the last stop of the route
     */
    DestinationCode: String,
    /**
     * A list of bus-stops that must be traversed using the bus service to get from origin to destination
     */
    BusStops: BusStop[],
    /**
     * The first bus that can be used to traverse this route on weekdays
     */
    WD_FirstBus: String,
    /**
     * The last bus that can be used to traverse this route on weekdays
     */
    WD_LastBus: String,
    /**
     * The first bus that can be used to traverse this route on Saturdays
     */
    SAT_FirstBus: String,
    /**
     * The last bus that can be used to traverse this route on Saturdays
     */
    SAT_LastBus: String,
    /**
     * The first bus that can be used to traverse this route on Sundays
     */
    SUN_FirstBus: String,
    /**
     * The last bus that can be used to traverse this route on Sundays
     */
    SUN_LastBus: String,
    /**
     * The estimated travel time for this route, in minutes
     */
    TravelTime: Number,
    /**
     * The type of route (e.g., "hubtohub", "spoketohub", "hubtospoke")
     */
    SegmentType: String
}

export default BusRouteStops;