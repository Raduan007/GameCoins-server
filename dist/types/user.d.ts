export interface IUser {
    _id?: string;
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
    avatar?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=user.d.ts.map