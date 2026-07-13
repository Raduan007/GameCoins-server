import type { Types } from "mongoose";

export interface IOrder {
  _id?: string;
  user: Types.ObjectId | string;
  game: Types.ObjectId | string;
  package: Types.ObjectId | string;
  playerId: string;
  playerName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: "sslcommerz" | "bkash" | "nagad" | "cod";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}
