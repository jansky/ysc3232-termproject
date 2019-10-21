/**
 * An interface for objects storing bus service information
 */
interface BusService {
    /**
     * The number of the bus service
     */
    ServiceNo: String,
    /**
     * The company operating the service (e.g., SBST)
     */
    Operator: String,
    /**
     * 1 or 2 depending on the direction of the bus route
     */
    Direction: Number,
    /**
     * The category of the bus service (e.g., Trunk or Express)
     */
    Category: String,
    /**
     * The bus stop code of the first stop
     */
    OriginCode: String,
    /**
     * The bus stop code of the last stop
     */
    DestinationCode : String,
    /**
     * Where the bus loops (this property is only set for looping buses)
     */
    LoopDesc: String
}

export default BusService;