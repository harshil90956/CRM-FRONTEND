import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  sidebarCollapsed: boolean;
}

export const PageWrapper = ({
  children,
  title,
  description,
  actions,
  sidebarCollapsed,
}: PageWrapperProps) => {
  const isMobile = useIsMobile();
  return (
    <motion.main
      initial={false}
      animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 260) }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="min-h-screen pt-16 bg-background"
    >
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title">{title}</h1>
            {description && <p className="page-description">{description}</p>}
          </div>
          {actions && <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">{actions}</div>}
        </motion.div>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.main>
  );
};
