import RouteSegment from "./route-segment";

/**
 * An interface for storing an optimal route between two bus stops
 */
interface Route {
    /**
     * A description of the bus stops along the route and the bus services to use to traverse them
     */
    segments: RouteSegment[]
    /**
     * An estimated travel time, in minutes
     */
    travelTime: number
}

export default Route;

