import request = require('request');
import BusStop from "../bus-stop/bus-stop.interface";
import BusStopModel from '../bus-stop/bus-stop.model';
import BusService from "../bus-service/bus-service.interface";
import BusServiceModel from '../bus-service/bus-service.model';
import BusSegment from "../bus-segment/bus-segment.interface";
import BusSegmentModel from '../bus-segment/bus-segment.model';

/**
 * A class to help query the LTA API
 */
class LTAApi {

    private apiKey : string;
    private baseURL : string = "http://datamall2.mytransport.sg/ltaodataservice/";

    /**
     * Constructs a new LTA API class with the given API key
     * @param apiKey The LTA API key to be used to make queries to the LTA API
     */
    constructor(apiKey : string) {

        this.apiKey = apiKey;

    }

    /**
     * Retrieves data from the LTA API
     * @param url The URL to retrieve data from (e.g. 'BusStops')
     * @param skip What number entry we should start retrieving
     */
    private get(url : string, skip : number) : Promise<any> {

        return new Promise<any>((resolve, reject) => {

            const fullURL = this.baseURL + url + (skip > -1 ? "?$skip=" + skip : "");

            const options = {
                url : fullURL,
                headers: {
                    AccountKey: this.apiKey
                }
            };

            console.log(`Making request to ${fullURL}...`);

            request(options, (error, response, body) => {

                if(error) {
                    reject(error);
                    return;
                }

                if(response.statusCode != 200) {
                    reject(new Error("Received response code of " + response.statusCode));
                    return;
                }

                resolve(JSON.parse(body).value);


            });
        });
    }

    /**
     * Retrieves all data for a given LTA API url.
     *
     * The LTA API returns data in sets of 500 responses. If there are more than 500 entries in a dataset, then you
     * must query them all using the $skip query string parameter. This function makes as many requests as needed
     * to retrieve all data.
     * @param url The LTA API url to retrieve data from
     */
    private async getAndAccumulate(url : string, accumulated: any[], skip: number, resolve: any, reject: any) {

        this.get(url, skip).then(response => {

            /* We're finished accumulating data when no responses are returned */
            if(response.length == 0) {
                resolve(accumulated);
                return;
            }

            this.getAndAccumulate(url, accumulated.concat(response), skip + 500, resolve, reject);

        }, failure => {
            reject(failure);
        })

    }

    private async getAndAccumulateHashMap(url : string, keyfunc: (_ : any) => string) {

        let skip : number = 0;
        let accumulated : {[key: string]: any[]} = {};

        let response : any[] = [];

        while(response.length > 0 || skip == 0){

            for(let datum of response) {

                const key = keyfunc(datum);
                const datums = accumulated[key];
                if(datums) {
                    datums.push(datum);

                } else {
                    accumulated[key] = [datum];
                }

            }

            skip += 500;

            response = await this.get(url, skip);

        }

        return accumulated;

    }

    /**
     * Retrieves all bus stops from the LTA API
     *
     * @returns A promise that will resolve with the list of all public bus stops in Singapore
     */
    public getAllBusStops() : Promise<BusStop[]> {

        const apiResponse = new Promise<any>(
            (resolve, reject) =>
                this.getAndAccumulate("BusStops", [], 0, resolve, reject));

        return new Promise<BusStop[]>((resolve, reject) => {

            apiResponse.then(stops => {

                let busStops : Array<BusStop> = new Array<BusStop>();

                for(let stop of stops) {

                    if(typeof(stop.BusStopCode) !== "string") {
                        reject(new Error("Bus stop did not contain BusStopCode"));
                        return;
                    }

                    if(typeof(stop.RoadName) !== "string") {
                        reject(new Error("Bus stop did not contain RoadName"));
                        return;
                    }

                    if(typeof(stop.Description) !== "string") {
                        reject(new Error("Bus stop did not contain Description"));
                        return;
                    }

                    if(typeof(stop.Latitude) !== "number") {
                        reject(new Error("Bus stop did not contain Latitude"));
                        return;
                    }

                    if(typeof(stop.Longitude) !== "number") {
                        reject(new Error("Bus stop did not contain Longitude"));
                        return;
                    }

                    const busStop : BusStop = new BusStopModel({
                        BusStopCode: stop.BusStopCode,
                        RoadName: stop.RoadName,
                        Description: stop.Description,
                        Location: {
                            type: "point",
                            coordinates: [stop.Latitude, stop.Longitude]
                        }
                    });

                    busStops.push(busStop);

                }

                resolve(busStops);

            }, failure => reject(failure));

        });

    }

