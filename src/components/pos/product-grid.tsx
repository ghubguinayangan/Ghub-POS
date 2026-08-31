
import { ScrollArea } from "@/components/ui/scroll-area";
import ProductCard from "./product-card";
import type { Product } from "@/lib/placeholder-data";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  showStock: boolean;
  showPrice: boolean;
  showImage: boolean;
}

export default function ProductGrid({
  products,
  onAddToCart,
  showStock,
  showPrice,
  showImage,
}: ProductGridProps) {
  return (
    <ScrollArea className="flex-1 rounded-lg bg-card">
      <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            showStock={showStock}
            showPrice={showPrice}
            showImage={showImage}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
