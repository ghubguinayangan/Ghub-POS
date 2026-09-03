"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/placeholder-data";
import { X, Edit, Check } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface ManageCategoriesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

export function ManageCategoriesDialog({ isOpen, onOpenChange, categories, setCategories }: ManageCategoriesDialogProps) {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const handleAddCategory = () => {
    if (newCategoryName.trim() === "") {
      toast({ variant: 'destructive', title: 'Category name cannot be empty.' });
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category already exists.' });
        return;
    }
    const newCategory: Category = {
      id: `cat_${new Date().getTime()}`,
      name: newCategoryName.trim(),
    };
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName("");
    toast({ title: 'Category Added', description: `${newCategory.name} has been added.` });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === 'cat_1') { // Cannot delete 'All'
        toast({ variant: 'destructive', title: 'Cannot delete the "All" category.' });
        return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    toast({ title: 'Category Deleted' });
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleUpdateCategory = () => {
    if (!editingCategoryId) return;
     if (editingCategoryName.trim() === "") {
      toast({ variant: 'destructive', title: 'Category name cannot be empty.' });
      return;
    }
     if (categories.some(c => c.id !== editingCategoryId && c.name.toLowerCase() === editingCategoryName.trim().toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category name already exists.' });
        return;
    }
    setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim() } : c));
    toast({ title: 'Category Updated' });
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or delete your product categories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="New category name" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory}>Add</Button>
            </div>
            <div className="space-y-2">
                <Label>Existing Categories</Label>
                <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                        {categories.filter(c => c.name !== 'All').map(category => (
                            <div key={category.id} className="flex items-center gap-2 p-2 border rounded-md">
                            {editingCategoryId === category.id ? (
                                <Input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()} className="flex-1 h-8"/>
                            ) : (
                                <p className="flex-1">{category.name}</p>
                            )}
                            {editingCategoryId === category.id ? (
                                <Button size="icon" variant="ghost" onClick={handleUpdateCategory} className="h-11 w-11"><Check className="h-4 w-4"/></Button>
                            ) : (
                                <Button size="icon" variant="ghost" onClick={() => handleEditCategory(category)} className="h-11 w-11"><Edit className="h-4 w-4"/></Button>
                            )}
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive h-11 w-11" onClick={() => handleDeleteCategory(category.id)}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
