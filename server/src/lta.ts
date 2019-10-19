import mongoose from 'mongoose';

import config from './config';
import LTAApi from "./lta/lta.api";
import {mongo} from "mongoose";
import busStopModel from "./bus-stop/bus-stop.model";

const api = new LTAApi(config.lta_api_key);

mongoose.connect(config.mongodb_url);

busStopModel.find({}).remove(err => {

    if(err) {
        console.error(err);
        return;
    }

    api.getAllBusStops().then(busStops => {

        busStopModel.insertMany(busStops).then(_ => {
            console.log(`Saved ${busStops.length} bus stops.`);

            mongoose.disconnect();

        }, err => {
            console.error(err);
        });


    }, failure => {
        console.error(failure);
    });


});

