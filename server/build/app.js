"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var config_1 = require("./config");
var app = express();
app.get('/', function (req, res) {
    res.send("Hello, world!");
});
app.listen(config_1.settings.port, function () {
    console.log("\"Bus direction src server listening on port " + config_1.settings.port + "!\"");
});
