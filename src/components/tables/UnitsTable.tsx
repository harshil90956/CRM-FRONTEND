import { motion } from "framer-motion";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Unit } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getUnitMainType, getUnitArea, getUnitLocation, formatPrice, getStatusStyle, getStatusLabel } from "@/lib/unitHelpers";

interface UnitsTableProps {
  limit?: number;
  data?: Unit[];
  onView?: (unit: Unit) => void;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
}

export const UnitsTable = ({ limit, data = [], onView, onEdit, onDelete }: UnitsTableProps) => {
  const displayUnits = limit ? data.slice(0, limit) : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="table-container"
    >
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="bg-table-header hover:bg-table-header">
            <TableHead className="font-semibold">Unit No</TableHead>
            <TableHead className="font-semibold">Project</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Area</TableHead>
            <TableHead className="font-semibold">Price</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayUnits.map((unit, index) => (
            <motion.tr
              key={unit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="hover:bg-table-row-hover transition-colors"
            >
              <TableCell className="font-medium text-foreground">{unit.unitNo}</TableCell>
              <TableCell className="text-muted-foreground">{unit.project}</TableCell>
              <TableCell className="text-muted-foreground">{getUnitLocation(unit)}</TableCell>
              <TableCell className="text-muted-foreground">{getUnitMainType(unit)}</TableCell>
              <TableCell className="text-muted-foreground">{getUnitArea(unit)}</TableCell>
              <TableCell className="font-medium text-foreground">{formatPrice(unit.price)}</TableCell>
              <TableCell>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusStyle(unit.status))}>
                  {getStatusLabel(unit.status)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(unit)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(unit)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Unit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(unit)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
};
