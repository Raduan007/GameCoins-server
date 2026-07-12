import type { Types } from "mongoose";

export interface IPackage {
  _id?: string;
  game: Types.ObjectId | string;
  name: string;
  amount: number;
  price: number;
  currency: string;
  description: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}