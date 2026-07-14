export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "seller";
  avatar?: string;
  isActive: boolean;
  status: "active" | "suspended" | "blocked";
  createdAt?: Date;
  updatedAt?: Date;
}