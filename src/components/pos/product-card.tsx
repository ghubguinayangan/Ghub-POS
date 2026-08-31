
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/placeholder-data";
import { formatToPHP } from "@/lib/currency";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  showStock: boolean;
  showPrice: boolean;
  showImage: boolean;
}

export default function ProductCard({ product, onAddToCart, showStock, showPrice, showImage }: ProductCardProps) {
  const { settings } = useSettings();
  const isOutOfStock = settings.enableStockTracking && product.stock === 0;

  const getStockBadgeVariant = (stock: number): "destructive" | "secondary" | "outline" => {
    if (stock === 0) return "destructive";
    if (stock > 0 && stock <= settings.lowStockThreshold) return "secondary";
    return "outline";
  };

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-all",
        isOutOfStock
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary"
      )}
      onClick={() => !isOutOfStock && onAddToCart(product)}
      role="button"
      aria-label={`Add ${product.name} to cart`}
      aria-disabled={isOutOfStock}
    >
      <CardContent className="flex flex-1 flex-col p-0">
        {showImage && (
            <div className="aspect-square relative w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={product.imageHint}
            />
            </div>
        )}
        <div className={cn(
            "flex flex-1 flex-col p-3",
            !showImage 
                ? "aspect-square items-center justify-center text-center" 
                : "justify-between"
        )}>
            <div className="space-y-1">
                <p className={cn("font-semibold", !showImage ? 'text-base whitespace-normal' : 'text-sm truncate')}>{product.name}</p>
                {showPrice && (
                  <p className="text-sm text-muted-foreground">{formatToPHP(product.price)}</p>
                )}
            </div>
            {settings.enableStockTracking && showStock && (
                 <Badge variant={getStockBadgeVariant(product.stock)} className="mt-2 w-fit">
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                 </Badge>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
