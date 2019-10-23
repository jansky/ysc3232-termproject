import mongoose from 'mongoose';
import BusRouteStops from "./bus-route-stops.interface";
import { busStopSchema } from "../bus-stop/bus-stop.model";
import {busServiceSchema } from "../bus-service/bus-service.model";

const busRouteStopsSchema = new mongoose.Schema({
    Service: busServiceSchema,
    ServiceOrigin: busStopSchema,
    ServiceDestination: busStopSchema,
    OriginCode: String,
    DestinationCode: String,
    BusStops: [busStopSchema],
    WD_FirstBus: String,
    WD_LastBus: String,
    SAT_FirstBus: String,
    SAT_LastBus: String,
    SUN_FirstBus: String,
    SUN_LastBus: String,
    TravelTime: Number
});

const busRouteStopsModel = mongoose.model<BusRouteStops & mongoose.Document>('BusRouteStops', busRouteStopsSchema);

export default busRouteStopsModel;