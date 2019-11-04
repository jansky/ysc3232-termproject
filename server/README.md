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
