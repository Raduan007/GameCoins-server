import mongoose, { Model } from "mongoose";
import type { IGame, ITopUpPackage } from "../types/game";
export declare const GameSchema: mongoose.Schema<IGame, mongoose.Model<IGame, any, any, any, any, any, IGame>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IGame, mongoose.Document<unknown, {}, IGame, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
    _id: string;
}> & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: mongoose.SchemaDefinitionProperty<string | undefined, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    name?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    slug?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    shortDescription?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    fullDescription?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    category?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platform?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    publisher?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    logo?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    banner?: mongoose.SchemaDefinitionProperty<string, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    rating?: mongoose.SchemaDefinitionProperty<number, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isPopular?: mongoose.SchemaDefinitionProperty<boolean, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isFeatured?: mongoose.SchemaDefinitionProperty<boolean, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isActive?: mongoose.SchemaDefinitionProperty<boolean, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: mongoose.SchemaDefinitionProperty<Date | undefined, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: mongoose.SchemaDefinitionProperty<Date | undefined, IGame, mongoose.Document<unknown, {}, IGame, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<IGame & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, IGame>;
declare const Game: Model<IGame>;
export default Game;
export declare const TopUpPackageSchema: mongoose.Schema<ITopUpPackage, mongoose.Model<ITopUpPackage, any, any, any, any, any, ITopUpPackage>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
    _id: string;
}> & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: mongoose.SchemaDefinitionProperty<string | undefined, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    gameId?: mongoose.SchemaDefinitionProperty<string, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    name?: mongoose.SchemaDefinitionProperty<string, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    coins?: mongoose.SchemaDefinitionProperty<number, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    price?: mongoose.SchemaDefinitionProperty<number, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    currency?: mongoose.SchemaDefinitionProperty<string, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isPopular?: mongoose.SchemaDefinitionProperty<boolean, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    isActive?: mongoose.SchemaDefinitionProperty<boolean, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: mongoose.SchemaDefinitionProperty<Date | undefined, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: mongoose.SchemaDefinitionProperty<Date | undefined, ITopUpPackage, mongoose.Document<unknown, {}, ITopUpPackage, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ITopUpPackage & Required<{
        _id: string;
    }> & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ITopUpPackage>;
//# sourceMappingURL=game.model.d.ts.map