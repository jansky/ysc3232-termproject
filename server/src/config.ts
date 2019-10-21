import 'dotenv/config';

/**
 * The settings of the server application
 */
const settings = {
    /**
     * The port to listen on for the HTTP server
     */
    port: parseInt(process.env.PORT || "3000"),
    /**
     * The MongoDB connection URL
     */
    mongodb_url: process.env.MONGO_URL || "mongodb://localhost:27017/busdirection",
    /**
     * The API key for the LTA API
     */
    lta_api_key: process.env.LTA_API_KEY || ""
};

export default settings;


