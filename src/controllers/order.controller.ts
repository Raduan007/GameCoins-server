import { Request, Response, NextFunction } from "express";
import connectDB from "../config/db";
import apiResponse from "../utils/apiResponse";
import { ApiError } from "../middleware/errorHandler";
import Game from "../models/game.model";
import Package from "../models/package.model";
import Order from "../models/order.model";

const REQUIRED_FIELDS = ["gameId", "packageId", "playerId", "paymentMethod"] as const;
const ALLOWED_PAYMENT_METHODS = ["sslcommerz", "bkash", "nagad", "cod"] as const;

/**
 * POST /api/orders
 * Creates a new order for a game package.
 */
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDB();

    const { gameId, packageId, playerId, playerName, quantity, paymentMethod } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError("Unauthorized", 401);
    }

    // 1. Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = req.body[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      throw new ApiError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    // 2. Validate quantity
    const qty = quantity !== undefined ? Number(quantity) : 1;
    if (isNaN(qty) || qty < 1) {
      throw new ApiError("Quantity must be a number greater than or equal to 1", 400);
    }

    // 3. Validate paymentMethod
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new ApiError(
        `Invalid payment method. Must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`,
        400
      );
    }

    // 4. Verify Game exists and is active
    const game = await Game.findById(gameId).lean();
    if (!game || !game.isActive) {
      throw new ApiError("Game not found or inactive", 404);
    }

    // 5. Verify Package exists and is active
    const pkg = await Package.findById(packageId).lean();
    if (!pkg || !pkg.isActive) {
      throw new ApiError("Package not found or inactive", 404);
    }

    // Verify package belongs to the game
    if (pkg.game.toString() !== gameId) {
      throw new ApiError("The selected package does not belong to this game", 400);
    }

    // 6. Calculate Pricing
    const totalPrice = pkg.price * qty;

    // 7. Save Order
    const order = await Order.create({
      user: userId,
      game: gameId,
      package: packageId,
      playerId: playerId.trim(),
      playerName: playerName ? playerName.trim() : "",
      quantity: qty,
      unitPrice: pkg.price,
      totalPrice,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // 8. Return response
    apiResponse.success(
      res,
      order,
      "Order created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}
export default createOrder;
