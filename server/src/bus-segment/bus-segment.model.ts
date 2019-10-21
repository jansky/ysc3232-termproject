import mongoose from 'mongoose';
import BusSegment from "./bus-segment.interface";

const busSegmentSchema = new mongoose.Schema({
    TravelTime: Number,
    ServiceNo: String,
    Direction: Number,
    OriginCode: String,
    DestinationCode: String
});

/**
 * A Mongoose model for storing and retrieving bus route segments
 */
const busSegmentModel = mongoose.model<BusSegment & mongoose.Document>('BusSegment', busSegmentSchema);

export default busSegmentModel;