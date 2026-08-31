
"use client";
import { useState, useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/placeholder-data";
import { formatToPHP } from "@/lib/currency";
import Image from "next/image";
import { MoreHorizontal, PlusCircle, Search, Settings, Trash2, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { ManageCategoriesDialog } from "@/components/products/manage-categories-dialog";
import type { Product, Category } from "@/lib/placeholder-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/context/product-context";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditProductDialog, ProductFormValues } from "@/components/products/edit-product-dialog";
import { MassEditProductDialog, type MassUpdateValues } from "@/components/products/mass-edit-product-dialog";


export default function ProductsPage() {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isManageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isMassEditDialogOpen, setMassEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { products, setProducts } = useProducts();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productIdsToDelete, setProductIdsToDelete] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    let results = products;

    if (selectedCategory !== 'All') {
      results = results.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(lowercasedQuery) ||
        p.category.toLowerCase().includes(lowercasedQuery)
      );
    }

    return results;
  }, [products, searchQuery, selectedCategory]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const selectionState = useMemo(() => {
    if (filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length) return true;
    const someSelected = selectedProductIds.length > 0 && selectedProductIds.length < filteredProducts.length;
    if (someSelected) return 'indeterminate';
    return false;
  }, [selectedProductIds, filteredProducts]);

  const handleProductAdded = (newProductData: Omit<Product, 'id' | 'imageUrl' | 'imageHint'> & { image: File | string }) => {
    const newProduct: Product = {
        ...newProductData,
        id: `prod_${new Date().getTime()}`,
        imageUrl: typeof newProductData.image === 'string' ? newProductData.image : URL.createObjectURL(newProductData.image),
        imageHint: newProductData.name.split(' ').slice(0,2).join(' '),
    };
    setProducts(prev => [newProduct, ...prev]);
  };
  
  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setEditDialogOpen(true);
  };

  const handleProductUpdated = (updatedData: ProductFormValues, productId: string) => {
    setProducts(prev => prev.map(p => {
        if (p.id === productId) {
            const newImageUrl = typeof updatedData.image === 'string' ? updatedData.image : URL.createObjectURL(updatedData.image);
            return {
                ...p,
                name: updatedData.name,
                category: updatedData.category,
                price: updatedData.price,
                stock: updatedData.stock,
                imageUrl: newImageUrl,
                imageHint: updatedData.name.split(' ').slice(0,2).join(' '),
            };
        }
        return p;
    }));
    toast({ title: 'Product Updated', description: `${updatedData.name} has been updated.` });
    setEditDialogOpen(false);
  };

  const handleProductsMassUpdated = (updatedData: MassUpdateValues) => {
    setProducts(prev => prev.map(p => {
        if (selectedProductIds.includes(p.id)) {
            const newProduct = { ...p };
            if (updatedData.category) newProduct.category = updatedData.category;
            if (updatedData.price !== undefined) newProduct.price = updatedData.price;
            if (updatedData.stock !== undefined) newProduct.stock = updatedData.stock;
            return newProduct;
        }
        return p;
    }));
    toast({ title: 'Products Updated', description: `${selectedProductIds.length} product(s) have been updated.` });
    setMassEditDialogOpen(false);
    setSelectedProductIds([]); // Clear selection after update
  };

  const handleDeleteClick = (productIds: string[]) => {
    setProductIdsToDelete(productIds);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    setProducts(prev => prev.filter(p => !productIdsToDelete.includes(p.id)));
    toast({
      title: "Products Deleted",
      description: `${productIdsToDelete.length} product(s) have been successfully removed.`,
    });
    setDeleteDialogOpen(false);
    setProductIdsToDelete([]);
    setSelectedProductIds([]);
  };

  return (
    <>
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
             {selectedProductIds.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">{selectedProductIds.length} selected</span>
                     <Button variant="outline" size="sm" onClick={() => setMassEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Selected
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(selectedProductIds)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
            </Button>
            <Button variant="outline" onClick={() => setManageCategoriesDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Categories
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            Manage your products and view their inventory status.
          </CardDescription>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {categories.filter(c => c.name !== 'All').map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                   <Checkbox
                        checked={selectionState}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                  <TableCell>
                     <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                        aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.imageUrl}
                      width="64"
                      data-ai-hint={product.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatToPHP(product.price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick([product.id])}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AddProductDialog 
        isOpen={isAddDialogOpen} 
        onOpenChange={setAddDialogOpen}
        categories={categories.filter(c => c.name !== 'All')}
        onProductAdded={handleProductAdded}
    />
     <EditProductDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        categories={categories.filter(c => c.name !== 'All')}
        onProductUpdated={handleProductUpdated}
        product={productToEdit}
    />
     <MassEditProductDialog
        isOpen={isMassEditDialogOpen}
        onOpenChange={setMassEditDialogOpen}
        categories={categories.filter(c => c.name !== 'All')}
        onProductsUpdated={handleProductsMassUpdated}
        selectedCount={selectedProductIds.length}
    />
    <ManageCategoriesDialog 
        isOpen={isManageCategoriesDialogOpen} 
        onOpenChange={setManageCategoriesDialogOpen}
        categories={categories}
        setCategories={setCategories}
    />
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {productIdsToDelete.length} product(s).
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
