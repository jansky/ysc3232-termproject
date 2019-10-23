import BusSegment from "./bus-segment.interface";
import BusRouteStops from "../bus-route-stops/bus-route-stops.interface";

interface BusSegmentsWithRoutes {
    segments: BusSegment[],
    routes: (BusRouteStops|null)[]
}

export default BusSegmentsWithRoutes;