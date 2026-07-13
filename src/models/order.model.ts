import mongoose, { Model } from "mongoose";
import type { IOrder } from "../types/order";
import { OrderSchema } from "./order.schema";

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
