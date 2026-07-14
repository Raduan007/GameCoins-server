import type { Types } from "mongoose";

export interface IPayment {
  _id?: string;
  order: Types.ObjectId | string;
  user: Types.ObjectId | string;
  amount: number;
  paymentMethod: "bkash" | "nagad" | "card" | "sslcommerz";
  paymentStatus: "pending" | "paid" | "failed";
  status: "pending" | "approved" | "rejected";
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
