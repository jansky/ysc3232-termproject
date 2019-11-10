# EZRoute Server



This is the backend server for the EZRoute app. We provide the following commands:

`npm run start:watch`

Start the server in development mode with debugging enabled on port `5858`.
The server will automatically reload if you change project files.

Before running the server for the first time, make sure to set the correct
environment variables. Copy the `env.dist` file to `.env`, and set the following
variables:

`PORT` - The port to the HTTP server should listen on  
`MONGO_URL` - The connection string to the MongoDB database  
`LTA_API_KEY` - The API key for the LTA API

`npm run dev`

Start the server in development mode with debugging enabled on port `5858`. Do
not relaod automatically.

`npm run lta`

Download bus route and bus stop information from the LTA API.

`npm run doc`

Runs `typedoc` to produce a website containing documentation for the project in the
`doc/` directory. 

## Initial Setup

To get this server up and running on your local machine, first install all project dependencies with NPM:

`$ npm install`

Then, set the configuration options for the server. Copy `env.dist` to `.env`, and set the variables in the file:

`PORT` - The port to the HTTP server should listen on  
`MONGO_URL` - The connection string to the MongoDB database  
`LTA_API_KEY` - The API key for the LTA API

Then, generate the database of bus stops, services, and routes necessary for route finding:

`$ npm run lta`

Please note that this command takes a while (10-15 minutes) to complete. This only needs to be run
once.

Now you can start the development server:

`$ npm run start:watch`

## Deployment

First, upload the contents of this repository to your server instance. Then, on the server,
install all project dependencies with NPM:

`$ npm install`

Then, set the configuration options for the server. Copy `env.dist` to `.env`, and set the variables in the file:

`PORT` - The port to the HTTP server should listen on  
`MONGO_URL` - The connection string to the MongoDB database  
`LTA_API_KEY` - The API key for the LTA API

Then, generate the database of bus stops, services, and routes necessary for route finding:

`$ npm run lta`

Please note that this command takes a while (10-15 minutes) to complete. This only needs to be run
once.

Now you should compile the TypeScript code to JavaScript:

`$ npm run tsc`

Now use a process manager like PM2 to manage the server process (i.e., automatically restart if it goes
down):

`$ pm2 start build/server.js`

