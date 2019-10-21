/**
 * An interface for objects storing bus arrival information
 */
interface BusArrival {
    /**
     * The number of the bus service
     */
    ServiceNo: String,
    /**
     * The unique code of the bus stop
     */
    BusStopCode: String,
    /**
     * The estimated time of arrival for the next bus
     */
    EstimatedArrival: Date
}

export default BusArrival;