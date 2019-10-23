/**
 * An interface for objects storing bus route segments
 */
import ServiceTimeInformation from "../bus-service/service-time-information.interface";

interface BusSegment extends ServiceTimeInformation {
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
    TravelTime: Number,
    /**
     * Time of the first bus on weekdays
     */
    WD_FirstBus: String,
    /**
     * Time of the last bus on weekdays
     */
    WD_LastBus: String,
    /**
     * Time of the first bus on Saturdays
     */
    SAT_FirstBus: String,
    /**
     * Time of the last bus on Saturdays
     */
    SAT_LastBus: String,
    /**
     * Time of the first bus on Sundays
     */
    SUN_FirstBus: String,
    /**
     * Time of the last bus on Sundays
     */
    SUN_LastBus: String,
    /**
     * The order of the bus segment in the overall bus route
     */
    Sequence: Number,
    /**
     * The type of the bus segment
     */
    SegmentType: String
}

export default BusSegment;