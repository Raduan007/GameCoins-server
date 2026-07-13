"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose_1 = __importDefault(require("mongoose"));
const game_model_1 = __importDefault(require("../models/game.model"));
const package_model_1 = __importDefault(require("../models/package.model"));
const db_1 = __importDefault(require("../config/db"));
async function main() {
    await (0, db_1.default)();
    const game = await game_model_1.default.findOne({ isActive: true });
    const pkg = await package_model_1.default.findOne({ game: game?._id, isActive: true });
    console.log("GAME_ID:", game?._id?.toString());
    console.log("GAME_NAME:", game?.name);
    console.log("PACKAGE_ID:", pkg?._id?.toString());
    console.log("PACKAGE_NAME:", pkg?.name);
    console.log("PACKAGE_PRICE:", pkg?.price);
    await mongoose_1.default.disconnect();
}
main();
//# sourceMappingURL=check-data.js.map