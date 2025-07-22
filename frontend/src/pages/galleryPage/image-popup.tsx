"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight, Heart, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Items } from "@/pages/galleryPage/gallery";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApiGet } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { cn } from "@/lib/utils";
import { Card, Carousel } from "@/components/ui/apple-cards-carousel";
import { Link ,useNavigate, useSearchParams} from "react-router-dom";
import { useApiPost } from "@/hooks/apiHooks";
import { toast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import useUser from "@/hooks/useUser";

const Dialog = DialogPrimitive.Root;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface ImagePopupProps {
  item: Items;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: (direction: "prev" | "next") => void;
  onItemUpdate: (updatedItem: Items) => void;
}

const ImagePopup: React.FC<ImagePopupProps> = ({
  isOpen,
  onOpenChange,
  item,
  onNavigate,
  onItemUpdate,
}) => {
  const [isLiked, setIsLiked] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [currentDisplayItem, setCurrentDisplayItem] =
    React.useState<Items>(item);

  const [similarImages, setSimilarImages] = React.useState<Items[]>([]);
  const navigate = useNavigate();
  const user = useUser();
  const [searchParams,setSearchParams] = useSearchParams();
  
React.useEffect(() => {
  if(searchParams.get("imageId")!== item._id) {
    setSearchParams({ imageId: item._id });

  }
});

  const getSimilarImages = useApiGet({
    key: ["getSimilarImages"],
    path: `${ApiRoutes.discoverImages}?limit=10`,
    enabled: true,
    staleTime: 3000,
  });
  React.useEffect(() => {
    if (getSimilarImages.isSuccess) {
      setSimilarImages(getSimilarImages?.data?.data.data.images);
    }
  }, [getSimilarImages]);
  // Update current display item when main item changes
  React.useEffect(() => {
    setCurrentDisplayItem(item);
  }, [item]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onOpenChange?.(false);
          break;
        case "ArrowLeft":
          e.preventDefault();
          onNavigate?.("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          onNavigate?.("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange, onNavigate]);

  const nextImage = () => {
    onNavigate?.("next");
  };

  const prevImage = () => {
    onNavigate?.("prev");
  };
 const addLikes = useApiPost({
    type: "post",
    key: ["addLikes"],
    path: ApiRoutes.likeImage,
    sendingFile: false,
  });
  const saveToGallery = useApiPost({
    type: "post",
    key: ["saveToGallery"],
    path: ApiRoutes.saveImage,
    sendingFile: false,
  });

  const handleLike = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth?mode=login");
      toast({
        title: "Error",
        description: "Please login to like images",
        duration: 5000,
        variant: "error",
      });
      return;
    }
    try {
      const data = await addLikes.mutateAsync({
        imageId,
      });
      if (data.status === 200) {
        const isLiked = data.data.data.action === "liked";
        setIsLiked(isLiked);

        // Update the parent component's state
        const updatedItem = {
          ...item,
          isLikedByUser: isLiked,
          likesCount: isLiked
            ? item.likesCount + 1
            : Math.max(0, item.likesCount - 1),
        };
        onItemUpdate(updatedItem);

        toast({
          title: "Success",
          description: data.data.message,
          duration: 5000,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Image not liked",
          duration: 5000,
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: getErrorMsg(addLikes),
        duration: 5000,
        variant: "error",
      });
    }
  };

  const handleSave = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth?mode=login");
      toast({
        title: "Error",
        description: "Please login to save images",
        duration: 5000,
        variant: "error",
      });
      return;
    }
    try {
      const data = await saveToGallery.mutateAsync({ imageId });

      if (data.status === 200) {
        const isSaved = data.data.data.action === "saved";
        setIsSaved(isSaved);

        // Update the parent component's state
        const updatedItem = {
          ...item,
          isSavedByUser: isSaved,
          savesCount: isSaved
            ? item.savesCount + 1
            : Math.max(0, item.savesCount - 1),
        };
        onItemUpdate(updatedItem);

        toast({
          title: "Success",
          description: data.data.message,
          duration: 5000,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save image",
          duration: 5000,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save error:", error);

      toast({
        title: "Error",
        description:
          getErrorMsg(saveToGallery) ||
          "Something went wrong while saving the image.",
        duration: 5000,
        variant: "error",
      });
    }
  };
  const cards = similarImages?.map((card, index) => (
    <Card key={card._id} item={card} index={index} />
  ));
  const isMobile = useIsMobile();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] max-h-screen p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div
            className={`relative flex-1 bg-black flex items-center justify-center min-h-[50vh] md:min-h-full ${isMobile ? "w-dvw" : ""}`}
          >
            <button
              onClick={prevImage}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={currentDisplayItem._id}
                src={currentDisplayItem.imageUrl}
                alt={currentDisplayItem.title}
                className="max-w-full max-h-full object-contain"
                style={{
                  width: "min(50w, 600px)",
                  height: `min(${isMobile ? "50vh" : "80vh"}, 600px)`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                loading="lazy"
              />
            </AnimatePresence>

            <button
              onClick={nextImage}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Info Sidebar - Always visible, responsive width */}
          <div className="w-full md:w-80 lg:w-96 xl:w-[28rem] bg-background flex flex-col border-t md:border-t-0 md:border-l border-border">
            <div className="p-3 md:p-4 lg:p-6 flex-1 overflow-y-auto overflow-x-clip">
              <div className="space-y-3 md:space-y-4">
                {/* Title and Description */}
                <div>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2">
                    {currentDisplayItem.title}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 md:line-clamp-none truncate">
                    <Tooltip>
                      <TooltipTrigger>
                        {currentDisplayItem.description}
                      </TooltipTrigger>
                      <TooltipContent
                        className="w-80 bg-muted-foreground  text-balance"
                        side="bottom"
                        tip={false}
                      >
                        {currentDisplayItem.description}
                      </TooltipContent>
                    </Tooltip>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between py-3 md:py-4 border-y border-border">
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <button
                      onClick={(e) => handleLike?.(e,currentDisplayItem._id)}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4 md:w-5 md:h-5",
                          isLiked ? "fill-red-500 text-red-500" : ""
                        )}
                      />
                      <span className="text-sm md:text-base">
                        {currentDisplayItem.likesCount}
                      </span>
                    </button>

                    <button
                      onClick={(e) => handleSave?.(e,currentDisplayItem._id)}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Bookmark
                        className={cn(
                          "w-4 h-4 md:w-5 md:h-5",
                          isSaved ? "fill-blue-500 text-blue-500" : ""
                        )}
                      />
                      <span className="text-sm md:text-base">
                        {currentDisplayItem.savesCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-3 md:mb-4">
                    <Link to={`/creator/${currentDisplayItem.uploader._id}`}>
                      <img
                        src={currentDisplayItem.uploader.avatar}
                        alt={currentDisplayItem.uploader.username}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                      />
                      <span className="text-sm md:text-base font-medium">
                        {currentDisplayItem.uploader.username}
                      </span>
                    </Link>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    {currentDisplayItem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                    <p>
                      Created:{" "}
                      {new Date(
                        currentDisplayItem.createdAt
                      ).toLocaleDateString()}
                    </p>
                    <p className="mt-1 md:mt-2">
                      <span className="font-medium">Prompt:</span>
                      <span className="block md:inline md:ml-1 truncate">
                        <Tooltip>
                          <TooltipTrigger>
                            {currentDisplayItem.prompt}
                          </TooltipTrigger>
                          <TooltipContent
                            className="w-80 bg-muted-foreground  text-balance"
                            side="bottom"
                            tip={false}
                          >
                            {currentDisplayItem.prompt}
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </p>
                  </div>

                  {/* Similar Images Carousel */}

                  <div className={`${isMobile ? "h-25" : "h-50"}`}>
                    <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
                      Similar Images
                    </h3>
                    <Carousel items={cards} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePopup;
