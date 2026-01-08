import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { toast } from "@/hooks/use-toast";

interface LikeButtonProps {
  targetId: string;
  targetType: 'project' | 'unit';
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showCount?: boolean;
  className?: string;
}

export const LikeButton = ({ 
  targetId, 
  targetType, 
  size = 'sm', 
  variant = 'outline',
  showCount = true,
  className = ""
}: LikeButtonProps) => {
  const { currentUser } = useAppStore();
  const customerId = currentUser?.id;
  
  const [likes, setLikes] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Load likes from localStorage on mount
  useEffect(() => {
    const storageKey = `likes_${targetType}`;
    const storedLikes = localStorage.getItem(storageKey);
    
    if (storedLikes) {
      const parsedLikes = JSON.parse(storedLikes);
      setLikes(parsedLikes);
      
      // Check if current user has liked this item
      if (customerId) {
        const userLikeKey = `${customerId}_${targetId}`;
        setIsLiked(parsedLikes.includes(userLikeKey));
      }
      
      // Count total likes for this item
      const itemLikes = parsedLikes.filter((like: string) => like.endsWith(`_${targetId}`));
      setLikeCount(itemLikes.length);
    }
  }, [targetId, targetType, customerId]);

  const handleLike = () => {
    if (!customerId) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like properties.",
        variant: "destructive",
      });
      return;
    }

    const storageKey = `likes_${targetType}`;
    const userLikeKey = `${customerId}_${targetId}`;
    
    let updatedLikes = [...likes];
    
    if (isLiked) {
      // Unlike
      updatedLikes = updatedLikes.filter(like => like !== userLikeKey);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: "Removed from Likes",
        description: "Property removed from your likes.",
      });
    } else {
      // Like
      updatedLikes.push(userLikeKey);
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      
      toast({
        title: "Added to Likes",
        description: "Property added to your likes!",
      });
    }
    
    // Update localStorage
    localStorage.setItem(storageKey, JSON.stringify(updatedLikes));
    setLikes(updatedLikes);
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs h-7",
    default: "px-3 py-1.5 text-sm h-8",
    lg: "px-4 py-2 text-base h-10"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleLike}
      className={`${sizeClasses[size]} ${isLiked ? "bg-primary text-primary-foreground" : ""} ${className}`}
    >
      <Heart className={`${iconSizes[size]} ${showCount ? "mr-1" : ""} ${isLiked ? 'fill-current' : ''}`} />
      {showCount && likeCount}
    </Button>
  );
};
