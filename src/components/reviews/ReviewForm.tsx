import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "./RatingStars";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { mockApi } from "@/lib/mockApi";
import { projects, agents } from "@/data/mockData";

interface ReviewFormProps {
  reviewType?: "property" | "agent";
  targetId?: string;
  targetName?: string;
  customerId: string;
  customerName: string;
  tenantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  editData?: {
    id: string;
    rating: number;
    comment: string;
    images?: string[];
  };
}

export const ReviewForm = ({
  reviewType: initialType,
  targetId: initialTargetId,
  targetName: initialTargetName,
  customerId,
  customerName,
  tenantId,
  onSuccess,
  onCancel,
  editData,
}: ReviewFormProps) => {
  const [reviewType, setReviewType] = useState<"property" | "agent">(initialType || "property");
  const [targetId, setTargetId] = useState(initialTargetId || "");
  const [rating, setRating] = useState(editData?.rating || 0);
  const [comment, setComment] = useState(editData?.comment || "");
  const [images, setImages] = useState<string[]>(editData?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targets = reviewType === "property" ? projects : agents;
  const selectedTarget = targets.find((t) => t.id === targetId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (comment.length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }
    if (!targetId && !initialTargetId) {
      toast.error("Please select a target");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: reviewType,
        targetId: targetId || initialTargetId,
        targetName: selectedTarget?.name || initialTargetName,
        customerId,
        customerName,
        rating,
        comment,
        images,
        status: "pending",
        tenantId,
      };

      if (editData?.id) {
        await mockApi.patch("/reviews", editData.id, payload);
        toast.success("Review updated successfully");
      } else {
        await mockApi.post("/reviews", payload);
        toast.success("Review submitted and pending moderation");
      }

      onSuccess?.();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!initialType && (
        <div>
          <Label>Review Type</Label>
          <Select value={reviewType} onValueChange={(v: "property" | "agent") => { setReviewType(v); setTargetId(""); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property">Property</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!initialTargetId && (
        <div>
          <Label>Select {reviewType === "property" ? "Property" : "Agent"}</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger>
              <SelectValue placeholder={`Select a ${reviewType}`} />
            </SelectTrigger>
            <SelectContent>
              {targets.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="mb-2 block">Rating</Label>
        <RatingStars rating={rating} interactive onChange={setRating} size="lg" />
      </div>

      <div>
        <Label>Comment</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
      </div>

      <div>
        <Label className="mb-2 block">Images (optional, max 3)</Label>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20">
              <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : editData ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};
