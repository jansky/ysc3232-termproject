import mongoose from 'mongoose';
import BusService from "./bus-service.interface";

const busServiceSchema = new mongoose.Schema({
    ServiceNo: String,
    Operator: String,
    Direction: Number,
    Category: String,
    OriginCode: String,
    DestinationCode : String,
    LoopDesc: String
});

/**
 * A Mongoose model for storing and retrieving bus services
 */
const busServiceModel = mongoose.model<BusService & mongoose.Document>('BusService', busServiceSchema);

export default busServiceModel;