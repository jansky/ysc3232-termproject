import mongoose from 'mongoose';
import BusStop from "./bus-stop.interface";

const busStopSchema = new mongoose.Schema({
    BusStopCode: String,
    RoadName: String,
    Description: String,
    Location: {
        type: String,
        coordinates: []
    }
}, { typeKey: '$type' });

busStopSchema.index({location: "2dsphere"});

/**
 * A Mongoose model for storing and retrieving bus stop information
 *
 * This model supports geospatial queries on the bus stop location.
 */
const busStopModel = mongoose.model<BusStop & mongoose.Document>('BusStop', busStopSchema);

export default busStopModel;