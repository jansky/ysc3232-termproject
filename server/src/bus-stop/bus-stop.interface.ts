interface BusStop {
    BusStopCode: String;
    RoadName: String;
    Description: String;
    Location: {
        type: String;
        coordinates: []
    }
}

export default BusStop;