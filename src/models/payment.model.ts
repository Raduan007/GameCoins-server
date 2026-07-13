import mongoose, { Model } from "mongoose";
import type { IPayment } from "../types/payment";
import { PaymentSchema } from "./payment.schema";

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
