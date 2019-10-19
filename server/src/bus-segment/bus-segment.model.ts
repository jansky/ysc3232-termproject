import mongoose from 'mongoose';
import BusSegment from "./bus-segment.interface";

const busSegmentSchema = new mongoose.Schema({
    TravelTime: Number,
    ServiceNo: String,
    Direction: Number,
    OriginCode: String,
    DestinationCode: String
});

const busSegmentModel = mongoose.model<BusSegment & mongoose.Document>('BusSegment', busSegmentSchema);

export default busSegmentModel;