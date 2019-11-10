import 'mocha';
import config from "../src/config";
import mongoose from "mongoose";
import PointToPoint from "../src/path-finding/point-to-point";
import isRouteValid from "./valid-route";
import HubAndSpoke from "../src/path-finding/hub-and-spoke";
import assert from "assert";

before(function(){
    mongoose.connect(config.mongodb_url);

});

after(function(){

    mongoose.disconnect();

});

describe("EZRoute", function(){

    it("should be able to find a point-to-point route between two bus stops", async function(){

        // Perform route finding at midday
        const now = new Date(2019, 11, 4, 13, 0);

        // 17091 to 51071 - Aft Clementi Ave 1 - Macritchie Rsvr
        const origin = '17091';
        const destination = '51071';
        const route = await PointToPoint.findPointToPointRoute(origin, destination, now);

        const valid = await isRouteValid(origin, destination, now, route);

        assert.ok(valid);

    }).timeout(10000);

    it("should be able to find a hub-and-spoke route between two bus stops", async function(){

        // Perform route finding at midday
        const now = new Date(2019, 10, 30, 12, 0, 0, 0);

        // 17101 to 99099 - Blk 352 - Changi Village Ter
        const origin = '17101';
        const destination = '99099';
        const route = await HubAndSpoke.findHubAndSpokeRoute(origin, destination, now);

        const valid = await isRouteValid(origin, destination, now, route);

        assert.ok(valid);

    }).timeout(10000);

    it("should not return a point-to-point route when there is no service", function (done) {

        // No bus service at 3 AM
        const now = new Date(2019, 10, 30, 3, 0, 0, 0);

        // 17091 to 51071 - Aft Clementi Ave 1 - Macritchie Rsvr
        const origin = '17091';
        const destination = '51071';
        PointToPoint.findPointToPointRoute(origin, destination, now).then(_ => {
            assert.fail("Route should not have been returned");
        }, _ => {}).finally(done);

    }).timeout(10000);

    it("should not return a hub-and-spoke route when there is no service", function (done) {

        // No bus service at 3 AM
        const now = new Date(2019, 10, 30, 3, 0, 0, 0);

        // 17091 to 51071 - Aft Clementi Ave 1 - Macritchie Rsvr
        const origin = '17091';
        const destination = '51071';
        HubAndSpoke.findHubAndSpokeRoute(origin, destination, now).then(_ => {
            assert.fail("Route should not have been returned");
        }, _ => {}).finally(done);

    }).timeout(10000);




});

