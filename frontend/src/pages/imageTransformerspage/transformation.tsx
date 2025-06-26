import React, {
  useState,
  useRef,
  type ChangeEvent,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FlipHorizontal,
  FlipVertical,
  Download,
  Upload,
  Crop,
  Layers,
  Undo,
  Redo,
} from "lucide-react";
import pica from "pica";
import debounce from "lodash.debounce";
import { Dialog , DialogContent, DialogTrigger , DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormFieldComp from "../AuthPages/FormFieldComp";
import { useToast } from "@/hooks/use-toast";
import TemplatesPage from "./templates";
// Type definitions
interface RotationOptions {
  angle: number;
  flip: boolean;
  flop: boolean;
  autoRotate: boolean;
}

interface ResizeOptions {
  width: number;
  height: number;
  fit: "cover" | "contain" | "fill";
  position: string;
  socialPlatform: string;
}

interface ColorOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  effect: "none" | "grayscale" | "sepia" | "warm" | "cool" | "vintage";
}

interface FilterOptions {
  blur: number;
  sharpen: number;
}

interface BorderOptions {
  border: {
    width: number;
    color: string;
  };
  padding: {
    size: number;
    color: string;
  };
}

// Updated Type definitions
interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  zIndex: number;
  show: boolean;
  positionMode: "freehand" | "preset";
  presetPosition:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

interface BadgeOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  backgroundColor: string;
  textColor: string;
  rotation: number;
  zIndex: number;
  show: boolean;
  positionMode: "freehand" | "preset";
  presetPosition:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

interface CompositeOptions {
  textOverlays: TextOverlay[];
  badges: BadgeOverlay[];
}

interface OutputOptions {
  format: "jpeg" | "png" | "webp" | "avif";
  quality: number;
}

interface AllOptions {
  rotation: RotationOptions;
  resize: ResizeOptions;
  colors: ColorOptions;
  filters: FilterOptions;
  borders: BorderOptions;
  composite: CompositeOptions;
  output: OutputOptions;
}

interface SocialPreset {
  width: number;
  height: number;
  name: string;
}

type SocialPresets = Record<string, SocialPreset>;


interface HistoryState {
  options: AllOptions;
  timestamp: number;
}
interface Template {
  id: string;
  name: string;
  description:string;
  options: AllOptions;
  createdAt: Date;
}
const ImageEditor: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>(
    "https://picsum.photos/800/600",
  );
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
const [historyIndex, setHistoryIndex] = useState<number>(-1);
const [templates, setTemplates] = useState<Template[]>([]);

const {toast}=useToast()
const templateFormSchema=z.object({
    name:z.string().min(1),
    description:z.string().min(1)
  })
const templateForm=useForm({
  resolver:zodResolver(templateFormSchema),
  defaultValues:{
    name:"",
    description:""
  }
});

const handleTemplateSave=(data:z.infer<typeof templateFormSchema>)=>{
 const templateData:Template={
  id:Date.now().toString(),
  name:data.name,
  description:data.description,
  options:JSON.parse(JSON.stringify(options)),
  createdAt:new Date()
 }
 setTemplates((prev)=>[...prev,templateData])
 if(!localStorage.getItem("templates")){
  localStorage.setItem("templates",JSON.stringify([templateData]))
  toast({
        title:"Template added successfully",
        description:"Template added successfully to your local storage",
        duration:3000,
        variant:"success"
      })
 }
 else{
   const templates=JSON.parse(localStorage.getItem("templates")||"[]")
   if(templates.length===0){
     localStorage.setItem("templates",JSON.stringify([templateData]))
     toast({
        title:"Template added successfully",
        description:"Template added successfully to your local storage",
        duration:3000,
        variant:"success"
      })
   }
   else{
     localStorage.setItem("templates",JSON.stringify([...templates,templateData]))
     toast({
        title:"Template added successfully",
        description:"Template added successfully to your local storage",
        duration:3000,
        variant:"success"
      })
   }
 }
 
}
const handleDeleteTemplate=(id:string)=>{
  setTemplates((prev)=>{
    return prev.filter((template)=>template.id!==id)
  })
  if(localStorage.getItem("templates")){
    const templates=JSON.parse(localStorage.getItem("templates")||"[]")
    if(templates.length===0){
      toast({
        title:"Template not found",
        description:"No templates found in local storage",
        duration:3000,
        variant:"error"
      })
    }
    else{
      const template=templates.find((template:Template)=>template.id===id)
      if(template){
        localStorage.setItem("templates",JSON.stringify(templates.filter((template:Template)=>template.id!==id)))
        toast({
          title:"Template deleted successfully",
          description:"Template deleted successfully from your local storage",
          duration:3000,
          variant:"success"
        })
      }
      else{
        toast({
          title:"Template not found",
          description:"Template not found in local storage",
          duration:3000,
          variant:"error"
        })
      }
    }
  }
}
useEffect(()=>{
const templatesFromLocalStorage=JSON.parse(localStorage.getItem("templates")||"[]")
setTemplates(templatesFromLocalStorage)
},[])


  // State for all options
  // Updated initial state in useState
  const [options, setOptions] = useState<AllOptions>({
    rotation: {
      angle: 0,
      flip: false,
      flop: false,
      autoRotate: false,
    },
    resize: {
      width: 800,
      height: 600,
      fit: "cover",
      position: "center",
      socialPlatform: "custom",
    },
    colors: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      effect: "none",
    },
    filters: {
      blur: 0,
      sharpen: 0,
    },
    borders: {
      border: { width: 0, color: "#000000" },
      padding: { size: 0, color: "#ffffff" },
    },
    composite: {
      textOverlays: [],
      badges: [],
    },
    output: {
      format: "jpeg",
      quality: 90,
    },
  });


