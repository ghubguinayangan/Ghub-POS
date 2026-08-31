
import { PlaceHolderImages } from "./placeholder-images";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  imageHint: string;
};

export type Category = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Cashier' | 'Staff';
  avatarUrl: string;
  hourlyRate: number;
  status: 'Active' | 'Inactive';
};

export type Sale = {
  id: string;
  date: Date;
  cashier: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: 'Cash' | 'GCash' | 'PayMaya' | 'Bank' | 'Utang';
  status: 'Completed' | 'Partially Refunded' | 'Refunded';
  refundedAmount?: number;
};

const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

export const CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'All' },
];

export const PRODUCTS: Product[] = [];

export const USERS: User[] = [];
