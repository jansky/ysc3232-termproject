import mongoose from 'mongoose';
import BusStop from "./bus-stop.interface";

const busStopSchema = new mongoose.Schema({
    BusStopCode: String,
    RoadName: String,
    Description: String,
    Latitude: Number,
    Longitude: Number
});

const busStopModel = mongoose.model<BusStop & mongoose.Document>('BusStop', busStopSchema);

export default busStopModel;