import request = require('request');
import BusStop from "../bus-stop/bus-stop.interface";
import BusStopModel from '../bus-stop/bus-stop.model';

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
     * @param accumulated Data values that have been already retrieved. When calling this method, you should pass an empty array
     * @param skip What number entry we should start retrieving
     * @param resolve A function (usually associated with a promise) that will be called when all data is retrieved
     * @param reject A function (usually associated with a promise) that will be called if an error is encountered
     */
    private getAndAccumulate(url : string, accumulated : any[], skip: number, resolve: any, reject: any) {

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

}

export default LTAApi;