    /**
     * Retrieves all bus services from the LTA API
     *
     * @returns A promise that will resolve with the list of all public bus services in Singapore
     */
    public getAllBusServices() : Promise<BusService[]> {

        const apiResponse = new Promise<any>(
            (resolve, reject) =>
                this.getAndAccumulate("BusServices", [], 0, resolve, reject));

        return new Promise<BusService[]>((resolve, reject) => {

            apiResponse.then(services => {

                let busServices : Array<BusService> = new Array<BusService>();

                for(let service of services) {

                    if(typeof(service.ServiceNo) !== "string") {
                        reject(new Error("Bus service did not contain ServiceNo"));
                        return;
                    }

                    if(typeof(service.Operator) !== "string") {
                        reject(new Error("Bus service did not contain Operator"));
                        return;
                    }

                    if(typeof(service.Direction) !== "number") {
                        reject(new Error("Bus service did not contain Direction"));
                        return;
                    }

                    if(typeof(service.Category) !== "string") {
                        reject(new Error("Bus service did not contain Category"));
                        return;
                    }

                    if(typeof(service.OriginCode) !== "string") {
                        reject(new Error("Bus service did not contain OriginCode"));
                        return;
                    }

                    if(typeof(service.DestinationCode) !== "string") {
                        reject(new Error("Bus service did not contain DestinationCode"));
                        return;
                    }

                    if(typeof(service.LoopDesc) !== "string") {
                        reject(new Error("Bus service did not contain LoopDesc"));
                        return;
                    }

                    const busService : BusService = new BusServiceModel({
                        ServiceNo: service.ServiceNo,
                        Operator: service.Operator,
                        Direction: service.Direction,
                        Category: service.Category,
                        OriginCode: service.OriginCode,
                        DestinationCode: service.DestinationCode,
                        LoopDesc: service.LoopDesc
                    });

                    busServices.push(busService);

                }

                resolve(busServices);

            }, failure => reject(failure));

        });

    }

    /**
     * Returns all bus route segments
     * @param speedNormal The average speed a bus along a normal segment
     * @param speedExpress The average speed of a bus along an express segment
     */
    public getAllBusSegments(speedNormal : number, speedExpress : number) : Promise<BusSegment[]> {

        const apiResponse =
                this.getAndAccumulateHashMap(
                    "BusRoutes",
                    segment => `${segment.ServiceNo}_${segment.Direction}`);

        return new Promise<BusSegment[]>((resolve, reject) => {

            apiResponse.then((serviceSegments : {[key: string]: any[]}) => {

                const busSegments : Array<BusSegment> = new Array<BusSegment>();

                for(let service of Object.keys(serviceSegments)) {

                    const route : any[] | undefined = serviceSegments[service];

                    if(!route) {
                        reject(new Error(`Unable to get information for ${service}`))
                        return;
                    }

                    route.sort((a, b) => {
                       if(a.StopSequence < b.StopSequence) { return -1; }
                       else if(a.StopSequence == b.StopSequence) { return 0; }
                       else { return 1; }
                    });

                    for(let i = 0; i < route.length - 1; i++) {

                        const stop_i = route[i];
                        const stop_i1 = route[i + 1];

                        /* Sometimes the distance is incorrectly reported as zero or negative
                           To fix this we return the absolute value of the distance, plus a small addition
                           to make sure it's not zero.
                         */
                        const distance : number = Math.abs(stop_i1.Distance - stop_i.Distance) + 0.01;

                        const time : number = (distance < 5 ?  Math.ceil(distance / speedNormal * 60)  : Math.ceil(distance / speedExpress * 60));

                        const busSegment = new BusSegmentModel({
                            ServiceNo: stop_i.ServiceNo,
                            Direction: stop_i.Direction,
                            OriginCode: stop_i.BusStopCode,
                            DestinationCode: stop_i1.BusStopCode,
                            TravelTime: time,
                        });

                        busSegments.push(busSegment);

                    }

                }

                resolve(busSegments);

            }, failure => reject(failure));

        });

    }

}

export default LTAApi;