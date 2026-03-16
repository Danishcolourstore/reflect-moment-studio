import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, LayoutGrid, List, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (v: "grid" | "table") => void;
  statusFilter: string;
  onStatusFilterChange: (v: any) => void;
  onInvite: () => void;
}

export function ClientCRMHeader({
  search, onSearchChange, viewMode, onViewModeChange, statusFilter, onStatusFilterChange, onInvite,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Client Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage relationships, track engagement & deliver exceptional experiences
          </p>
        </div>
        <Button onClick={onInvite} className="shrink-0 text-[11px] uppercase tracking-wider font-medium gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[130px] bg-card">
              <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
