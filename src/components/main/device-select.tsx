"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDevice } from "@/context/device-context";
import { Smartphone } from "lucide-react";

/**
 * Lets the store owner pick which POS device/branch's synced data to view.
 * Most stores only ever have one device, in which case this just shows a
 * single, non-interactive-feeling option.
 */
export function DeviceSelect() {
  const { deviceIds, selectedDeviceId, setSelectedDeviceId, isLoading } = useDevice();

  if (!isLoading && deviceIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Smartphone className="h-4 w-4 text-muted-foreground" />
      <Label className="text-sm font-medium">Device</Label>
      <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId} disabled={isLoading}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select device"} />
        </SelectTrigger>
        <SelectContent>
          {deviceIds.map((id) => (
            <SelectItem key={id} value={id}>
              {id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
