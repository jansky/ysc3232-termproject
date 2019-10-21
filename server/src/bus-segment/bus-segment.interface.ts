/**
 * An interface for objects storing bus route segments
 */
interface BusSegment {
    /**
     * The number of the bus service
     */
    ServiceNo: String,
    /**
     * The direction of the bus service
     */
    Direction: Number,
    /**
     * The beginning stop of the bus route segment
     */
    OriginCode: String,
    /**
     * The ending, adjacent stop of the bus route segment
     */
    DestinationCode: String,
    /**
     * The estimated travel time between start and end bus stops, in minutes
     */
    TravelTime: Number
}

export default BusSegment;