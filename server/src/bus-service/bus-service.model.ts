import mongoose from 'mongoose';
import BusService from "./bus-service.interface";
import {busStopSchema} from "../bus-stop/bus-stop.model";

export const busServiceSchema = new mongoose.Schema({
    ServiceNo: String,
    Operator: String,
    Direction: Number,
    Category: String,
    OriginCode: String,
    DestinationCode : String,
    LoopDesc: String
});

busServiceSchema.methods.toJSON = function(){
    let obj = this.toObject();
    delete obj._id;
    return obj;
};

busServiceSchema.index({"ServiceNo": 1, "Direction": 1});

/**
 * A Mongoose model for storing and retrieving bus services
 */
const busServiceModel = mongoose.model<BusService & mongoose.Document>('BusService', busServiceSchema);

export default busServiceModel;