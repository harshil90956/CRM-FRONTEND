import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const RatingStars = ({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
}: RatingStarsProps) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < rating
              ? "fill-warning text-warning"
              : "fill-muted text-muted-foreground/30",
            interactive && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
};
