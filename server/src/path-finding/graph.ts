import BusSegment from "../bus-segment/bus-segment.interface";
import Graph from 'node-dijkstra';
import * as util from "util";
import * as fs from "fs";

/**
 * A class for generating and loading graphs for Dijkstra path finding
 */
class DijkstraGraph {
    /**
     * Makes a Dijkstra graph
     *
     * Generates a JSON object that can be used as a Dijkstra graph representing the entire Singapore public bus network.
     * The output of this function is meant to be saved to a file so it can be loaded later.
     * @param segments The bus stop segments
     */
    static makeGraph(segments : BusSegment[]) : any {

        let graph : {[key: string]: any} = {};

        for(let segment of segments) {

            if(graph[segment.OriginCode as string]) {
                graph[segment.OriginCode as string][segment.DestinationCode as string] = segment.TravelTime;
            } else {

                let edges : {[key: string]: any} = {};
                edges[segment.DestinationCode as string] = segment.TravelTime;

                graph[segment.OriginCode as string] = edges;
            }

        }

        return graph;

    }

    /**
     * Loads a Dijkstra graph from a file
     *
     * This function loads a precomputed Dijkstra graph from a file that can be used to compute the shortest path between
     * two bus stops.
     * @param filename The name of the file to load the graph from
     */
    static async loadGraphFromFile(filename: string) {

        const readFile = util.promisify(fs.readFile);

        const graphStr = await readFile(filename, 'utf8');

        return new Graph(JSON.parse(graphStr));

    }
}


export default DijkstraGraph;