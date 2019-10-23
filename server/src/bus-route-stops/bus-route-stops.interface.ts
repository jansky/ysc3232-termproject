import BusStop from "../bus-stop/bus-stop.interface";
import BusService from "../bus-service/bus-service.interface";
import ServiceTimeInformation from "../bus-service/service-time-information.interface";

interface BusRouteStops extends ServiceTimeInformation {
    Service: BusService,
    ServiceOrigin: BusStop,
    ServiceDestination: BusStop,
    OriginCode: String,
    DestinationCode: String,
    BusStops: BusStop[],
    WD_FirstBus: String,
    WD_LastBus: String,
    SAT_FirstBus: String,
    SAT_LastBus: String,
    SUN_FirstBus: String,
    SUN_LastBus: String,
    TravelTime: Number
}

export default BusRouteStops;