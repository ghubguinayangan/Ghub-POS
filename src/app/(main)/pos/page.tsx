
"use client";

import { useState, useMemo } from "react";
import { CATEGORIES } from "@/lib/placeholder-data";
import type { Product } from "@/lib/placeholder-data";
import CategoryTabs from "@/components/pos/category-tabs";
import ProductGrid from "@/components/pos/product-grid";
import CartDisplay from "@/components/pos/cart-display";
import { useToast } from "@/hooks/use-toast";
import { formatToPHP } from "@/lib/currency";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProducts } from "@/context/product-context";
import { useSales } from "@/context/sales-context";
import { useUtang } from "@/context/utang-context";
import useMockAuth from "@/hooks/use-mock-auth";
import type { UtangFormValues } from "@/components/pos/utang-dialog";
import { printReceiptAndOpenDrawer } from "@/lib/printer";
import type { ReceiptData } from "@/lib/printer";


export type CartItem = Product & { quantity: number };

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { products, setProducts } = useProducts();
  const { setSales } = useSales();
  const { addDebt } = useUtang();
  const { user } = useMockAuth();
  const { toast } = useToast();
  const { settings, isLoading } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    let results = products;

    if (activeCategory !== 'All') {
      results = results.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(lowercasedQuery)
      );
    }

    return results;
  }, [products, activeCategory, searchQuery]);


  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (settings.enableStockTracking) {
        // Ensure we don't add more than what's in stock
        if (existingItem && existingItem.quantity >= product.stock) {
          toast({
            variant: "destructive",
            title: "Stock limit reached",
            description: `You cannot add more of ${product.name}.`,
          });
          return prevCart;
        }
        if (!existingItem && product.stock <= 0) {
          toast({
            variant: "destructive",
            title: "Out of Stock",
            description: `${product.name} is currently out of stock.`,
          });
          return prevCart;
        }
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (settings.enableStockTracking) {
        const productInStock = products.find(p => p.id === productId);
        if (!productInStock) return;

        if (newQuantity > productInStock.stock) {
        toast({
            variant: "destructive",
            title: "Stock limit reached",
            description: `Only ${productInStock.stock} items of ${productInStock.name} are available.`,
        });
        return;
        }
    }
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
  }

  const handleCheckout = (total: number, paymentMethod: 'Cash' | 'GCash' | 'PayMaya' | 'Bank' | 'Utang', cashReceived?: number) => {
    
    // 1. Create a new sale record
    const newSale = {
        id: `sale_${new Date().getTime()}`,
        date: new Date(),
        cashier: user?.name || 'Unknown',
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
        total,
        paymentMethod,
        status: 'Completed' as const,
    };
    setSales(prevSales => [newSale, ...prevSales]);


    // 2. Decrease stock if tracking is enabled
    if (settings.enableStockTracking) {
        setProducts(prevProducts => {
            const updatedProducts = prevProducts.map(p => {
                const cartItem = cart.find(item => item.id === p.id);
                if (cartItem) {
                    return { ...p, stock: p.stock - cartItem.quantity };
                }
                return p;
            });
            return updatedProducts;
        });
    }

    // 3. Print receipt if auto-print is enabled
    if (settings.autoPrintReceipt) {
        try {
            const receiptData: ReceiptData = {
                sale: newSale,
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                })),
                cashier: user?.name || 'Unknown',
                change: cashReceived ? cashReceived - total : undefined,
                settings,
            };
            
            // Print receipt and open drawer if cash payment
            printReceiptAndOpenDrawer(receiptData, settings.autoOpenDrawer && paymentMethod === 'Cash');
        } catch (error) {
            console.error('Failed to print receipt:', error);
        }
    }

    // 4. Clear the cart
    clearCart();

    // 5. Show success toast
    toast({
      title: 'Payment Successful',
      description: `Transaction completed via ${paymentMethod}. Total: ${formatToPHP(total)}`,
    });
  }

  const handleProcessAsUtang = (debtorInfo: UtangFormValues) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const saleId = `sale_${new Date().getTime()}`;

    // 1. Create a new sale record
    const newSale = {
       id: saleId,
       date: new Date(),
       cashier: user?.name || 'Unknown',
       items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
       total,
       paymentMethod: 'Utang' as const,
       status: 'Completed' as const,
    };
    setSales(prevSales => [newSale, ...prevSales]);

    // 2. Create a new debt record
    addDebt({
       saleId,
       debtorName: debtorInfo.debtorName,
       debtorPhone: debtorInfo.debtorPhone,
       debtorEmail: debtorInfo.debtorEmail,
       items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
       total,
    });
    
    // 3. Decrease stock if tracking is enabled
    if (settings.enableStockTracking) {
        setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
            const cartItem = cart.find(item => item.id === p.id);
            if (cartItem) {
                return { ...p, stock: p.stock - cartItem.quantity };
            }
            return p;
        });
        return updatedProducts;
    });
    }

   // 4. Clear the cart
   clearCart();

   // 5. Show success toast
   toast({
     title: 'Debt Recorded',
     description: `Utang for ${debtorInfo.debtorName} amounting to ${formatToPHP(total)} has been recorded.`,
   });
 }

   if (isLoading) {
    return (
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            <div className="flex h-full flex-col gap-4 lg:col-span-2 xl:col-span-3">
                 <div className="flex flex-col gap-4 sm:flex-row">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-full sm:flex-[2]" />
                </div>
                <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
                </div>
            </div>
            <div className="lg:col-span-1 xl:col-span-1">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="flex h-full flex-col gap-4 lg:col-span-2 xl:col-span-3">
        <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <CategoryTabs
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              className="sm:flex-[2]"
            />
        </div>
        <ProductGrid
          products={filteredProducts}
          onAddToCart={addToCart}
          showStock={settings.showStockOnPOS}
          showPrice={settings.showPriceOnPOS}
          showImage={settings.showImageOnPOS}
        />
      </div>
      <div className="lg:col-span-1 xl:col-span-1">
        <CartDisplay
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          onProcessAsUtang={handleProcessAsUtang}
        />
      </div>
    </div>
  );
}
