import { useApiInfiniteQuery, useApiPost } from "@/hooks/apiHooks";
import {
  Download,
  Share2,
  Copy,
  Heart,
  BookmarkCheck,
  Bookmark,
  Eye,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useInView } from "react-intersection-observer";
import ApiRoutes from "@/connectors/api-routes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import ImagePopup from "./image-popup";
import SearchBar from "./gallerySearch";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import useUser from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageHoverCardProps {
  imageUrl: string;
  title?: string;
  description?: string;
  alt?: string;
  index?: number;
  item: Items;
  onOpenPopup: (item: Items, index: number) => void;
  onItemUpdate: (updatedItem: Items) => void;
}

export const ImageHoverCard = ({
  imageUrl,
  title = "Untitled",
  description = "Beautiful imagery captured in this stunning photograph.",
  alt = "Gallery image",
  index = 0,
  item,
  onOpenPopup,
  onItemUpdate,
}: ImageHoverCardProps) => {
  const [isLiked, setIsLiked] = useState(item.isLikedByUser || false);
  const [isSaved, setIsSaved] = useState(item.isSavedByUser || false);
  const [viewCount, setViewCount] = useState(
    Math.floor(Math.random() * 1000) + 100
  );
  const { toast } = useToast();
const navigate = useNavigate();
const isMobile=useIsMobile();
const  user  = useUser();
  const downloadImage = useApiPost({
    type: "post",
    key: ["downloadImage"],
    path: ApiRoutes.downloadImage,
    sendingFile: false,
  });
  const getMimeType=(url:string)=>{
    const mimeType=url.split(".").pop();
    return mimeType;
  }
  const handleDownload = async(e: React.MouseEvent) => {
    e.stopPropagation();
    if(!user){
      navigate("/auth?mode=login");
      toast({
        title: "Error",
        description: "Please login to download images",
        duration: 5000,
        variant: "error",
      });
      return;
    }
   const result= await downloadImage.mutateAsync({ imageId:item._id })
   
    if(result.data.status!==200) {
      toast({
        title: "Error",
        description: "Failed to download image",
        duration: 5000,
        variant: "error",
      });
    }
    const imageUrl=await result.data?.data.imageUrl;
    
    const mimeType=getMimeType(imageUrl);
    if(isMobile){
      const filename=`${title.toLowerCase().replace(/\s+/g, "-").replace(/[:*?"<>|\\/]/g, "") }-${Date.now()}`
      const downloadUrl=imageUrl.replace(
    "/upload/",
    `/upload/fl_attachment:${encodeURIComponent(filename)}`
  );
      window.open(downloadUrl,"_blank",);
      return;
    }
    const imageBlob=await fetch(imageUrl);
    const blob=await imageBlob.blob();
    const link=URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = link;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-").replace(/[:*?"<>|\\/]/g, "")}-${Date.now()}.${mimeType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(link);
    toast({
      title: "Success",
      description: "Image downloaded successfully",
      duration: 5000,
      variant: "success",
    });
  };

  useEffect(() => {
    if (item.isLikedByUser) {
      setIsLiked(true);
    } else {
      setIsLiked(false);
    }
    if (item.isSavedByUser) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [item]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: imageUrl,
        });
      } catch (err) {
        console.error("Share error:", err);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard
      .writeText(imageUrl)
      .then(() => {
        toast({
          title: "Success",
          description: "Link copied to clipboard",
          duration: 3000,
          variant: "success",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy link",
          duration: 3000,
          variant: "error",
        });
      });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(imageUrl).then(() => {
      toast({
        title: "Success",
        description: "Image URL copied to clipboard",
        duration: 3000,
        variant: "success",
      });
    });
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

  const handleView = () => {
    setViewCount((prev) => prev + 1);
  };

  const handleImageClick = () => {
    handleView();
    onOpenPopup(item, index);
  };

  return (
    <div
      className="relative group w-full h-full overflow-hidden rounded-lg mb-4 cursor-pointer"
      onClick={handleImageClick}
    >
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-75"
          loading="lazy"
          decoding="async"
          fetchPriority="high"
        />

        {/* Gradient Overlay - Always visible but subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Top Corner Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
          <Eye className="w-3 h-3 text-white" />
          <span className="text-xs text-white font-medium">{viewCount}</span>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          {/* Text Content */}
          <div className="mb-4">
            <h3 className="text-white text-lg font-bold mb-2 line-clamp-1 drop-shadow-lg">
              {title}
            </h3>
            <p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-md">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Download
            </Button>

            <Button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Share2 className="w-3 h-3 mr-1.5" />
              Share
            </Button>

            <Button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy
            </Button>

            <Button
              onClick={(e) => handleLike(e, item._id)}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg ${
                isLiked
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white/95 hover:bg-white text-gray-800"
              }`}
            >
              <Heart
                className={`w-3 h-3 mr-1.5 ${isLiked ? "fill-current" : ""}`}
              />
              {isLiked ? "Liked" : "Like"}
            </Button>

            <Button
              onClick={(e) => handleSave(e, item._id)}
              className="inline-flex items-center px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {isSaved ? (
                <BookmarkCheck className="w-3 h-3 mr-1.5" />
              ) : (
                <Bookmark className="w-3 h-3 mr-1.5" />
              )}
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {/* Loading Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </div>
  );
};

export interface Items {
  _id: string;
  title: string;
  description: string;
  prompt: string;
  public_id: string;
  imageUrl: string;
  uploader: {
    _id: string;
    username: string;
    avatar: string;
  };
  tags: string[];
  likes: Array<{
    _id: string;
    likedBy: string;
    createdAt: string;
  }>;
  saves: Array<{
    _id: string;
    savedBy: string;
    createdAt: string;
  }>;
  // Add these missing properties
  likesCount: number;
  savesCount: number;
  downloadsCount: number;
  isSavedByUser: boolean;
  isLikedByUser: boolean;
  createdAt: string;
  updatedAt: string;
}

function Gallery({ creatorId }: { creatorId?: string }) {
  const [items, setItems] = useState<Items[]>([]);
  const [selectedItem, setSelectedItem] = useState<Items | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // ✨ NEW: Map to store image ID to index mapping for O(1) updates
  const imageIndexMap = useRef<Map<string, number>>(new Map());

  // ✨ NEW: Function to rebuild the index map when items change
  const rebuildIndexMap = (newItems: Items[]) => {
    imageIndexMap.current.clear();
    newItems.forEach((item, index) => {
      imageIndexMap.current.set(item._id, index);
    });
  };

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });
  const [searchParams] = useSearchParams();

  // useEffect(() => {
  //   console.log("search params", searchParams);
  // }, [searchParams]);
  
  const query = searchParams.get("query");
  const limit = searchParams.get("limit") || "20";
  const page = searchParams.get("page") || "1";
  const tags = searchParams.get("tags");
 const location=useLocation(); 
  const {toast} = useToast();
  const getApiRoute = () => {
    if (query && tags) {
      return ApiRoutes.advancedSearch;
    } else if (query) {
      return ApiRoutes.searchImages;
    } else if (creatorId) {
      // console.log("creatorId", creatorId);
      return `${ApiRoutes.getImagesOfUser}?creatorId=${creatorId}`;
    }
     else {
      return ApiRoutes.getGallery;
    }
  };
  
  const getQueryParams = () => {
    const params: any = {
      limit: parseInt(limit),
      page: parseInt(page), // Will be overridden by pagination
    };

    if (query && tags) {
      // Advanced search params
      params.query = query;
      params.tags = tags;
    } else if (query) {
      // Simple search params
      params.query = query;
    }

    return params;
  };

  const infiniteQuery = useApiInfiniteQuery({
    key: query
      ? tags
        ? ["advancedSearch", query, tags]
        : ["searchImages", query]
      : ["getGallery"],
    path: getApiRoute(),
    enabled: true,
    getNextPageParam: (lastPage) => {
      // console.log("getNextPageParam called with:", lastPage);

      const responseData = lastPage?.data?.data;
      if (!responseData) {
        // console.log("No response data found");
        return undefined;
      }

      if (responseData.pagination?.hasNextPage) {
        const nextPage = responseData.pagination.currentPage + 1;
        // console.log("Next page:", nextPage);
        return nextPage;
      }

      // console.log("No more pages available");
      return undefined;
    },
    initialPageParam: getQueryParams().page,
    limit: getQueryParams().limit,
    tags: getQueryParams().tags,
    query: getQueryParams()?.query,
    getPreviousPageParam: (firstPage) => {
      const responseData = firstPage?.data?.data;
      return responseData?.pagination?.hasPreviousPage
        ? responseData.pagination.currentPage - 1
        : undefined;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (
      inView &&
      infiniteQuery.hasNextPage &&
      !infiniteQuery.isFetchingNextPage
    ) {
      // console.log("Fetching next page due to inView...");
      infiniteQuery.fetchNextPage();
    }
  }, [inView, infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage]);

  useEffect(() => {
    if (infiniteQuery.isSuccess && infiniteQuery.data) {
      const allItems = infiniteQuery.data.pages.flatMap((page) => {
        if (
          getApiRoute() === ApiRoutes.getGallery ||
          getApiRoute() ===
            `${ApiRoutes.getImagesOfUser}?creatorId=${creatorId}`
        ) {
          const responseData = page?.data?.data;
          if (responseData?.images) {
            return responseData.images;
          }

          if (page?.data) {
            return Array.isArray(page.data) ? page.data : [];
          }

          return [];
        } else if (
          getApiRoute() === ApiRoutes.searchImages ||
          getApiRoute() === ApiRoutes.advancedSearch
        ) {
          const responseData = page.data.data.results;
          // console.log("responsedata", responseData);
          return responseData;
        }
      });

      // console.log("All flattened items:", allItems.length);
      setItems(allItems);
      // ✨ NEW: Rebuild index map when items change
      rebuildIndexMap(allItems);
    }
  }, [
    infiniteQuery.isSuccess,
    infiniteQuery.dataUpdatedAt,
    infiniteQuery.data,
  ]);

  const handleOpenPopup = (item: Items, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setIsPopupOpen(true);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (!items.length) return;

    let newIndex = selectedIndex;

    if (direction === "next") {
      newIndex = selectedIndex + 1 >= items.length ? 0 : selectedIndex + 1;
    } else {
      newIndex = selectedIndex - 1 < 0 ? items.length - 1 : selectedIndex - 1;
    }

    setSelectedIndex(newIndex);
    setSelectedItem(items[newIndex]);
  };

  // ✨ OPTIMIZED: O(1) item update using index map
  const handleItemUpdate = (updatedItem: Items) => {
    const itemIndex = imageIndexMap.current.get(updatedItem._id);
    
    if (itemIndex !== undefined) {
      // O(1) update - directly update the specific index
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[itemIndex] = updatedItem;
        return newItems;
      });
    } else {
      // Fallback to original O(n) method if index not found
      // This should rarely happen, but provides safety
      console.warn(`Item with ID ${updatedItem._id} not found in index map, falling back to O(n) update`);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
      // Rebuild index map to prevent future issues
      rebuildIndexMap(items);
    }

    // Also update selectedItem if it's the same item
    if (selectedItem && selectedItem._id === updatedItem._id) {
      setSelectedItem(updatedItem);
    }
  };
useEffect(() => {
  const imageId = searchParams.get("imageId");
  
  if (imageId && items.length > 0) {
    // Find the item with matching imageId
    const itemIndex = items.findIndex(item => item._id === imageId);
    
    if (itemIndex !== -1) {
      const foundItem = items[itemIndex];
      setSelectedItem(foundItem);
      setSelectedIndex(itemIndex);
      setIsPopupOpen(true);
    } else {
      console.warn(`Image with ID ${imageId} not found in current items`);
      // Optionally, you could show a toast notification here
      toast({
        title: "Image not found",
        description: "The requested image could not be found in the current gallery.",
        duration: 5000,
        variant: "error",
      });
    }
  }
}, [searchParams, items]);
if(searchParams.get("showLikes")&&location.pathname.toString().includes("dashboard")){

  return(
    <>
      <div className="min-h-screen py-12 px-4">
    <SearchBar />
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 300: 2, 500: 3, 700: 4, 900: 5 }}
      >
        <Masonry gutter="20px">
          {items.map((item, i) => {
            if(item.isLikedByUser){
            return (
              <ImageHoverCard
                key={`${item.public_id}-${i}`}
                imageUrl={item.imageUrl}
                title={item.title}
                description={item.description}
                alt={`Gallery image ${i + 1}`}
                index={i}
                item={item}
                onOpenPopup={handleOpenPopup}
                onItemUpdate={handleItemUpdate}
              />
            );
          }
          })}
        </Masonry>
      </ResponsiveMasonry>

      {infiniteQuery.hasNextPage && (
        <div ref={inViewRef} className="flex justify-center mt-8 py-4">
          {infiniteQuery.isFetchingNextPage ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-gray-600">Loading more images...</span>
            </div>
          ) : (
            <button
              onClick={() => infiniteQuery.fetchNextPage()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!infiniteQuery.hasNextPage}
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* End of results message */}
      {!infiniteQuery.hasNextPage && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-500">
            You've reached the end of the gallery
          </div>
        </div>
      )}

      {/* Image Popup */}
      {selectedItem && (
  <ImagePopup
    isOpen={isPopupOpen}
    onOpenChange={(open) => {
      setIsPopupOpen(open);
      // Clear imageId from URL when closing popup
      if (!open && searchParams.get("imageId")) {
        searchParams.delete("imageId");
      }
    }}
    item={selectedItem}
    onNavigate={handleNavigate}
    onItemUpdate={handleItemUpdate}
  />
)}
    </div>
    </>
  )
}
if(searchParams.get("showSaves")&&location.pathname.toString().includes("dashboard")){

  return(
    <>
      <div className="min-h-screen py-12 px-4">
    <SearchBar />
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 300: 2, 500: 3, 700: 4, 900: 5 }}
      >
        <Masonry gutter="20px">
          {items.map((item, i) => {
            if(item.isSavedByUser){
            return (
              <ImageHoverCard
                key={`${item.public_id}-${i}`}
                imageUrl={item.imageUrl}
                title={item.title}
                description={item.description}
                alt={`Gallery image ${i + 1}`}
                index={i}
                item={item}
                onOpenPopup={handleOpenPopup}
                onItemUpdate={handleItemUpdate}
              />
            );
          }
          })}
        </Masonry>
      </ResponsiveMasonry>

      {infiniteQuery.hasNextPage && (
        <div ref={inViewRef} className="flex justify-center mt-8 py-4">
          {infiniteQuery.isFetchingNextPage ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-gray-600">Loading more images...</span>
            </div>
          ) : (
            <button
              onClick={() => infiniteQuery.fetchNextPage()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!infiniteQuery.hasNextPage}
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* End of results message */}
      {!infiniteQuery.hasNextPage && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-500">
            You've reached the end of the gallery
          </div>
        </div>
      )}

      {/* Image Popup */}
      {selectedItem && (
  <ImagePopup
    isOpen={isPopupOpen}
    onOpenChange={(open) => {
      setIsPopupOpen(open);
      // Clear imageId from URL when closing popup
      if (!open && searchParams.get("imageId")) {
        searchParams.delete("imageId");
      }
    }}
    item={selectedItem}
    onNavigate={handleNavigate}
    onItemUpdate={handleItemUpdate}
  />
)}
    </div>
    </>
  )
}
  // Loading state
  if (infiniteQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading gallery...</div>
      </div>
    );
  }

  // Error state
  if (infiniteQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        {!(getApiRoute() === ApiRoutes.getGallery) && <SearchBar />}
        <div className="text-lg text-red-600">
          {getApiRoute() === ApiRoutes.getGallery
            ? "Error loading gallery. Please try again."
            : "Error searching images. Please try again."}
          <br />
          <small>{infiniteQuery.error?.message}</small>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        {!(getApiRoute() === ApiRoutes.getGallery) && <SearchBar />}
        <div className="text-lg text-gray-600">
          {getApiRoute() === ApiRoutes.getGallery
            ? "No images found in gallery."
            : "No images found for the query."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-700 mb-4">
            Visual Gallery
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover a curated collection of stunning imagery. Hover over any
            image to explore and interact with our collection.
          </p>
        </div>
      </div>
      <SearchBar />
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 300: 2, 500: 3, 700: 4, 900: 5 }}
      >
        <Masonry gutter="20px">
          {items.map((item, i) => {
            return (
              <ImageHoverCard
                key={`${item.public_id}-${i}`}
                imageUrl={item.imageUrl}
                title={item.title}
                description={item.description}
                alt={`Gallery image ${i + 1}`}
                index={i}
                item={item}
                onOpenPopup={handleOpenPopup}
                onItemUpdate={handleItemUpdate}
              />
            );
          })}
        </Masonry>
      </ResponsiveMasonry>

      {infiniteQuery.hasNextPage && (
        <div ref={inViewRef} className="flex justify-center mt-8 py-4">
          {infiniteQuery.isFetchingNextPage ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-gray-600">Loading more images...</span>
            </div>
          ) : (
            <button
              onClick={() => infiniteQuery.fetchNextPage()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!infiniteQuery.hasNextPage}
            >
              Load More
            </button>
          )}
        </div>
      )}

      {/* End of results message */}
      {!infiniteQuery.hasNextPage && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-500">
            You've reached the end of the gallery
          </div>
        </div>
      )}

      {/* Image Popup */}
      {selectedItem && (
  <ImagePopup
    isOpen={isPopupOpen}
    onOpenChange={(open) => {
      setIsPopupOpen(open);
      // Clear imageId from URL when closing popup
      if (!open && searchParams.get("imageId")) {
        searchParams.delete("imageId");
      }
    }}
    item={selectedItem}
    onNavigate={handleNavigate}
    onItemUpdate={handleItemUpdate}
  />
)}
    </div>
  );
}

export default Gallery;