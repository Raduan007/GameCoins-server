import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import mongoose from "mongoose";
import Game from "../models/game.model";
import Package from "../models/package.model";
import connectDB from "../config/db";

async function main() {
  await connectDB();
  const game = await Game.findOne({ isActive: true });
  const pkg = await Package.findOne({ game: game?._id, isActive: true });

  console.log("GAME_ID:", game?._id?.toString());
  console.log("GAME_NAME:", game?.name);
  console.log("PACKAGE_ID:", pkg?._id?.toString());
  console.log("PACKAGE_NAME:", pkg?.name);
  console.log("PACKAGE_PRICE:", pkg?.price);

  await mongoose.disconnect();
}

main();
