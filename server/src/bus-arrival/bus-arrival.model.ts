import mongoose from 'mongoose';
import BusArrival from './bus-arrival.interface';

const busArrivalSchema = new mongoose.Schema({
    ServiceNo: String,
    BusStopCode: String,
    EstimatedArrival: Date
});

/**
 * A Mongoose model for storing and retrieving bus arrival information
 */
const busArrivalModel = mongoose.model<BusArrival & mongoose.Document>('BusArrival', busArrivalSchema);

export default busArrivalModel;