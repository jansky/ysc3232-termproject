/**
 * An interface for objects storing bus stop information
 */
interface BusStop {
    /**
     * A unique code identifying the bus stop
     */
    BusStopCode: String;
    /**
     * The name of the road where the bus stop is located
     */
    RoadName: String;
    /**
     * Contains nearby landmarks, if appropriate
     */
    Description: String;
    /**
     * The location of the bus stop in GPS coordinates
     */
    Location: {
        type: String;
        coordinates: []
    }
}

export default BusStop;