const handleApplyTemplate=(id:string)=>{
  if(templates.length===0){
    const templatesFromLocalStorage=JSON.parse(localStorage.getItem("templates")||"[]")
    if(templatesFromLocalStorage.length===0){
      toast({
        title: "Error",
        description: "No templates found",
        variant:"error",
        duration:5000
      })
    }
    else{
      templatesFromLocalStorage.filter((template:Template)=>template.id===id)
      setOptions(templatesFromLocalStorage[0].options)
      toast({
        title: "Template applied successfully",
        description: "Template applied successfully",
        variant:"success",
        duration:5000
      })
    }
  }
  else{
    const template=templates.find((template:Template)=>template.id===id)
    if(template){
      setOptions(template.options)
      toast({
        title: "Template applied successfully",
        description: "Template applied successfully",
        variant:"success",
        duration:5000
      })
    }
    else{
      toast({
        title: "Error",
        description: "Template not found",
        variant:"error",
        duration:5000
      })
    }
  }
}



  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: "move" | "rotate" | null;
    targetId: string | null;
    targetType: "text" | "badge" | null;
    startX: number;
    startY: number;
    overlayStartX: number;
    overlayStartY: number;
    startRotation: number;
  }>({
    isDragging: false,
    dragType: null,
    targetId: null,
    targetType: null,
    startX: 0,
    startY: 0,
    overlayStartX: 0,
    overlayStartY: 0,
    startRotation: 0,
  });

  const [originalImageDimensions, setOriginalImageDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 800, height: 600 });

  const fileInputRef = useRef<HTMLInputElement>(null);
 

  const saveToHistory = useCallback((newOptions: AllOptions) => {
  const newState: HistoryState = {
    options: JSON.parse(JSON.stringify(newOptions)), // Deep clone
    timestamp: Date.now()
  };

  setHistory(prev => {
    // Remove any future history if we're not at the end
    const newHistory = prev.slice(0, historyIndex + 1);
    
    // Add new state
    newHistory.push(newState);
    
    // Keep only last 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
      setHistoryIndex(prev => prev); // Don't change index since we removed from beginning
      return newHistory;
    }
    
    setHistoryIndex(newHistory.length - 1);
    return newHistory;
  });
}, [historyIndex]);
const debouncedSaveToHistory = useMemo(
  () => debounce(saveToHistory, 500),
  [saveToHistory]
);
// Initialize history with current state
useEffect(() => {
  if (history.length === 0) {
    saveToHistory(options);
  }
}, [options, history.length, saveToHistory]);


  // Social media presets
  const socialPresets: SocialPresets = {
    custom: { width: 800, height: 600, name: "Custom" },
    instagram_post: { width: 1080, height: 1080, name: "Instagram Post" },
    instagram_story: { width: 1080, height: 1920, name: "Instagram Story" },
    facebook_post: { width: 1200, height: 630, name: "Facebook Post" },
    twitter_post: { width: 1200, height: 675, name: "Twitter Post" },
    youtube_thumbnail: { width: 1280, height: 720, name: "YouTube Thumbnail" },
  };

  // Color effects
  const colorEffects: Record<ColorOptions["effect"], string> = {
    none: "None",
    grayscale: "Grayscale",
    sepia: "Sepia",
    warm: "Warm",
    cool: "Cool",
    vintage: "Vintage",
  };

  // Handle file upload
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalImage(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Load the image to get its dimensions
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const width = img.width;
      const height = img.height;

      setOriginalImageDimensions({ width, height });
      setOptions((prev) => ({
        ...prev,
        resize: {
          ...prev.resize,
          width,
          height,
        },
      }));
    };
  };

  // Handle social media preset change
  const resizeImageWithPica = useCallback(
    async (width: number, height: number, imageFile: File | null) => {
      if (!imageFile) return;

      setIsProcessing(true);

      try {
        const reader = new FileReader();

        reader.onload = () => {
          const imageUrl = reader.result as string;
          const img = new Image();
          img.src = imageUrl;

          img.onload = async () => {
            const inputCanvas = document.createElement("canvas");
            inputCanvas.width = img.width;
            inputCanvas.height = img.height;

            const ctx = inputCanvas.getContext("2d");
            if (!ctx) {
              setIsProcessing(false);
              return;
            }

            ctx.drawImage(img, 0, 0);

            const outputCanvas = document.createElement("canvas");
            outputCanvas.width = width;
            outputCanvas.height = height;

            const picaInstance = new pica();
            await picaInstance.resize(inputCanvas, outputCanvas);

            const blob = await picaInstance.toBlob(
              outputCanvas,
              "image/jpeg",
              0.9,
            );
            const previewUrl = URL.createObjectURL(blob);

            setImageUrl(previewUrl);
            setIsProcessing(false);
          };

          img.onerror = () => {
            console.error("Image load failed");
            setIsProcessing(false);
          };
        };

        reader.onerror = () => {
          console.error("File reading failed");
          setIsProcessing(false);
        };

        reader.readAsDataURL(imageFile);
      } catch (err) {
        console.error("Resize failed:", err);
        setIsProcessing(false);
      }
    },
    [],
  );

  // Create debounce on resize with stable reference
  const debouncedResize = useRef(
    debounce(async (width: number, height: number, file: File | null) => {
      await resizeImageWithPica(width, height, file);
    }, 300),
  ).current;

  // Trigger resize on width/height change if socialPlatform is 'custom'
  useEffect(() => {
    if (
      options.resize.socialPlatform === "custom" &&
      options.resize.width > 0 &&
      options.resize.height > 0
    ) {
      debouncedResize(
        options.resize.width,
        options.resize.height,
        originalImage,
      );
    }
  }, [
    options.resize.width,
    options.resize.height,
    options.resize.socialPlatform,
    originalImage,
    debouncedResize,
  ]);

  // Handle preset change (Instagram, Facebook, etc)
  const handleSocialPresetChange = async (preset: string) => {
    if (!preset || !socialPresets[preset]) return;

    const { width, height } = socialPresets[preset];

    setOptions((prev) => ({
      ...prev,
      resize: {
        ...prev.resize,
        width,
        height,
        socialPlatform: preset,
      },
    }));

    // Direct resize without debounce on preset change
    await resizeImageWithPica(width, height, originalImage);
  };

  // Update options helper
  const updateOptions = <K extends keyof AllOptions>(
    category: K,
    key: keyof AllOptions[K],
    value: AllOptions[K][keyof AllOptions[K]],
  ) => {
     const newOptions = {
    ...options,
    [category]: {
      ...options[category],
      [key]: value,
    },
  };
  
  setOptions(newOptions);
  debouncedSaveToHistory(newOptions);
  };

  // Generate CSS styles for preview
  const generatePreviewStyles = (): React.CSSProperties => {
    const { rotation, colors, filters, borders } = options;

    let transform = "";
    if (rotation.angle !== 0) transform += `rotate(${rotation.angle}deg) `;
    if (rotation.flip) transform += "scaleY(-1) ";
    if (rotation.flop) transform += "scaleX(-1) ";

    let filter = "";
    if (colors.brightness !== 1) filter += `brightness(${colors.brightness}) `;
    if (colors.contrast !== 1) filter += `contrast(${colors.contrast}) `;
    if (colors.saturation !== 1) filter += `saturate(${colors.saturation}) `;
    if (colors.hue !== 0) filter += `hue-rotate(${colors.hue}deg) `;
    if (filters.blur > 0) filter += `blur(${filters.blur}px) `;

    // Color effects
    if (colors.effect === "grayscale") filter += "grayscale(100%) ";
    if (colors.effect === "sepia") filter += "sepia(100%) ";
    if (colors.effect === "warm")
      filter += "sepia(30%) saturate(1.2) hue-rotate(15deg) ";
    if (colors.effect === "cool") filter += "hue-rotate(180deg) saturate(1.1) ";
    if (colors.effect === "vintage")
      filter += "sepia(50%) contrast(1.2) brightness(1.1) saturate(0.8) ";

    const borderStyle =
      borders.border.width > 0
        ? `${borders.border.width}px solid ${borders.border.color}`
        : "none";

    const padding =
      borders.padding.size > 0 ? `${borders.padding.size}px` : "0";
    const paddingBg = borders.padding.color;

    return {
      transform: transform.trim() || "none",
      filter: filter.trim() || "none",
      border: borderStyle,
      padding,
      backgroundColor: padding !== "0" ? paddingBg : "transparent",
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: options.resize.fit || "contain",
    };
  };
  // Helper functions for managing overlays
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getPresetPosition = (
    preset: string,
    containerWidth: number,
    containerHeight: number,
    elementWidth: number = 0,
    elementHeight: number = 0,
  ) => {
    const padding = 20;
    switch (preset) {
      case "top-left":
        return { x: padding, y: padding };
      case "top-center":
        return { x: (containerWidth - elementWidth) / 2, y: padding };
      case "top-right":
        return { x: containerWidth - elementWidth - padding, y: padding };
      case "center-left":
        return { x: padding, y: (containerHeight - elementHeight) / 2 };
      case "center":
        return {
          x: (containerWidth - elementWidth) / 2,
          y: (containerHeight - elementHeight) / 2,
        };
      case "center-right":
        return {
          x: containerWidth - elementWidth - padding,
          y: (containerHeight - elementHeight) / 2,
        };
      case "bottom-left":
        return { x: padding, y: containerHeight - elementHeight - padding };
      case "bottom-center":
        return {
          x: (containerWidth - elementWidth) / 2,
          y: containerHeight - elementHeight - padding,
        };
      case "bottom-right":
        return {
          x: containerWidth - elementWidth - padding,
          y: containerHeight - elementHeight - padding,
        };
      default:
        return { x: 50, y: 50 };
    }
  };

  // Add text overlay
  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: generateId(),
      text: "Sample Text",
      x: 50,
      y: 50,
      fontSize: 32,
      color: "#ffffff",
      rotation: 0,
      zIndex: options.composite.textOverlays.length + 1,
      show: true,
      positionMode: "freehand",
      presetPosition: "top-left",
    };

    const newOptions = {
    ...options,
    composite: {
      ...options.composite,
      textOverlays: [...options.composite.textOverlays, newOverlay],
    },
  };
  
  setOptions(newOptions);
  debouncedSaveToHistory(newOptions);
  };

  // Add badge overlay
  const addBadgeOverlay = () => {
    const newBadge: BadgeOverlay = {
      id: generateId(),
      text: "Badge",
      x: 50,
      y: 50,
      backgroundColor: "#ff0000",
      textColor: "#ffffff",
      rotation: 0,
      zIndex: options.composite.badges.length + 1,
      show: true,
      positionMode: "freehand",
      presetPosition: "top-right",
    };

   const newOptions = {
    ...options,
    composite: {
      ...options.composite,
      badges: [...options.composite.badges, newBadge],
    },
  };
  
  setOptions(newOptions);
  debouncedSaveToHistory(newOptions);
  };

  // Update text overlay
  const updateTextOverlay = useCallback(
    (id: string, updates: Partial<TextOverlay>) => {
      setOptions((prev) => ({
        ...prev,
        composite: {
          ...prev.composite,
          textOverlays: prev.composite.textOverlays.map((overlay) =>
            overlay.id === id ? { ...overlay, ...updates } : overlay,
          ),
        },
      }));
    },
    [],
  );

  // Update badge overlay
  const updateBadgeOverlay = useCallback(
    (id: string, updates: Partial<BadgeOverlay>) => {
      setOptions((prev) => ({
        ...prev,
        composite: {
          ...prev.composite,
          badges: prev.composite.badges.map((badge) =>
            badge.id === id ? { ...badge, ...updates } : badge,
          ),
        },
      }));
    },
    [],
  );

  // Remove overlays
  const removeTextOverlay = (id: string) => {
    const newOptions = {
    ...options,
    composite: {
      ...options.composite,
      textOverlays: options.composite.textOverlays.filter(
        (overlay) => overlay.id !== id,
      ),
    },
  };
  
  setOptions(newOptions);
  debouncedSaveToHistory(newOptions);
  };

  const removeBadgeOverlay = (id: string) => {
 const newOptions = {
    ...options,
    composite: {
      ...options.composite,
      badges: options.composite.badges.filter((badge) => badge.id !== id),
    },
  };
  
  setOptions(newOptions);
  debouncedSaveToHistory(newOptions);
  };
  // Reset all options
  // Updated reset function
  const resetOptions = () => {
    const resetOptionsItems = {
    rotation: { angle: 0, flip: false, flop: false, autoRotate: false },
    resize: {
      width: originalImageDimensions.width,
      height: originalImageDimensions.height,
      fit: "cover" as const,
      position: "center",
      socialPlatform: "custom",
    },
    colors: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      effect: "none" as const,
    },
    filters: { blur: 0, sharpen: 0 },
    borders: {
      border: { width: 0, color: "#000000" },
      padding: { size: 0, color: "#ffffff" },
    },
    composite: {
      textOverlays: [],
      badges: [],
    },
    output: { format: "jpeg" as const, quality: 90 },
  };
  
  setOptions(resetOptionsItems);
  saveToHistory(resetOptionsItems);
  };

  // Save/Export function


  const handleSave = async () => {
    if (!originalImage) {
      alert("Please upload an image first");
      return;
    }

    setIsProcessing(true);

    try {
      // Create a canvas for processing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Load the original image
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(originalImage);
      });

      // Set canvas dimensions to the target size
      canvas.width = options.resize.width;
      canvas.height = options.resize.height;

      // Clear canvas with padding color if padding is applied
      if (options.borders.padding.size > 0) {
        ctx.fillStyle = options.borders.padding.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Calculate image positioning and sizing based on fit mode
      const { width, height } = calculateImageBounds(
        img.width,
        img.height,
        options.resize.width - options.borders.padding.size * 2,
        options.resize.height - options.borders.padding.size * 2,
        options.resize.fit,
      );

      // Apply transformations with borders and padding
      ctx.save();

      // Move to center of canvas for rotation
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);

      // Apply rotation
      if (options.rotation.angle !== 0) {
        ctx.rotate((options.rotation.angle * Math.PI) / 180);
      }

      // Apply flipping
      if (options.rotation.flip || options.rotation.flop) {
        ctx.scale(
          options.rotation.flop ? -1 : 1,
          options.rotation.flip ? -1 : 1,
        );
      }

      // Now draw everything relative to the rotated center
      const rotatedWidth = options.resize.width;
      const rotatedHeight = options.resize.height;

      // Draw padding background (if any)
      if (options.borders.padding.size > 0) {
        ctx.fillStyle = options.borders.padding.color;
        ctx.fillRect(
          -rotatedWidth / 2,
          -rotatedHeight / 2,
          rotatedWidth,
          rotatedHeight,
        );
      }

      // Apply CSS filters by creating a temporary canvas with filters
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = width;
      tempCanvas.height = height;

      if (tempCtx) {
        // Build filter string
        let filterString = "";

        if (options.colors.brightness !== 1) {
          filterString += `brightness(${options.colors.brightness}) `;
        }
        if (options.colors.contrast !== 1) {
          filterString += `contrast(${options.colors.contrast}) `;
        }
        if (options.colors.saturation !== 1) {
          filterString += `saturate(${options.colors.saturation}) `;
        }
        if (options.colors.hue !== 0) {
          filterString += `hue-rotate(${options.colors.hue}deg) `;
        }
        if (options.filters.blur > 0) {
          filterString += `blur(${options.filters.blur}px) `;
        }

        // Apply color effects
        switch (options.colors.effect) {
          case "grayscale":
            filterString += "grayscale(100%) ";
            break;
          case "sepia":
            filterString += "sepia(100%) ";
            break;
          case "warm":
            filterString += "sepia(30%) saturate(1.2) hue-rotate(15deg) ";
            break;
          case "cool":
            filterString += "hue-rotate(180deg) saturate(1.1) ";
            break;
          case "vintage":
            filterString +=
              "sepia(50%) contrast(1.2) brightness(1.1) saturate(0.8) ";
            break;
        }

        // Apply filters to temp canvas
        tempCtx.filter = filterString.trim() || "none";
        tempCtx.drawImage(img, 0, 0, width, height);

        // Draw the filtered image centered with padding offset
        const imageX = -width / 2;
        const imageY = -height / 2;
        ctx.drawImage(tempCanvas, imageX, imageY);
      } else {
        // Fallback: draw without filters
        const imageX = -width / 2;
        const imageY = -height / 2;
        ctx.drawImage(img, imageX, imageY, width, height);
      }

      // Apply border (rotated with the image)
      if (options.borders.border.width > 0) {
        ctx.strokeStyle = options.borders.border.color;
        ctx.lineWidth = options.borders.border.width;
        const borderOffset = options.borders.border.width / 2;
        ctx.strokeRect(
          -rotatedWidth / 2 + borderOffset,
          -rotatedHeight / 2 + borderOffset,
          rotatedWidth - options.borders.border.width,
          rotatedHeight - options.borders.border.width,
        );
      }

      ctx.restore();

      // Add text overlay
      const sortedTextOverlays = options.composite.textOverlays
        .filter((overlay) => overlay.show)
        .sort((a, b) => a.zIndex - b.zIndex);

      for (const overlay of sortedTextOverlays) {
        ctx.save();

        let textX, textY;
        if (overlay.positionMode === "preset") {
          const pos = getPresetPosition(
            overlay.presetPosition,
            canvas.width,
            canvas.height,
          );
          textX = pos.x;
          textY = pos.y;
        } else {
          textX = overlay.x;
          textY = overlay.y;
        }

        // Apply rotation
        if (overlay.rotation !== 0) {
          ctx.translate(textX, textY);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          textX = 0;
          textY = 0;
        }

        ctx.fillStyle = overlay.color;
        ctx.font = `bold ${overlay.fontSize}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Add text shadow effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(overlay.text, textX, textY);

        ctx.restore();
      }

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Add badge overlays
      const sortedBadges = options.composite.badges
        .filter((badge) => badge.show)
        .sort((a, b) => a.zIndex - b.zIndex);

      for (const badge of sortedBadges) {
        ctx.save();

        const padding = 12;
        const fontSize = 14;

        ctx.font = `bold ${fontSize}px Arial`;
        const textMetrics = ctx.measureText(badge.text);
        const badgeWidth = textMetrics.width + padding * 2;
        const badgeHeight = fontSize + padding;

        let badgeX, badgeY;
        if (badge.positionMode === "preset") {
          const pos = getPresetPosition(
            badge.presetPosition,
            canvas.width,
            canvas.height,
            badgeWidth,
            badgeHeight,
          );
          badgeX = pos.x;
          badgeY = pos.y;
        } else {
          badgeX = badge.x;
          badgeY = badge.y;
        }

        // Apply rotation
        if (badge.rotation !== 0) {
          ctx.translate(badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
          ctx.rotate((badge.rotation * Math.PI) / 180);
          badgeX = -badgeWidth / 2;
          badgeY = -badgeHeight / 2;
        }

        // Draw badge background
        ctx.fillStyle = badge.backgroundColor;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Draw badge text
        ctx.fillStyle = badge.textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          badge.text,
          badgeX + badgeWidth / 2,
          badgeY + badgeHeight / 2,
        );

        ctx.restore();
      }

      // Convert to blob and download
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          `image/${options.output.format}`,
          options.output.quality / 100,
        );
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-image.${options.output.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Error saving image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to calculate image bounds based on fit mode
  const calculateImageBounds = (
    imgWidth: number,
    imgHeight: number,
    containerWidth: number,
    containerHeight: number,
    fit: ResizeOptions["fit"],
  ) => {
    let width, height, x, y;

    switch (fit) {
      case "cover": {
        // Scale to cover the entire container, cropping if necessary
        const coverScale = Math.max(
          containerWidth / imgWidth,
          containerHeight / imgHeight,
        );
        width = imgWidth * coverScale;
        height = imgHeight * coverScale;
        x = (containerWidth - width) / 2;
        y = (containerHeight - height) / 2;
        break;
      }

      case "contain": {
        // Scale to fit within container, maintaining aspect ratio
        const containScale = Math.min(
          containerWidth / imgWidth,
          containerHeight / imgHeight,
        );
        width = imgWidth * containScale;
        height = imgHeight * containScale;
        x = (containerWidth - width) / 2;
        y = (containerHeight - height) / 2;
        break;
      }

      case "fill": {
        // Stretch to fill the entire container
        width = containerWidth;
        height = containerHeight;
        x = 0;
        y = 0;
        break;
      }

      default: {
        // Default to contain
        const defaultScale = Math.min(
          containerWidth / imgWidth,
          containerHeight / imgHeight,
        );
        width = imgWidth * defaultScale;
        height = imgHeight * defaultScale;
        x = (containerWidth - width) / 2;
        y = (containerHeight - height) / 2;
      }
    }

    return { x, y, width, height };
  };
  const handleMouseDown = (
    e: React.MouseEvent,
    id: string,
    type: "text" | "badge",
    action: "move" | "rotate",
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const overlay =
      type === "text"
        ? options.composite.textOverlays.find((o) => o.id === id)
        : options.composite.badges.find((o) => o.id === id);

    if (!overlay) return;

    setDragState({
      isDragging: true,
      dragType: action,
      targetId: id,
      targetType: type,
      startX: e.clientX,
      startY: e.clientY,
      overlayStartX: overlay.x,
      overlayStartY: overlay.y,
      startRotation: overlay.rotation,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.targetId) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      if (dragState.dragType === "move") {
        const newX = dragState.overlayStartX + deltaX;
        const newY = dragState.overlayStartY + deltaY;

        if (dragState.targetType === "text") {
          updateTextOverlay(dragState.targetId, {
            x: Math.max(0, Math.min(800, newX)),
            y: Math.max(0, Math.min(600, newY)),
          });
        } else if (dragState.targetType === "badge") {
          updateBadgeOverlay(dragState.targetId, {
            x: Math.max(0, Math.min(800, newX)),
            y: Math.max(0, Math.min(600, newY)),
          });
        }
      } else if (dragState.dragType === "rotate") {
        const rotationDelta = deltaX;
        const newRotation = (dragState.startRotation + rotationDelta) % 360;

        if (dragState.targetType === "text") {
          updateTextOverlay(dragState.targetId, { rotation: newRotation });
        } else if (dragState.targetType === "badge") {
          updateBadgeOverlay(dragState.targetId, { rotation: newRotation });
        }
      }
    },
    [dragState, updateTextOverlay, updateBadgeOverlay],
  );

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      targetId: null,
      targetType: null,
      startX: 0,
      startY: 0,
      overlayStartX: 0,
      overlayStartY: 0,
      startRotation: 0,
    });
  }, []);

  // Add useEffect for mouse events:
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const undo = useCallback(() => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];
    setHistoryIndex(newIndex);
    setOptions(previousState.options);
  }
}, [history, historyIndex]);

// Redo function
const redo = useCallback(() => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];
    setHistoryIndex(newIndex);
    setOptions(nextState.options);
  }
}, [history, historyIndex]);
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);

  return (
    <>
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 p-2">
            Image Transformer
          </h1>
          <p className="text-slate-600">
            Transform your images with real-time preview
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crop className="w-5 h-5" />
                  Preview
                  {isProcessing && (
                    <Badge variant="secondary" className="ml-2">
                      Processing...
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="flex gap-2">
                  <Button
                  variant={"outline"}
                  size="sm"
                   onClick={undo}
      disabled={historyIndex <= 0}
      className={`${
        historyIndex <= 0
          ? ' text-gray-400 cursor-not-allowed'
          : ' text-white'
      }`}
      title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4 mr-2" />
                    Undo
                  </Button>
                  <Button
                  variant={"outline"}
                  size="sm"
                  onClick={redo}
      disabled={historyIndex >= history.length - 1}
      className={`px-3 py-2 rounded text-sm font-medium ${
        historyIndex >= history.length - 1
          ? 'text-gray-400 cursor-not-allowed'
          : ' text-white'
      }`}
      title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4 mr-2" />
                    Redo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetOptions}
                    disabled={isProcessing}
                  >
                    Reset
                  </Button>
                  <Button onClick={handleSave} disabled={isProcessing}>
                    <Download className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="relative bg-gray-100 rounded-lg overflow-hidden"
                  style={{ minHeight: "400px" }}
                >
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={generatePreviewStyles()}
                        className="rounded shadow-lg transition-all duration-300"
                        loading="lazy"
                      />

                      {/* Text Overlays */}
                      {options.composite.textOverlays
                        .filter((overlay) => overlay.show)
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((overlay) => (
                          <div
                            key={overlay.id}
                            className="absolute cursor-move select-none group"
                            style={{
                              left:
                                overlay.positionMode === "preset"
                                  ? `${getPresetPosition(overlay.presetPosition, 800, 600).x}px`
                                  : `${overlay.x}px`,
                              top:
                                overlay.positionMode === "preset"
                                  ? `${getPresetPosition(overlay.presetPosition, 800, 600).y}px`
                                  : `${overlay.y}px`,
                              fontSize: `${overlay.fontSize}px`,
                              color: overlay.color,
                              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                              fontWeight: "bold",
                              transform: `rotate(${overlay.rotation}deg)`,
                              zIndex: overlay.zIndex,
                              transformOrigin: "top left",
                            }}
                            onMouseDown={(e) =>
                              handleMouseDown(e, overlay.id, "text", "move")
                            }
                          >
                            {overlay.text}

                            {/* Control handles */}
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div
                                className="w-4 h-4 bg-blue-500 rounded-full cursor-grab border-2 border-white shadow-md"
                                onMouseDown={(e) =>
                                  handleMouseDown(
                                    e,
                                    overlay.id,
                                    "text",
                                    "rotate",
                                  )
                                }
                                title="Drag to rotate"
                              />
                            </div>
                            <div className="absolute -bottom-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div
                                className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-md"
                                title="Drag to move"
                              />
                            </div>
                          </div>
                        ))}

                      {/* Badge Overlays */}
                      {options.composite.badges
                        .filter((badge) => badge.show)
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((badge) => (
                          <div
                            key={badge.id}
                            className="absolute px-3 py-1 rounded text-sm font-bold cursor-move select-none group"
                            style={{
                              left:
                                badge.positionMode === "preset"
                                  ? `${getPresetPosition(badge.presetPosition, 800, 600).x}px`
                                  : `${badge.x}px`,
                              top:
                                badge.positionMode === "preset"
                                  ? `${getPresetPosition(badge.presetPosition, 800, 600).y}px`
                                  : `${badge.y}px`,
                              backgroundColor: badge.backgroundColor,
                              color: badge.textColor,
                              transform: `rotate(${badge.rotation}deg)`,
                              zIndex: badge.zIndex,
                              transformOrigin: "top left",
                            }}
                            onMouseDown={(e) =>
                              handleMouseDown(e, badge.id, "badge", "move")
                            }
                          >
                            {badge.text}

                            {/* Control handles */}
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div
                                className="w-4 h-4 bg-blue-500 rounded-full cursor-grab border-2 border-white shadow-md"
                                onMouseDown={(e) =>
                                  handleMouseDown(
                                    e,
                                    badge.id,
                                    "badge",
                                    "rotate",
                                  )
                                }
                                title="Drag to rotate"
                              />
                            </div>
                            <div className="absolute -bottom-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div
                                className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-md"
                                title="Drag to move"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="text-lg">
                    Image Controls
                    </span>
                    <Dialog>
                       <DialogTrigger>
                        <Button
                      size="sm"
                      className="text-white hover:bg-green-500 bg-transparent border-2 border-muted p-2 hover:scale-110"
                    >
                      Save Template
                    </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Template</DialogTitle>
                        <DialogDescription>
                          Save your current image controls as a template
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...templateForm}>
                        <form onSubmit={templateForm.handleSubmit(handleTemplateSave)}>
                         <FormFieldComp
                          form={templateForm}
                          name="name"
                          labelValue="Name"
                          descriptionValue="Enter your template name"
                          placeholderValue="Template name"
                          type="text"
                          className="my-6"
                         />
                         <FormFieldComp
                         form={templateForm}
                         name="description"
                         labelValue="Description"
                         descriptionValue="Enter your template description"
                         placeholderValue="Template description"
                         type="text"
                         className="my-6"
                         />
                        
                      <DialogFooter>
                        <DialogClose>
                        <span
                         
                         onClick={() => templateForm.reset()}
                         >
                          Cancel
                        </span>
                          </DialogClose>
                        <Button
                         type="submit"
                          variant="outline"
                        >
                          Save
                        </Button>
                      </DialogFooter>
</form>
                      </Form>
                    </DialogContent>
                    </Dialog>
                   
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="resize" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="resize" className="text-xs">
                      Size
                    </TabsTrigger>
                    <TabsTrigger value="transform" className="text-xs">
                      Transform
                    </TabsTrigger>
                    <TabsTrigger value="effects" className="text-xs">
                      Effects
                    </TabsTrigger>
                  </TabsList>

                  {/* Resize Tab */}
                  <TabsContent value="resize" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Social Media Preset
                      </Label>
                      <Select
                        value={options.resize.socialPlatform}
                        onValueChange={handleSocialPresetChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(socialPresets).map(
                            ([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                {preset.name}{" "}
                                {key !== "custom" &&
                                  `(${preset.width}×${preset.height})`}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm">Width</Label>
                        <Input
                          type="number"
                          value={options.resize.width}
                          onChange={(e) =>
                            updateOptions(
                              "resize",
                              "width",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={isProcessing}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Height</Label>
                        <Input
                          type="number"
                          value={options.resize.height}
                          onChange={(e) =>
                            updateOptions(
                              "resize",
                              "height",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Fit Mode</Label>
                      <Select
                        value={options.resize.fit}
                        onValueChange={(value: ResizeOptions["fit"]) =>
                          updateOptions("resize", "fit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="contain">Contain</SelectItem>
                          <SelectItem value="fill">Fill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Transform Tab */}
                  <TabsContent value="transform" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Rotation: {options.rotation.angle}°
                      </Label>
                      <Slider
                        value={[options.rotation.angle]}
                        onValueChange={(value) =>
                          updateOptions("rotation", "angle", value[0])
                        }
                        max={360}
                        min={-360}
                        step={15}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={options.rotation.flip ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updateOptions(
                            "rotation",
                            "flip",
                            !options.rotation.flip,
                          )
                        }
                        className="flex-1"
                      >
                        <FlipVertical className="w-4 h-4 mr-2" />
                        Flip V
                      </Button>
                      <Button
                        variant={options.rotation.flop ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updateOptions(
                            "rotation",
                            "flop",
                            !options.rotation.flop,
                          )
                        }
                        className="flex-1"
                      >
                        <FlipHorizontal className="w-4 h-4 mr-2" />
                        Flip H
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Effects Tab */}
                  <TabsContent value="effects" className="space-y-4">
                    <div>
                      <Label className="text-sm">Color Effect</Label>
                      <Select
                        value={options.colors.effect}
                        onValueChange={(value: ColorOptions["effect"]) =>
                          updateOptions("colors", "effect", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(colorEffects).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">
                        Brightness: {options.colors.brightness.toFixed(1)}
                      </Label>
                      <Slider
                        value={[options.colors.brightness]}
                        onValueChange={(value) =>
                          updateOptions("colors", "brightness", value[0])
                        }
                        max={2}
                        min={0.1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">
                        Contrast: {options.colors.contrast.toFixed(1)}
                      </Label>
                      <Slider
                        value={[options.colors.contrast]}
                        onValueChange={(value) =>
                          updateOptions("colors", "contrast", value[0])
                        }
                        max={2}
                        min={0.1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">
                        Saturation: {options.colors.saturation.toFixed(1)}
                      </Label>
                      <Slider
                        value={[options.colors.saturation]}
                        onValueChange={(value) =>
                          updateOptions("colors", "saturation", value[0])
                        }
                        max={2}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">
                        Blur: {options.filters.blur}px
                      </Label>
                      <Slider
                        value={[options.filters.blur]}
                        onValueChange={(value) =>
                          updateOptions("filters", "blur", value[0])
                        }
                        max={20}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Additional Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Overlays & Borders
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Text Overlays */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Text Overlays</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addTextOverlay}
                    >
                      Add Text
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {options.composite.textOverlays.map((overlay, index) => (
                      <div
                        key={overlay.id}
                        className="border rounded-md p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={overlay.show}
                              onCheckedChange={(checked) =>
                                updateTextOverlay(overlay.id, { show: checked })
                              }
                            />
                            <Label className="text-xs">Layer {index + 1}</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <div>
                              <Label className="text-xs">Z-Index</Label>
                              <Input
                                type="number"
                                value={overlay.zIndex}
                                onChange={(e) =>
                                  updateTextOverlay(overlay.id, {
                                    zIndex: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-16 h-6 text-xs"
                                placeholder="Z"
                                min="1"
                                max="100"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeTextOverlay(overlay.id)}
                              className="h-6 w-6 p-0 mt-4"
                            >
                              ×
                            </Button>
                          </div>
                        </div>

                        {overlay.show && (
                          <>
                            <Input
                              placeholder="Enter text"
                              value={overlay.text}
                              onChange={(e) =>
                                updateTextOverlay(overlay.id, {
                                  text: e.target.value,
                                })
                              }
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Size</Label>
                                <Input
                                  type="number"
                                  value={overlay.fontSize}
                                  onChange={(e) =>
                                    updateTextOverlay(overlay.id, {
                                      fontSize: parseInt(e.target.value) || 32,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rotation</Label>
                                <Input
                                  type="number"
                                  value={overlay.rotation}
                                  onChange={(e) =>
                                    updateTextOverlay(overlay.id, {
                                      rotation: parseInt(e.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Color</Label>
                              <Input
                                type="color"
                                value={overlay.color}
                                onChange={(e) =>
                                  updateTextOverlay(overlay.id, {
                                    color: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Position Mode</Label>
                              <Select
                                value={overlay.positionMode}
                                onValueChange={(value: "freehand" | "preset") =>
                                  updateTextOverlay(overlay.id, {
                                    positionMode: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="freehand">
                                    Freehand
                                  </SelectItem>
                                  <SelectItem value="preset">Preset</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {overlay.positionMode === "preset" ? (
                              <div>
                                <Label className="text-xs">Position</Label>
                                <Select
                                  value={overlay.presetPosition}
                                  onValueChange={(value) =>
                                    updateTextOverlay(overlay.id, {
                                      presetPosition: value as any,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="top-left">
                                      Top Left
                                    </SelectItem>
                                    <SelectItem value="top-center">
                                      Top Center
                                    </SelectItem>
                                    <SelectItem value="top-right">
                                      Top Right
                                    </SelectItem>
                                    <SelectItem value="center-left">
                                      Center Left
                                    </SelectItem>
                                    <SelectItem value="center">
                                      Center
                                    </SelectItem>
                                    <SelectItem value="center-right">
                                      Center Right
                                    </SelectItem>
                                    <SelectItem value="bottom-left">
                                      Bottom Left
                                    </SelectItem>
                                    <SelectItem value="bottom-center">
                                      Bottom Center
                                    </SelectItem>
                                    <SelectItem value="bottom-right">
                                      Bottom Right
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">X Position</Label>
                                  <Input
                                    type="number"
                                    value={overlay.x}
                                    onChange={(e) =>
                                      updateTextOverlay(overlay.id, {
                                        x: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Y Position</Label>
                                  <Input
                                    type="number"
                                    value={overlay.y}
                                    onChange={(e) =>
                                      updateTextOverlay(overlay.id, {
                                        y: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Badge Overlays */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Badge Overlays
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addBadgeOverlay}
                    >
                      Add Badge
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {options.composite.badges.map((badge, index) => (
                      <div
                        key={badge.id}
                        className="border rounded-md p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={badge.show}
                              onCheckedChange={(checked) =>
                                updateBadgeOverlay(badge.id, { show: checked })
                              }
                            />
                            <Label className="text-xs">Badge {index + 1}</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <div>
                              <Label className="text-xs">Z-Index</Label>
                              <Input
                                type="number"
                                value={badge.zIndex}
                                onChange={(e) =>
                                  updateBadgeOverlay(badge.id, {
                                    zIndex: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-16 h-6 text-xs"
                                placeholder="Z"
                                min="1"
                                max="100"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeBadgeOverlay(badge.id)}
                              className="h-6 w-6 p-0 mt-4"
                            >
                              ×
                            </Button>
                          </div>
                        </div>

                        {badge.show && (
                          <>
                            <Input
                              placeholder="Badge text"
                              value={badge.text}
                              onChange={(e) =>
                                updateBadgeOverlay(badge.id, {
                                  text: e.target.value,
                                })
                              }
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Background</Label>
                                <Input
                                  type="color"
                                  value={badge.backgroundColor}
                                  onChange={(e) =>
                                    updateBadgeOverlay(badge.id, {
                                      backgroundColor: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Text Color</Label>
                                <Input
                                  type="color"
                                  value={badge.textColor}
                                  onChange={(e) =>
                                    updateBadgeOverlay(badge.id, {
                                      textColor: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Rotation</Label>
                              <Input
                                type="number"
                                value={badge.rotation}
                                onChange={(e) =>
                                  updateBadgeOverlay(badge.id, {
                                    rotation: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Position Mode</Label>
                              <Select
                                value={badge.positionMode}
                                onValueChange={(value: "freehand" | "preset") =>
                                  updateBadgeOverlay(badge.id, {
                                    positionMode: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="freehand">
                                    Freehand
                                  </SelectItem>
                                  <SelectItem value="preset">Preset</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {badge.positionMode === "preset" ? (
                              <div>
                                <Label className="text-xs">Position</Label>
                                <Select
                                  value={badge.presetPosition}
                                  onValueChange={(value) =>
                                    updateBadgeOverlay(badge.id, {
                                      presetPosition: value as any,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="top-left">
                                      Top Left
                                    </SelectItem>
                                    <SelectItem value="top-center">
                                      Top Center
                                    </SelectItem>
                                    <SelectItem value="top-right">
                                      Top Right
                                    </SelectItem>
                                    <SelectItem value="center-left">
                                      Center Left
                                    </SelectItem>
                                    <SelectItem value="center">
                                      Center
                                    </SelectItem>
                                    <SelectItem value="center-right">
                                      Center Right
                                    </SelectItem>
                                    <SelectItem value="bottom-left">
                                      Bottom Left
                                    </SelectItem>
                                    <SelectItem value="bottom-center">
                                      Bottom Center
                                    </SelectItem>
                                    <SelectItem value="bottom-right">
                                      Bottom Right
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">X Position</Label>
                                  <Input
                                    type="number"
                                    value={badge.x}
                                    onChange={(e) =>
                                      updateBadgeOverlay(badge.id, {
                                        x: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Y Position</Label>
                                  <Input
                                    type="number"
                                    value={badge.y}
                                    onChange={(e) =>
                                      updateBadgeOverlay(badge.id, {
                                        y: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Output Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Output Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Format</Label>
                  <Select
                    value={options.output.format}
                    onValueChange={(value: OutputOptions["format"]) =>
                      updateOptions("output", "format", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="avif">AVIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">
                    Quality: {options.output.quality}%
                  </Label>
                  <Slider
                    value={[options.output.quality]}
                    onValueChange={(value) =>
                      updateOptions("output", "quality", value[0])
                    }
                    max={100}
                    min={10}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  <TemplatesPage templates={templates}  handleDeleteTemplate={handleDeleteTemplate} handleApplyTemplate={handleApplyTemplate}/>
</>
  );
};

export default ImageEditor;
