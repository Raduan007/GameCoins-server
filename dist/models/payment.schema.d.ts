import { Schema } from "mongoose";
import type { IPayment } from "../types/payment";
export declare const PaymentSchema: Schema<IPayment, import("mongoose").Model<IPayment, any, any, any, any, any, IPayment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
    _id: string;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<string | undefined, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    order?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<"sslcommerz" | "bkash" | "nagad" | "card", IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<"pending" | "paid" | "failed", IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    transactionId?: import("mongoose").SchemaDefinitionProperty<string | undefined, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IPayment, import("mongoose").Document<unknown, {}, IPayment, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IPayment & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, IPayment>;
//# sourceMappingURL=payment.schema.d.ts.map