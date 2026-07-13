import { Schema } from "mongoose";
import type { IWishlist } from "../types/wishlist";
export declare const WishlistSchema: Schema<IWishlist, import("mongoose").Model<IWishlist, any, any, any, any, any, IWishlist>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
    _id: string;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<string | undefined, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    game?: import("mongoose").SchemaDefinitionProperty<string | import("mongoose").Types.ObjectId, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, IWishlist, import("mongoose").Document<unknown, {}, IWishlist, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IWishlist & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, IWishlist>;
//# sourceMappingURL=wishlist.schema.d.ts.map