"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
exports.settings = {
    port: parseInt(process.env.PORT || "3000")
};
