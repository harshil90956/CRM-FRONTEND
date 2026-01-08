import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ActionBottomBarProps {
  selectedCount: number;
  onClose: () => void;
  children: ReactNode;
}

export const ActionBottomBar = ({ selectedCount, onClose, children }: ActionBottomBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl shadow-2xl px-4 py-3">
            {/* Selected Count */}
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-md">
                {selectedCount} selected
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-border" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
