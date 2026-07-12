export interface IGame {
  _id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  platform: string;
  publisher: string;
  logo: string;
  banner: string;
  rating: number;
  isPopular: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITopUpPackage {
  _id?: string;
  gameId: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}