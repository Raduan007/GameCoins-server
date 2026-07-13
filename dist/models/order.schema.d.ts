import { Schema } from "mongoose";
import type { IOrder } from "../types/order";
export declare const OrderSchema: Schema<IOrder, import("mongoose").Model<IOrder, any, any, any, any, any, IOrder>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
    _id: string;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<string | undefined, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    game?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    package?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    playerId?: import("mongoose").SchemaDefinitionProperty<string, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    playerName?: import("mongoose").SchemaDefinitionProperty<string | undefined, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    quantity?: import("mongoose").SchemaDefinitionProperty<number, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    unitPrice?: import("mongoose").SchemaDefinitionProperty<number, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    totalPrice?: import("mongoose").SchemaDefinitionProperty<number, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paymentMethod?: import("mongoose").SchemaDefinitionProperty<"sslcommerz" | "bkash" | "nagad" | "cod", IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<"pending" | "paid" | "failed", IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    orderStatus?: import("mongoose").SchemaDefinitionProperty<"pending" | "processing" | "completed" | "cancelled", IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IOrder, import("mongoose").Document<unknown, {}, IOrder, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IOrder & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, IOrder>;
//# sourceMappingURL=order.schema.d.ts.map