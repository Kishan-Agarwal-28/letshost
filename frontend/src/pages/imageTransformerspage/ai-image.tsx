import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Download,
  Share2,
  Copy,
  Wand2,
  Coins,
  Image as ImageIcon,
  Zap,
  Send,
  ArrowRight,
  Star,
  Key,
  Shield,
  Info,
  History,
  Eye,
  Palette,
  Trash2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import useUser from "@/hooks/useUser";
import { useUserStore } from "@/store/store";
import { useApiPost } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveImageWithMeta,
  imageDB,
  getUserImageKeys,
  getUserImageRecord,
} from "@/db/indexDB";
import { getRandomPrompts } from "./examplePrompts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface HistoryItem {
  id: number;
  url: string;
  prompt: string;
  style: string;
  resolution: string;
  aspectRatio: string;
  timestamp: string;
  generationTime: number;
  public_id: string;
  contributed: boolean;
}
export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokens, setTokens] = useState(10);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [useGeminiApi, setUseGeminiApi] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [maxTokens] = useState(10);
  const [generationTime, setGenerationTime] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("1024x1024");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("");
  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryImage, setSelectedHistoryImage] =
    useState<HistoryItem | null>(null);
  const [currentTab, setCurrentTab] = useState<"generate" | "history">(
    "generate",
  );
  const [customResolution, setCustomResolution] = useState("");
  const [currentResolution, setCurrentResolution] = useState("");
  const [savedImages, setSavedImages] = useState<Set<number>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState<string | null>(null);
  const [publicID, setPublicID] = useState<string>("");
  const user = useUser();
  const userStore = useUserStore();
  const { toast } = useToast();

  useEffect(() => {
    if (user?._id) {
      const saved = localStorage.getItem(`savedImages_${user?._id}`);
      if (saved) {
        setSavedImages(new Set(JSON.parse(saved)));
      }
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(
        `savedImages_${user?._id}`,
        JSON.stringify([...savedImages]),
      );
    }
  }, [savedImages, user?._id]);
  useEffect(() => {
    if (user) {
      setTokens(user.genCredits);
      console.log("checking user api key", user.apiKey);
      if (user.apiKey && user.apiKey !== "") {
        setGeminiApiKey(user.apiKey);
        setUseGeminiApi(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (imageHistory.length > 0 && user?._id) {
      localStorage.setItem(
        `imageHistory_${user?._id}`,
        JSON.stringify(imageHistory),
      );
    }
  }, [imageHistory, user?._id]);

  useEffect(() => {
    if (user?._id) {
      const historyData = localStorage.getItem(`imageHistory_${user?._id}`);
      if (historyData) {
        setImageHistory(JSON.parse(historyData));
      }
    }
  }, [user?._id]);

  useEffect(() => {
    const restoreImageHistory = async () => {
      if (!user?._id) return;

      const keys = await getUserImageKeys(user?._id);

      const restored = await Promise.all(
        keys.map(async (key) => {
          const record = await getUserImageRecord(
            key as IDBValidKey,
            user?._id,
          );
          if (!record || !record.base64) return null;

          const blobUrl = base64ToBlobUrl(record.base64);

          return {
            id: record.id.replace(`${user?._id}_`, ""), // Remove prefix for display
            url: blobUrl, // restored
            prompt: record.prompt,
            style: record.style,
            resolution: record.resolution,
            aspectRatio: record.aspectRatio,
            timestamp: record.timestamp,
            generationTime: record.generationTime,
            public_id: record.public_id || "",
            contributed: record.contributed || false,
          };
        }),
      );

      const valid = restored.filter(Boolean) as HistoryItem[];
      setImageHistory(valid.reverse()); // most recent first
    };

    restoreImageHistory();
  }, [user?._id]);

  const getGeneratedImage = useApiPost({
    type: "post",
    key: ["generateImage"],
    path: ApiRoutes.generateImage,
  });
  const styleOptions = [
    { value: "NO Style", label: "Natural (No Style)" },
    { value: "photorealistic", label: "Photorealistic" },
    { value: "digital art", label: "Digital Art" },
    { value: "oil painting", label: "Oil Painting" },
    { value: "watercolor", label: "Watercolor" },
    { value: "anime", label: "Anime" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "steampunk", label: "Steampunk" },
    { value: "fantasy art", label: "Fantasy Art" },
    { value: "minimalist", label: "Minimalist" },
    { value: "vintage", label: "Vintage" },
    { value: "pop art", label: "Pop Art" },
    { value: "surrealism", label: "Surrealism" },
    { value: "impressionist", label: "Impressionist" },
    { value: "sketch", label: "Sketch" },
    { value: "custom", label: "Custom Style" },
  ];

  const resolutionOptions = [
    { value: "512x512", label: "512×512 (Square)" },
    { value: "1024x1024", label: "1024×1024 (Square)" },
    { value: "1024x768", label: "1024×768 (Landscape)" },
    { value: "768x1024", label: "768×1024 (Portrait)" },
    { value: "1920x1080", label: "1920×1080 (Full HD)" },
    { value: "Custom", label: "Custom" },
  ];

  const aspectRatioOptions = [
    { value: "Custom", label: "Default" },
    { value: "16:9", label: "16:9 (Widescreen)" },
    { value: "4:3", label: "4:3 (Standard)" },
    { value: "3:2", label: "3:2 (Photography)" },
    { value: "1:1", label: "1:1 (Square)" },
    { value: "9:16", label: "9:16 (Vertical)" },
  ];

  const handleGenerate = async () => {
    if (
      prompt.trim() &&
      (tokens > 0 || (useGeminiApi && geminiApiKey.trim()))
    ) {
      setIsGenerating(true);
      const startTime = Date.now();
      const image = await getGeneratedImage.mutateAsync({
        prompt: prompt,
        options: {
          style: selectedStyle,
          resolution:
            selectedResolution === "Custom"
              ? customResolution
              : selectedResolution,
          aspectRatio: selectedAspectRatio,
        },
        apiKey: user?.apiKey || null,
      });
      if (getGeneratedImage.isSuccess || image.status === 200) {
        setIsGenerating(false);
        if (!useGeminiApi) {
          setTokens(image.data.data.credits);
          console.log("credits", image.data.data.credits);
          setPublicID(image.data.data.public_id);
          userStore.updateUser({ genCredits: image.data.data.credits });
        }
        console.log("image", image.data.data.image);
        console.log(image.data.data);
        if (
          image?.data?.data?.image &&
          Array.isArray(image.data.data?.image) &&
          image.data.data?.image.length > 0
        ) {
          const base64Image = image.data.data?.image[1]?.inlineData.data;
          console.log("Base64 image data:", base64Image);
          if (base64Image) {
            const imageUrl = base64ToBlobUrl(base64Image);
            setGeneratedImage(imageUrl);
            setGenerationTime(Date.now() - startTime);
            const imageDimensions = await getImageDimensions(imageUrl);
            setCurrentResolution(imageDimensions);
            const historyItem = {
              id: Date.now(),
              url: imageUrl,
              prompt: prompt,
              style: selectedStyle === "custom" ? customStyle : selectedStyle,
              resolution: imageDimensions,
              aspectRatio: selectedAspectRatio,
              timestamp: new Date().toISOString(),
              generationTime: Date.now() - startTime,
              public_id: image.data.data.public_id || "",
              contributed: false,
            };
            await saveImageWithMeta(historyItem, base64Image, user?._id ?? "");
            setImageHistory((prev) => [historyItem, ...prev]);
          } else {
            console.warn("Base64 image data is missing");
            toast({
              title: "Error",
              description: "Failed to generate image",
              duration: 5000,
              variant: "error",
            });
            setGeneratedImage(null);
            setGenerationTime(0);
          }
        } else {
          console.warn("No image data returned from API");
          toast({
            title: "Error",
            description: "Failed to generate image",
            duration: 5000,
            variant: "error",
          });
          setGeneratedImage(null);
          setGenerationTime(0);
        }
      }
      if (getGeneratedImage.isError) {
        setIsGenerating(false);
        setGeneratedImage(null);
        setGenerationTime(0);
        toast({
          title: "Error",
          description: getErrorMsg(getGeneratedImage),
          duration: 5000,
          variant: "error",
        });
      }
    }
  };

  function base64ToBlobUrl(base64: string, mimeType = "image/png"): string {
    const byteString = atob(base64); // Decode base64 string
    const byteArray = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    return url;
  }

  const handleSaveApiKey = () => {
    if (geminiApiKey.trim()) {
      userStore.updateUser({ apiKey: geminiApiKey });
      setUseGeminiApi(true);
      setShowApiKeyInput(false);
    }
  };

  const handleRemoveApiKey = () => {
    userStore.updateUser({ apiKey: "" });
    setGeminiApiKey("");
    setUseGeminiApi(false);
    setShowApiKeyInput(false);
  };
  const handleClearHistory = async () => {
    if (!user?._id) return;

    // Only remove non-saved images
    const filteredHistory = imageHistory.filter((item) =>
      savedImages.has(item.id),
    );
    setImageHistory(filteredHistory);
    setSelectedHistoryImage(null);

    // Remove non-saved images from IndexedDB
    const keys = await getUserImageKeys(user?._id);
    for (const key of keys) {
      const record = await getUserImageRecord(key, user?._id);
      if (record && !savedImages.has(record.id.replace(`${user?._id}_`, ""))) {
        await imageDB.delete("images", key);
      }
    }

    // Update localStorage with only saved images
    if (filteredHistory.length > 0) {
      localStorage.setItem(
        `imageHistory_${user?._id}`,
        JSON.stringify(filteredHistory),
      );
    } else {
      localStorage.removeItem(`imageHistory_${user?._id}`);
    }

    toast({
      title: "History Cleared",
      description: `Cleared ${imageHistory.length - filteredHistory.length} images. Saved images preserved.`,
      duration: 3000,
      variant: "info",
    });
  };

  const handleViewHistoryImage = (historyItem: HistoryItem) => {
    setSelectedHistoryImage(historyItem);
    setGeneratedImage(historyItem.url);
  };
  const handleRegenerate = (historyItem: HistoryItem) => {
    setPrompt(historyItem.prompt);
    setSelectedStyle(historyItem.style);
    setSelectedResolution(historyItem.resolution);
    setSelectedAspectRatio(historyItem.aspectRatio);
    setCurrentTab("generate");
  };
  const tokenPercentage = (tokens / maxTokens) * 100;

  const examplePrompts = useMemo(() => {
    return getRandomPrompts(6);
  }, []);
  const getImageDimensions = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        resolve(`${img.width}x${img.height}`);
      };
      img.onerror = reject;
    });
  };

  const handleCustomResolutionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // Format as XXXX-XXXX (add dash after 4 digits)
    if (value.length > 4) {
      value = value.slice(0, 4) + "x" + value.slice(4, 8);
    }

    setCustomResolution(value);

    // Update selectedResolution when we have a complete format
    if (value.includes("x") && value.split("x")[1].length > 0) {
      const [width, height] = value.split("x");
      if (width && height && width.length >= 3 && height.length >= 3) {
        setCustomResolution(`${width}x${height}`);
      }
    }
  };

  const downloadImage = async (imageUrl: string, filename?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
        duration: 3000,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        duration: 3000,
        variant: "error",
      });
      console.error("Failed to download image:", error);
    }
  };

  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      toast({
        title: "Success",
        description: "Image copied to clipboard!",
        duration: 3000,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy image to clipboard",
        duration: 3000,
        variant: "error",
      });
      console.error("Failed to copy image to clipboard:", error);
    }
  };

  const saveImage = (imageId: number) => {
    const newSavedImages = new Set(savedImages);
    if (savedImages.has(imageId)) {
      newSavedImages.delete(imageId);
      toast({
        title: "Removed",
        description: "Image removed from saved collection",
        duration: 3000,
        variant: "attention",
      });
    } else {
      newSavedImages.add(imageId);
      toast({
        title: "Saved",
        description: "Image saved to your collection",
        duration: 3000,
        variant: "attention",
      });
    }
    setSavedImages(newSavedImages);
  };

  const shareImage = (imageUrl: string) => {
    setImageToShare(imageUrl);
    setShareDialogOpen(true);
  };

  const handleNativeShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `ai-generated-${Date.now()}.png`, {
          type: blob.type,
        });

        await navigator.share({
          title: "AI Generated Image",
          text: "Check out this AI generated image!",
          files: [file],
        });
      } catch (error) {
        // Fallback to copying image URL if native share fails
        copyImageToClipboard(imageUrl);
        console.error("Native share failed:", error);
      }
    } else {
      copyImageToClipboard(imageUrl);
    }
  };
  const contributeImage = useApiPost({
    type: "post",
    key: ["contributeImage"],
    path: ApiRoutes.addToGallery,
    sendingFile: false,
  });
  const registerCreator = useApiPost({
    type: "post",
    key: ["registerCreator"],
    path: ApiRoutes.registerCreator,
    sendingFile: false,
  });
  const handleContributeImage = async () => {
    // Get the current image's public_id and check if already contributed
    const currentImage = imageHistory.find(
      (item) => item.url === generatedImage,
    );

    const currentImagePublicId = currentImage?.public_id || publicID;

    if (!currentImagePublicId) {
      toast({
        title: "Error",
        description: "No image available to contribute",
        duration: 3000,
        variant: "error",
      });
      return;
    }

    // Check if already contributed
    if (currentImage?.contributed) {
      toast({
        title: "Already Contributed",
        description: "This image has already been contributed to the gallery",
        duration: 3000,
        variant: "info",
      });
      return;
    }

    try {
      if (!user?.isCreator) {
        const isCreator = await registerCreator.mutateAsync({});
        if (isCreator.status === 200) {
          userStore.updateUser({ isCreator: true });
          const res = await contributeImage.mutateAsync({
            public_id: currentImagePublicId,
          });

          if (res.status === 200) {
            toast({
              title: "Success",
              description: "Image contributed to gallery successfully!",
              duration: 3000,
              variant: "success",
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Cannot process your contribution right now",
            duration: 3000,
            variant: "error",
          });
        }
      } else {
        const res = await contributeImage.mutateAsync({
          public_id: currentImagePublicId,
        });

        if (res.status === 200) {
          toast({
            title: "Success",
            description: "Image contributed to gallery successfully!",
            duration: 3000,
            variant: "success",
          });
        }
      }
      // Update the imageHistory state
      const updatedHistory = imageHistory.map((item) => {
        if (item.public_id === currentImagePublicId) {
          return { ...item, contributed: true };
        }
        return item;
      });

      setImageHistory(updatedHistory);

      // Update IndexedDB
      if (user?._id) {
        const keys = await getUserImageKeys(user?._id);
        for (const key of keys) {
          const record = await getUserImageRecord(key, user?._id);
          if (record && record.public_id === currentImagePublicId) {
            await imageDB.put("images", { ...record, contributed: true });
            break;
          }
        }

        // Update localStorage
        localStorage.setItem(
          `imageHistory_${user?._id}`,
          JSON.stringify(updatedHistory),
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMsg(contributeImage),
        duration: 3000,
        variant: "error",
      });
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="w-full flex items-center justify-center">
        <RainbowButton
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
          variant={"outline"}
        >
          <Star className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            AI-Powered Image Generation
          </span>
        </RainbowButton>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* API Key Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <Card className="border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        Free Usage with Gemini API
                      </h3>
                      {useGeminiApi && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {useGeminiApi
                        ? "Using your Gemini API key - unlimited generations!"
                        : "Enter your Gemini API key for unlimited free image generation"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {useGeminiApi ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKeyInput(true)}
                      >
                        Update Key
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveApiKey}
                      >
                        Remove Key
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setShowApiKeyInput(true)}
                      variant="outline"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Add API Key
                    </Button>
                  )}
                </div>
              </div>

              {/* API Key Input Section */}
              {showApiKeyInput && (
                <div className="mt-6 pt-6 border-t">
                  <div className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 flex gap-2 items-center justify-evenly p-4 rounded-2xl">
                    <Info className="h-8 w-8 text-blue-600 opacity-30" />
                    <div className="text-sm text-blue-800 dark:text-blue-200 flex flex-col">
                      <span>
                        <strong>Privacy Note:</strong> Your API key is stored
                        locally in your browser session and is never stored in
                        our servers or database.
                      </span>
                      <span>
                        It's only used to make direct requests to Google's
                        Gemini API
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Gemini API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your Gemini API key (AIza...)"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your free API key from{" "}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Google AI Studio
                        </a>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveApiKey}
                        disabled={!geminiApiKey.trim()}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Save & Use API Key
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowApiKeyInput(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Token Status - Only show if not using API key */}
        {!useGeminiApi && (
          <div className="max-w-6xl mx-auto mb-12">
            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Coins className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          Available Tokens
                        </h3>
                        <Badge variant="outline" className="font-mono">
                          {tokens}/{maxTokens}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Each generation costs 1 tokens • {tokens} remaining
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block w-48">
                    <Progress value={tokenPercentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto">
          <Tabs
            defaultValue="generate"
            className="space-y-6"
            value={currentTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="generate"
                className="flex items-center gap-2"
                onClick={() => setCurrentTab("generate")}
              >
                <Wand2 className="w-4 h-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2"
                onClick={() => setCurrentTab("history")}
              >
                <History className="w-4 h-4" />
                History ({imageHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Input Section - Spans 5 columns */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="border-2 shadow-xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Wand2 className="w-5 h-5 text-primary" />
                        </div>
                        Describe Your Vision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="A majestic dragon soaring through storm clouds, lightning illuminating its scales, digital art masterpiece..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-32 resize-none text-base leading-relaxed"
                          maxLength={500}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            Be descriptive and specific for best results
                          </span>
                          <span className="font-mono">{prompt.length}/500</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Style Options */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Style & Options
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="style">Art Style</Label>
                            <Select
                              value={selectedStyle}
                              onValueChange={setSelectedStyle}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a style" />
                              </SelectTrigger>
                              <SelectContent>
                                {styleOptions.map((style) => (
                                  <SelectItem
                                    key={style.value}
                                    value={style.value}
                                  >
                                    {style.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedStyle === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="customStyle">Custom Style</Label>
                              <Input
                                id="customStyle"
                                placeholder="Enter your custom style description"
                                value={customStyle}
                                onChange={(e) => setCustomStyle(e.target.value)}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="resolution">Resolution</Label>
                              <Select
                                value={selectedResolution}
                                onValueChange={setSelectedResolution}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {resolutionOptions.map((res) => (
                                    <SelectItem
                                      key={res.value}
                                      value={res.value}
                                    >
                                      {res.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedResolution === "Custom" && (
                                <div className="space-y-2">
                                  <Label htmlFor="customRes">
                                    Custom Resolution
                                  </Label>
                                  <Input
                                    id="customRes"
                                    type="text"
                                    placeholder="1024x1024"
                                    value={customResolution}
                                    onChange={handleCustomResolutionChange}
                                    className="font-mono text-center tracking-wider"
                                    maxLength={9} // XXXX-XXXX format
                                  />
                                  <p className="text-xs text-muted-foreground text-center">
                                    Enter width and height (e.g., 1024x1024)
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                              <Select
                                value={selectedAspectRatio}
                                onValueChange={setSelectedAspectRatio}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {aspectRatioOptions.map((ratio) => (
                                    <SelectItem
                                      key={ratio.value}
                                      value={ratio.value}
                                    >
                                      {ratio.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Example Prompts
                        </h4>
                        <div className="space-y-2">
                          {examplePrompts.map((example, index) => (
                            <button
                              key={index}
                              onClick={() => setPrompt(example)}
                              className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                  {example}
                                </span>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={
                          !prompt.trim() ||
                          isGenerating ||
                          (!useGeminiApi && tokens < 1)
                        }
                        size="lg"
                        className="w-full h-14 text-base font-medium"
                      >
                        {isGenerating ? (
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Generating Image...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Send className="w-5 h-5" />
                            Generate Image
                            {!useGeminiApi && (
                              <Badge variant="secondary" className="ml-2">
                                -1 token
                              </Badge>
                            )}
                            {useGeminiApi && (
                              <Badge
                                variant="secondary"
                                className="ml-2 bg-green-100 text-green-700"
                              >
                                Free
                              </Badge>
                            )}
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Output Section - Spans 7 columns */}
                <div className="lg:col-span-7">
                  <Card className="border-2 shadow-xl h-full">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        Generated Artwork
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="aspect-square rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30">
                        {isGenerating ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8">
                            <div className="relative mb-8">
                              <div className="w-24 h-24 border-4 border-muted border-t-primary rounded-full animate-spin" />
                              <div className="absolute inset-2 w-16 h-16 border-4 border-muted border-b-primary rounded-full animate-spin" />
                              <div className="absolute inset-4 w-8 h-8 border-4 border-muted border-l-primary rounded-full animate-spin" />
                            </div>
                            <div className="text-center space-y-3">
                              <h3 className="text-xl font-semibold">
                                Creating Your Masterpiece
                              </h3>
                              <p className="text-muted-foreground max-w-sm">
                                {useGeminiApi
                                  ? "Using your Gemini API for generation. This usually takes 30-60 seconds."
                                  : "Our AI is carefully crafting your vision. This usually takes 30-60 seconds."}
                              </p>
                              <div className="flex justify-center gap-1 mt-4">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : generatedImage ? (
                          <div className="relative group h-full">
                            <img
                              src={generatedImage}
                              alt="AI generated artwork"
                              className="w-full h-full object-cover rounded-lg transition-all duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
                              <div className="p-6 w-full">
                                <div className="flex flex-wrap gap-3">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black"
                                    onClick={() =>
                                      downloadImage(
                                        generatedImage,
                                        `ai-generated-${Date.now()}.png`,
                                      )
                                    }
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black"
                                    onClick={() => shareImage(generatedImage)}
                                  >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black"
                                    onClick={() => {
                                      const currentImageId = imageHistory.find(
                                        (item) => item.url === generatedImage,
                                      )?.id;
                                      if (currentImageId)
                                        saveImage(currentImageId);
                                    }}
                                  >
                                    {(() => {
                                      const currentImageId = imageHistory.find(
                                        (item) => item.url === generatedImage,
                                      )?.id;
                                      const isSaved =
                                        currentImageId &&
                                        savedImages.has(currentImageId);
                                      return (
                                        <>
                                          {isSaved ? (
                                            <BookmarkCheck className="w-4 h-4 mr-2" />
                                          ) : (
                                            <Bookmark className="w-4 h-4 mr-2" />
                                          )}
                                          {isSaved ? "Saved" : "Save"}
                                        </>
                                      );
                                    })()}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black"
                                    onClick={() =>
                                      copyImageToClipboard(generatedImage)
                                    }
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6 border-4 border-dashed border-border">
                              <ImageIcon className="w-16 h-16 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">
                              Ready to Create
                            </h3>
                            <p className="text-muted-foreground max-w-sm leading-relaxed mb-6">
                              Enter a detailed description of the image you want
                              to generate. The more specific you are, the better
                              the results will be.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Zap className="w-4 h-4" />
                              <span>
                                {useGeminiApi
                                  ? "Powered by Google Gemini API"
                                  : "Powered by advanced AI technology"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Image Stats */}
                      {generatedImage && !isGenerating && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">
                                {currentResolution === ""
                                  ? selectedResolution
                                  : currentResolution}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Resolution
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {useGeminiApi ? "Free" : "1"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {useGeminiApi ? "Cost" : "Tokens Used"}
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {Math.round(generationTime / 1000)}s
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Generation Time
                              </div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">
                                {selectedStyle === "custom"
                                  ? "Custom"
                                  : selectedStyle || "Natural"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Style
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-around gap-4 items-center w-full h-max bg-[#ADD8E6] border-[#87CEEB] text-[#333333] rounded-xl my-4">
                        <Info className="w-8 h-8 text-[#729cac]" />
                        <div>
                          <div>Earn Free Credits by Contributing!</div>
                          <div>
                            Share your images to the gallery and get rewarded:
                          </div>
                          <div>
                            📸 0.5 credits for every image you contribute
                          </div>
                          <div>
                            ❤️ 1 credit for every 10 likes your images receive
                          </div>
                          <div>
                            Start uploading and watch your credits grow!
                          </div>
                        </div>
                      </div>
                      {generatedImage && !isGenerating && (
                        <div className="flex justify-center my-2">
                          <Button
                            className={`${
                              imageHistory.find(
                                (item) => item.url === generatedImage,
                              )?.contributed
                                ? "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                                : "bg-green-300 hover:bg-green-400 hover:scale-105"
                            }`}
                            onClick={handleContributeImage}
                            disabled={
                              contributeImage.isPending ||
                              imageHistory.find(
                                (item) => item.url === generatedImage,
                              )?.contributed
                            }
                          >
                            {contributeImage.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Contributing...
                              </>
                            ) : imageHistory.find(
                                (item) => item.url === generatedImage,
                              )?.contributed ? (
                              "Already Contributed"
                            ) : (
                              "Contribute to Gallery"
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="border-2 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <History className="w-5 h-5 text-primary" />
                      </div>
                      Generation History
                      <Badge variant="outline" className="ml-2">
                        {imageHistory.length} images
                      </Badge>
                    </CardTitle>
                    {imageHistory.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearHistory}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear History
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {imageHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <History className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        No Generation History
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Your generated images will appear here. Start creating
                        to build your collection!
                      </p>
                      <Button onClick={() => setCurrentTab("generate")}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Your First Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Selected Image Detail View */}
                      {selectedHistoryImage && (
                        <div className="border-2 border-primary/20 rounded-lg p-6 bg-primary/5">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="font-semibold text-lg">
                              Selected Image Details
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedHistoryImage(null)}
                            >
                              ×
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="aspect-square rounded-lg overflow-hidden border">
                              <img
                                src={selectedHistoryImage.url}
                                alt="Selected generated image"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                  Original Prompt
                                </Label>
                                <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">
                                  {selectedHistoryImage.prompt}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">
                                    Style
                                  </Label>
                                  <p className="font-medium">
                                    {selectedHistoryImage.style || "Natural"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">
                                    Resolution
                                  </Label>
                                  <p className="font-medium">
                                    {selectedHistoryImage.resolution}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">
                                    Generation Time
                                  </Label>
                                  <p className="font-medium">
                                    {Math.round(
                                      selectedHistoryImage.generationTime /
                                        1000,
                                    )}
                                    s
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">
                                    Date
                                  </Label>
                                  <p className="font-medium">
                                    {new Date(
                                      selectedHistoryImage.timestamp,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    downloadImage(
                                      selectedHistoryImage.url,
                                      `ai-generated-${selectedHistoryImage.id}.png`,
                                    )
                                  }
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyImageToClipboard(
                                      selectedHistoryImage.url,
                                    )
                                  }
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Prompt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRegenerate(selectedHistoryImage)
                                  }
                                >
                                  <Wand2 className="w-4 h-4 mr-2" />
                                  Regenerate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    saveImage(selectedHistoryImage.id)
                                  }
                                >
                                  {savedImages.has(selectedHistoryImage.id) ? (
                                    <>
                                      <BookmarkCheck className="w-4 h-4 mr-2" />
                                      Saved
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-4 h-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    shareImage(selectedHistoryImage.url)
                                  }
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleContributeImage}
                                  disabled={selectedHistoryImage?.contributed}
                                  className={
                                    selectedHistoryImage?.contributed
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                >
                                  {selectedHistoryImage?.contributed
                                    ? "Already Contributed"
                                    : "Contribute to Gallery"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* History Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageHistory.map((item) => (
                          <div
                            key={item.id}
                            className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                              selectedHistoryImage?.id === item.id
                                ? "border-primary shadow-lg"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => handleViewHistoryImage(item)}
                          >
                            <img
                              src={item.url}
                              alt="Generated image"
                              className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="text-center text-white p-4">
                                <Eye className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-xs font-medium">
                                  View Details
                                </p>
                              </div>
                            </div>

                            {/* Info Badge */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
                                {item.style || "Natural"}
                              </div>
                              {savedImages.has(item.id) && (
                                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center">
                                  <Bookmark className="w-3 h-3" />
                                </div>
                              )}
                              {item.contributed && (
                                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center">
                                  <Share2 className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            {/* Date Badge */}
                            <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share Image
                </DialogTitle>
                <DialogDescription>
                  Choose how you'd like to share your AI-generated image
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {imageToShare && (
                  <div className="aspect-square w-full max-w-48 mx-auto rounded-lg overflow-hidden border">
                    <img
                      src={imageToShare}
                      alt="Image to share"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => {
                      if (imageToShare) copyImageToClipboard(imageToShare);
                      setShareDialogOpen(false);
                    }}
                  >
                    <Copy className="w-6 h-6" />
                    <span className="text-xs">Copy Image</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => {
                      if (imageToShare) handleNativeShare(imageToShare);
                      setShareDialogOpen(false);
                    }}
                  >
                    <Share2 className="w-6 h-6" />
                    <span className="text-xs">Share via Apps</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => {
                      if (imageToShare)
                        downloadImage(
                          imageToShare,
                          `shared-ai-image-${Date.now()}.png`,
                        );
                      setShareDialogOpen(false);
                    }}
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-xs">Download</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => {
                      if (imageToShare && navigator.clipboard) {
                        navigator.clipboard.writeText(imageToShare);
                        toast({
                          title: "Success",
                          description: "Image URL copied to clipboard!",
                          duration: 3000,
                        });
                      }
                      setShareDialogOpen(false);
                    }}
                  >
                    <Copy className="w-6 h-6" />
                    <span className="text-xs">Copy URL</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
