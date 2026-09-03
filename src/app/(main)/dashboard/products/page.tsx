
"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, CloudOff, Boxes, AlertTriangle, PackageX } from "lucide-react";
import { useDevice } from "@/context/device-context";
import { DeviceSelect } from "@/components/main/device-select";
import { useSettings } from "@/context/settings-context";
import { getInventory, type InventoryRow } from "@/lib/ghub-data";
import { formatDateTimePH } from "@/lib/date";

type StockStatus = "out" | "low" | "ok";

function getStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "ok";
}

export default function InventoryPage() {
  const { selectedDeviceId, deviceIds, isLoading: deviceLoading } = useDevice();
  const { settings, setSettings } = useSettings();

  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    if (!selectedDeviceId) {
      setInventory([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const rows = await getInventory(selectedDeviceId);
    setInventory(rows);
    setIsLoading(false);
  }, [selectedDeviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(
      (i) => i.product_name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  const outOfStockCount = inventory.filter((i) => i.current_stock <= 0).length;
  const lowStockCount = inventory.filter((i) => i.current_stock > 0 && i.current_stock <= settings.lowStockThreshold).length;

  if (!deviceLoading && deviceIds.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CloudOff className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No synced data yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This page mirrors the stock levels synced from the G-hub POS mobile app. Open the app, go to
          Settings → Cloud Sync, and run a sync at least once — inventory will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Read-only view of the stock levels synced from your mobile app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeviceSelect />
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>
            Product name and stock as last synced from the mobile app.
          </CardDescription>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="threshold" className="text-sm font-medium whitespace-nowrap">
                Low stock at
              </Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                className="w-20"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ lowStockThreshold: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const status = getStatus(item.current_stock, settings.lowStockThreshold);
                  return (
                    <TableRow key={item.product_name}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category || '—'}</TableCell>
                      <TableCell className="text-right">{item.current_stock}</TableCell>
                      <TableCell>
                        {status === "out" && <Badge variant="destructive">Out of Stock</Badge>}
                        {status === "low" && <Badge variant="secondary">Low Stock</Badge>}
                        {status === "ok" && <Badge variant="outline">In Stock</Badge>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.synced_at ? formatDateTimePH(item.synced_at) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    {isLoading ? "Loading..." : "No products found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
