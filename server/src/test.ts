import LTAApi from "./lta/lta.api";
import config from "./config";
import mongoose from "mongoose";

const api = new LTAApi(config.lta_api_key);

mongoose.connect(config.mongodb_url);

api.getBusArrivalTimes("17091").then(arrivals => {
    console.log(arrivals);
    mongoose.disconnect();
}, failure => {
    console.error(failure)
    mongoose.disconnect();
});