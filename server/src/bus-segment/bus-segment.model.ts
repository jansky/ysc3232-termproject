import mongoose from 'mongoose';
import BusSegment from "./bus-segment.interface";

const busSegmentSchema = new mongoose.Schema({
    TravelTime: Number,
    ServiceNo: String,
    Direction: Number,
    OriginCode: String,
    DestinationCode: String,
    WD_FirstBus: String,
    WD_LastBus: String,
    SAT_FirstBus: String,
    SAT_LastBus: String,
    SUN_FirstBus: String,
    SUN_LastBus: String,
    Sequence: Number,
    SegmentType: String
});

busSegmentSchema.index({"ServiceNo": 1, "Direction": 1, "OriginCode": 1, "DestinationCode": 1});

/**
 * A Mongoose model for storing and retrieving bus route segments
 */
const busSegmentModel = mongoose.model<BusSegment & mongoose.Document>('BusSegment', busSegmentSchema);

export default busSegmentModel;