import 'dotenv/config';

const settings = {
    port: parseInt(process.env.PORT || "3000"),
    mongodb_url: process.env.MONGO_URL || "mongodb://localhost:27017/busdirection"
};

export default settings;


