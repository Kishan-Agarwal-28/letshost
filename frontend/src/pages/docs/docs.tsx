import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "@/components/ui/command";

import type { JSX } from "react/jsx-runtime";
import config from "@/config/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
// Type definitions
type ParamType = "color" | "text" | "url" | "mask" | "border" | "font";

interface BaseParam {
  name: string;
  param: string;
  description: string;
  default: string | number | null;
}

interface RangeParam extends BaseParam {
  range: [number, number];
  options?: never;
  type?: never;
}

interface OptionsParam extends BaseParam {
  options: readonly string[];
  range?: never;
  type?: never;
}

interface TypedParam extends BaseParam {
  type: ParamType;
  range?: never;
  options?: never;
}

type Param = RangeParam | OptionsParam | TypedParam;

type ParamWithCategory = Param & {
  name: string;
  param: string;
  description: string;
  category: CategoryName;
};

interface Category {
  id: string;
  label: string;
  count: number;
}

type ParamValues = Record<string, string | number>;

type CategoryName =
  | "adjustment"
  | "size"
  | "format"
  | "stylize"
  | "background"
  | "border"
  | "padding"
  | "rotation"
  | "mask"
  | "watermark"
  | "text"
  | "facedetection"
  | "noise"
  | "pdf"
  | "palette"
  | "animation"
  | "fillmode"
  | "trim";

// Comprehensive  parameters with proper typing
const Params: Record<CategoryName, readonly Param[]> = {
  adjustment: [
    {
      name: "brightness",
      param: "bri",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the brightness of the source image",
    },
    {
      name: "contrast",
      param: "con",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the contrast of the source image",
    },
    {
      name: "exposure",
      param: "exp",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the exposure of the source image",
    },
    {
      name: "gamma",
      param: "gam",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the gamma of the source image",
    },
    {
      name: "highlight",
      param: "high",
      range: [-100, 0],
      default: 0,
      description: "Adjusts the highlights of the source image",
    },
    {
      name: "hue shift",
      param: "hue",
      range: [0, 359],
      default: 0,
      description: "Adjusts the hue of the source image",
    },
    {
      name: "invert",
      param: "invert",
      range: [0, 1],
      default: 0,
      description: "Inverts the colors on the source image",
    },
    {
      name: "saturation",
      param: "sat",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the saturation of the source image",
    },
    {
      name: "shadow",
      param: "shad",
      range: [0, 100],
      default: 0,
      description: "Adjusts the shadows of the source image",
    },
    {
      name: "sharpen",
      param: "sharp",
      range: [0, 100],
      default: 0,
      description: "Adjusts the sharpness of the source image",
    },
    {
      name: "unsharp mask",
      param: "usm",
      range: [-100, 100],
      default: 0,
      description: "Applies unsharp mask to the source image",
    },
    {
      name: "unsharp mask radius",
      param: "usmrad",
      range: [0.5, 40],
      default: 2.5,
      description: "Specifies the radius for an unsharp mask operation",
    },
    {
      name: "vibrance",
      param: "vib",
      range: [-100, 100],
      default: 0,
      description: "Adjusts the vibrance of the source image",
    },
  ] as const,
  size: [
    {
      name: "width",
      param: "w",
      range: [1, 8192],
      default: null,
      description: "Adjusts the width of the output image",
    },
    {
      name: "height",
      param: "h",
      range: [1, 8192],
      default: null,
      description: "Adjusts the height of the output image",
    },
    {
      name: "aspect ratio",
      param: "ar",
      range: [0.01, 100],
      default: null,
      description:
        "Specifies an aspect ratio to maintain when resizing and cropping the image",
    },
    {
      name: "crop",
      param: "crop",
      options: [
        "top",
        "bottom",
        "left",
        "right",
        "faces",
        "focalpoint",
        "edges",
        "entropy",
      ],
      default: null,
      description: "Specifies how to crop an image",
    },
    {
      name: "fit",
      param: "fit",
      options: [
        "clamp",
        "clip",
        "crop",
        "facearea",
        "fill",
        "fillmax",
        "max",
        "min",
        "scale",
      ],
      default: "clip",
      description: "Specifies how to fit an image within the target dimensions",
    },
    {
      name: "fill",
      param: "fill",
      options: ["solid", "blur"],
      default: null,
      description:
        "Determines how to fill in additional space created by the fit setting",
    },
    {
      name: "device pixel ratio",
      param: "dpr",
      range: [0.75, 5],
      default: 1,
      description: "Adjusts the device-pixel ratio of the output image",
    },
  ] as const,
  format: [
    {
      name: "format",
      param: "fm",
      options: [
        "gif",
        "jp2",
        "jpg",
        "json",
        "jxr",
        "pjpg",
        "mp4",
        "png",
        "png8",
        "png32",
        "webm",
        "webp",
        "avif",
      ],
      default: null,
      description: "Changes the format of the output image",
    },
    {
      name: "quality",
      param: "q",
      range: [0, 100],
      default: 75,
      description: "Controls the output quality of lossy file formats",
    },
    {
      name: "lossless",
      param: "lossless",
      range: [0, 1],
      default: 0,
      description:
        "Specifies that the output image should be a lossless variant",
    },
    {
      name: "auto",
      param: "auto",
      options: ["compress", "enhance", "face", "redeye", "format"],
      default: null,
      description: "Applies automatic enhancements to images",
    },
    {
      name: "color space",
      param: "cs",
      options: ["srgb", "adobergb1998", "tinysrgb", "strip"],
      default: null,
      description: "Specifies the color space of the output image",
    },
  ] as const,
  stylize: [
    {
      name: "blur",
      param: "blur",
      range: [0, 2000],
      default: 0,
      description: "Applies a gaussian blur filter",
    },
    {
      name: "halftone",
      param: "htn",
      range: [0, 100],
      default: 0,
      description: "Applies a halftone effect to the source image",
    },
    {
      name: "monochrome",
      param: "mono",
      range: [0, 100],
      default: 0,
      description: "Applies a monochrome effect to the source image",
    },
    {
      name: "sepia",
      param: "sepia",
      range: [0, 100],
      default: 0,
      description: "Applies a sepia effect to the source image",
    },
    {
      name: "pixelate",
      param: "px",
      range: [0, 100],
      default: 0,
      description: "Applies a pixelation effect to the source image",
    },
    {
      name: "noise reduction",
      param: "nr",
      range: [-100, 100],
      default: 0,
      description: "Reduces noise in the source image",
    },
    {
      name: "noise reduction sharpen",
      param: "nrs",
      range: [-100, 100],
      default: 0,
      description:
        "Provides a normalized sharpening value that pairs with noise reduction",
    },
  ] as const,
  background: [
    {
      name: "background color",
      param: "bg",
      type: "color",
      default: null,
      description:
        "Colors the background of padded and partially-transparent images",
    },
    {
      name: "background removal",
      param: "bg-remove",
      range: [0, 1],
      default: 0,
      description: "Removes the background from the source image",
    },
  ] as const,
  border: [
    {
      name: "border",
      param: "border",
      type: "border",
      default: null,
      description: "Applies a border to the source image",
    },
    {
      name: "border radius",
      param: "border-radius",
      range: [0, 9999],
      default: 0,
      description: "Applies a border radius to the source image",
    },
    {
      name: "border radius inner",
      param: "border-radius-inner",
      range: [0, 9999],
      default: 0,
      description: "Sets the inner radius of the image's border in pixels",
    },
  ] as const,
  padding: [
    {
      name: "padding",
      param: "pad",
      range: [0, 9999],
      default: 0,
      description: "Pads an image",
    },
    {
      name: "padding top",
      param: "pad-top",
      range: [0, 9999],
      default: 0,
      description: "Sets the top padding of an image",
    },
    {
      name: "padding right",
      param: "pad-right",
      range: [0, 9999],
      default: 0,
      description: "Sets the right padding of an image",
    },
    {
      name: "padding bottom",
      param: "pad-bottom",
      range: [0, 9999],
      default: 0,
      description: "Sets the bottom padding of an image",
    },
    {
      name: "padding left",
      param: "pad-left",
      range: [0, 9999],
      default: 0,
      description: "Sets the left padding of an image",
    },
  ] as const,
  rotation: [
    {
      name: "rotation",
      param: "rot",
      range: [0, 359],
      default: 0,
      description: "Rotates an image by a specified number of degrees",
    },
    {
      name: "flip horizontal",
      param: "flip",
      options: ["h", "v", "hv"],
      default: null,
      description: "Flips an image on a specified axis",
    },
    {
      name: "orientation",
      param: "or",
      range: [0, 8],
      default: 0,
      description: "Changes the cardinal orientation of the image",
    },
  ] as const,
  mask: [
    {
      name: "mask",
      param: "mask",
      type: "mask",
      default: null,
      description:
        "Defines the type of mask and specifies the URL if that type is selected",
    },
    {
      name: "mask background",
      param: "mask-bg",
      type: "color",
      default: null,
      description:
        "Colors the background of the transparent mask area of images",
    },
  ] as const,
  watermark: [
    {
      name: "mark",
      param: "mark",
      type: "url",
      default: null,
      description: "Specifies the location of the watermark image",
    },
    {
      name: "mark width",
      param: "mark-w",
      range: [0, 9999],
      default: null,
      description: "Adjusts the width of the watermark image",
    },
    {
      name: "mark height",
      param: "mark-h",
      range: [0, 9999],
      default: null,
      description: "Adjusts the height of the watermark image",
    },
    {
      name: "mark fit",
      param: "mark-fit",
      options: [
        "clamp",
        "clip",
        "crop",
        "fill",
        "fillmax",
        "max",
        "min",
        "scale",
      ],
      default: "clip",
      description: "Specifies the fit mode for watermark images",
    },
    {
      name: "mark scale",
      param: "mark-scale",
      range: [0, 100],
      default: null,
      description: "Scales the watermark image by the specified percentage",
    },
    {
      name: "mark align",
      param: "mark-align",
      options: ["top", "middle", "bottom", "left", "center", "right"],
      default: "center",
      description: "Controls the alignment of the watermark image",
    },
    {
      name: "mark alpha",
      param: "mark-alpha",
      range: [0, 100],
      default: 100,
      description: "Adjusts the transparency of the watermark image",
    },
    {
      name: "mark base",
      param: "mark-base",
      options: ["img", "mark"],
      default: "img",
      description: "Changes the base URL of the watermark image",
    },
    {
      name: "mark padding",
      param: "mark-pad",
      range: [0, 9999],
      default: 5,
      description: "Applies padding to the watermark image",
    },
    {
      name: "mark rotation",
      param: "mark-rot",
      range: [0, 359],
      default: 0,
      description: "Rotates a watermark or overlay",
    },
  ] as const,
  text: [
    {
      name: "text",
      param: "txt",
      type: "text",
      default: null,
      description: "Sets the text string to render",
    },
    {
      name: "text size",
      param: "txtsize",
      range: [1, 300],
      default: 12,
      description: "Sets the font size of rendered text",
    },
    {
      name: "text color",
      param: "txtclr",
      type: "color",
      default: "000",
      description: "Specifies the color of rendered text",
    },
    {
      name: "text font",
      param: "txtfont",
      type: "font",
      default: null,
      description: "Selects a font for rendered text",
    },
    {
      name: "text align",
      param: "txtalign",
      options: ["top", "middle", "bottom", "left", "center", "right"],
      default: "bottom,right",
      description:
        "Sets the vertical and horizontal alignment of rendered text",
    },
    {
      name: "text padding",
      param: "txtpad",
      range: [0, 100],
      default: 10,
      description: "Specifies the padding around rendered text",
    },
    {
      name: "text shadow",
      param: "txtshad",
      range: [0, 10],
      default: 0,
      description: "Applies a shadow to rendered text",
    },
    {
      name: "text width",
      param: "txtwidth",
      range: [0, 9999],
      default: null,
      description: "Sets the width of rendered text",
    },
    {
      name: "text height",
      param: "txtheight",
      range: [0, 9999],
      default: null,
      description: "Sets the height of rendered text",
    },
    {
      name: "text fit",
      param: "txtfit",
      options: ["max"],
      default: null,
      description:
        "Specifies how to fit the rendered text within the specified dimensions",
    },
    {
      name: "text line height",
      param: "txtline",
      range: [0, 10],
      default: 1,
      description: "Sets the leading (line spacing) for rendered text",
    },
    {
      name: "text tracking",
      param: "txttrack",
      range: [-4, 8],
      default: 0,
      description: "Sets the tracking (letter spacing) for rendered text",
    },
  ] as const,
  facedetection: [
    {
      name: "face index",
      param: "faceindex",
      range: [1, 10000],
      default: 1,
      description: "Selects a face to crop to",
    },
    {
      name: "face padding",
      param: "facepad",
      range: [1, 10],
      default: 1,
      description: "Adjusts padding around a selected face",
    },
  ] as const,
  noise: [
    {
      name: "noise reduction",
      param: "nr",
      range: [-100, 100],
      default: 0,
      description: "Reduces noise in the source image",
    },
    {
      name: "noise reduction sharpen",
      param: "nrs",
      range: [-100, 100],
      default: 0,
      description:
        "Provides a normalized sharpening value that pairs with noise reduction",
    },
  ] as const,
  pdf: [
    {
      name: "page",
      param: "page",
      range: [1, 9999],
      default: 1,
      description: "Selects a page from a PDF for display",
    },
  ] as const,
  palette: [
    {
      name: "palette",
      param: "palette",
      options: ["css", "json"],
      default: null,
      description: "Extracts the dominant colors from an image",
    },
    {
      name: "colors",
      param: "colors",
      range: [1, 16],
      default: 6,
      description:
        "Specifies how many colors to include in a palette-extraction response",
    },
  ] as const,
  animation: [
    {
      name: "frame",
      param: "frame",
      range: [1, 9999],
      default: 1,
      description: "Selects a frame from an animated image sequence",
    },
    {
      name: "fps",
      param: "fps",
      range: [1, 60],
      default: null,
      description: "Specifies the output framerate of the generated image",
    },
  ] as const,
  fillmode: [
    {
      name: "fill color",
      param: "fill-color",
      type: "color",
      default: "fff",
      description:
        "Sets the fill color for images with additional space created by the fit setting",
    },
    {
      name: "fill",
      param: "fill",
      options: ["solid", "blur"],
      default: "solid",
      description:
        "Determines how to fill in additional space created by the fit setting",
    },
  ] as const,
  trim: [
    {
      name: "trim",
      param: "trim",
      options: ["auto", "color"],
      default: null,
      description: "Trims the source image",
    },
    {
      name: "trim color",
      param: "trim-color",
      type: "color",
      default: null,
      description: "Specifies a trim color on a trim operation",
    },
    {
      name: "trim mean difference",
      param: "trim-md",
      range: [0, 442],
      default: 11,
      description: "Specifies the mean difference on a trim operation",
    },
    {
      name: "trim color tolerance",
      param: "trim-tol",
      range: [0, 100],
      default: 0,
      description: "Specifies the tolerance for a trim operation",
    },
  ] as const,
} as const;

const Docs: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [paramValues, setParamValues] = useState<ParamValues>({});

  const baseImageUrl: string = config.BaseImageUrl;
  const showImageUrl: string = `{{baseImageUrl}}`;
  const [imageUrl, setImageUrl] = useState<string>(baseImageUrl);
  // Flatten all parameters for search
  const allParams = useMemo((): ParamWithCategory[] => {
    const params: ParamWithCategory[] = [];
    (Object.entries(Params) as [CategoryName, readonly Param[]][]).forEach(
      ([category, categoryParams]) => {
        categoryParams.forEach((param: Param) => {
          params.push({ ...param, category });
        });
      }
    );
    return params;
  }, []);

  // Filter parameters based on search
  const filteredParams = useMemo((): ParamWithCategory[] => {
    if (!searchQuery) return allParams;
    return allParams.filter(
      (param: ParamWithCategory) =>
        param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        param.param.toLowerCase().includes(searchQuery.toLowerCase()) ||
        param.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allParams]);
  // useEffect(() => {
  //   // console.log("Search query:", searchQuery);
  //   // console.log("Filtered results:", filteredParams);
  // }, [searchQuery, filteredParams]);

  // Categories for filtering
  const categories = useMemo(
    (): Category[] => [
      { id: "all", label: "All Parameters", count: allParams.length },
      ...(Object.entries(Params) as [CategoryName, readonly Param[]][]).map(
        ([key, params]) => ({
          id: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          count: params.length,
        })
      ),
    ],
    [allParams.length]
  );

  useEffect(() => {
    const updateImageUrl = () => {
      const params = new URLSearchParams();
      Object.entries(paramValues).forEach(([param, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          params.append(param, value.toString());
        }
      });
      const queryString = params.toString();
      setImageUrl(
        queryString ? `${baseImageUrl}?${queryString}` : baseImageUrl
      );
    };

    const debouncedUpdate = setTimeout(updateImageUrl, 300);
    return () => clearTimeout(debouncedUpdate);
  }, [paramValues]);

  const handleParamChange = (param: string, value: string | number): void => {
    setParamValues((prev: ParamValues) => ({
      ...prev,
      [param]: value,
    }));
  };

  const getShowImageUrl = (): string => {
    const params = new URLSearchParams();
    Object.entries(paramValues).forEach(([param, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(param, value.toString());
      }
    });
    const queryString = params.toString();
    return queryString ? `${showImageUrl}?${queryString}` : showImageUrl;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderParamInput = (param: Param): JSX.Element => {
    if ("range" in param && param.range) {
      const currentValue = paramValues[param.param] as number | undefined;
      const defaultValue =
        typeof param.default === "number" ? param.default : param.range[0];
      const value = currentValue ?? defaultValue;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Value: {value}</span>
            <span className="text-gray-500">
              Range: {param.range[0]} - {param.range[1]}
            </span>
          </div>
          <Slider
            value={[value]}
            onValueChange={([newValue]: number[]) =>
              handleParamChange(param.param, newValue)
            }
            min={param.range[0]}
            max={param.range[1]}
            step={param.range[1] > 100 ? 1 : 0.1}
            className="w-full"
          />
        </div>
      );
    } else if ("options" in param && param.options) {
      return (
        <select
          value={(paramValues[param.param] as string) || ""}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleParamChange(param.param, e.target.value)
          }
          className="w-full p-2 border rounded "
        >
          <option value="" className="text-black">
            Select option
          </option>
          {param.options.map((option: string) => (
            <option key={option} value={option} className="text-black">
              {option}
            </option>
          ))}
        </select>
      );
    } else if ("type" in param && param.type === "color") {
      const colorValue = (paramValues[param.param] as string) || "000000";
      const hexValue = colorValue.startsWith("#")
        ? colorValue.slice(1)
        : colorValue;

      return (
        <div className="flex space-x-2">
          <input
            type="color"
            value={`#${hexValue}`}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleParamChange(param.param, e.target.value.slice(1))
            }
            className="w-12 h-8 border rounded"
          />
          <Input
            placeholder="Hex color (e.g., ff0000)"
            value={hexValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleParamChange(param.param, e.target.value)
            }
            className="flex-1"
          />
        </div>
      );
    } else {
      return (
        <Input
          placeholder={`Enter ${param.name}`}
          value={(paramValues[param.param] as string) || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleParamChange(param.param, e.target.value)
          }
          className="w-full"
        />
      );
    }
  };

  const handleCategoryClick = (categoryId: string): void => {
    setSelectedCategory(categoryId);
  };

  const handleSearchSelect = (param: ParamWithCategory): void => {
    setSearchQuery("");
    setSearchOpen(false);
    document
      .getElementById(`param-${param.param}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-muted-foreground">
            Image Rendering API Documentation
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive documentation for all image transformation parameters
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="gap-10 "
          >
            <Search className="w-4 h-4" />
            Search
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto ">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput
            placeholder="Search transformations....."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No transformations found.</CommandEmpty>
            <CommandGroup heading="Transformations">
              {filteredParams.slice(0, 8).map((param: ParamWithCategory) => (
                <CommandItem
                  key={param.param}
                  value={`${param.name} ${param.param} ${param.description}`}
                  onSelect={() => handleSearchSelect(param)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <code className="text-sm px-2 py-1 rounded font-mono">
                        ?{param.param}=
                      </code>
                      <span>{param.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {param.description}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category: Category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "secondary"}
            className="cursor-pointer hover:bg-gray-200"
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.label} ({category.count})
          </Badge>
        ))}
      </div>

      {/* Parameters documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Parameters</h2>

          {(Object.entries(Params) as [CategoryName, readonly Param[]][])
            .filter(
              ([category]) =>
                selectedCategory === "all" || selectedCategory === category
            )
            .map(([category, params]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-lg font-medium capitalize text-blue-600">
                  {category}
                </h3>

                <Accordion type="single" collapsible className="w-full">
                  {params.map((param: Param) => (
                    <AccordionItem
                      key={param.param}
                      value={param.param}
                      id={`param-${param.param}`}
                    >
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3">
                          <code className="text-sm  px-2 py-1 rounded font-mono">
                            ?{param.param}=
                          </code>
                          <span>{param.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <p className="text-gray-600">{param.description}</p>

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">
                                Try it out:
                              </label>
                              {renderParamInput(param)}
                            </div>

                            {param.default !== null && (
                              <p className="text-xs text-gray-500">
                                Default: {param.default}
                              </p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
        </div>

        {/* Live preview */}
        <div className="space-y-4 sticky top-6">
          <h2 className="text-xl font-semibold">Live Preview</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Original</h3>
                <div className="border rounded-lg overflow-hidden ">
                  <img
                    src={baseImageUrl}
                    alt="Original"
                    className="w-full h-48 object-cover bg-gray-50"
                    loading="lazy"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Transformed</h3>
                <div className="border rounded-lg overflow-hidden ">
                  <Dialog>
                    <DialogTrigger>
                      <img
                        src={imageUrl}
                        alt="Transformed"
                        className="w-full h-48 object-cover bg-gray-50"
                        loading="lazy"
                      />
                    </DialogTrigger>
                    <DialogContent className="w-dvw">
                      <DialogHeader>On-the-fly transformations</DialogHeader>
                      <DialogDescription>
                        On-the-fly transformations allows you to modify the
                        content of your files in real time. This is useful for
                        optimizing images, adding watermarks, or changing the
                        color scheme of your files.
                      </DialogDescription>
                      <img
                        src={imageUrl}
                        alt="Transformed"
                        className="w-dvw h-48 object-cover bg-gray-50"
                        loading="lazy"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* URL display */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Generated URL:</h3>
              <div className="p-3  rounded border text-xs font-mono break-all">
                {getShowImageUrl()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(getShowImageUrl())}
                className="w-full"
              >
                Copy URL
              </Button>
            </div>

            {/* Active parameters */}
            {Object.keys(paramValues).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Active Parameters:</h3>
                <div className="space-y-1">
                  {Object.entries(paramValues).map(([param, value]) => (
                    <div
                      key={param}
                      className="flex items-center justify-between text-xs"
                    >
                      <code className=" px-1 rounded">{param}</code>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setParamValues({})}
                  className="w-full"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick reference */}
      <div className="mt-8 p-6 bg-blue-50 text-gray-700 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-800">Most Used Parameters</h3>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>
                <code>w</code> - Width
              </li>
              <li>
                <code>h</code> - Height
              </li>
              <li>
                <code>fit</code> - Resize behavior
              </li>
              <li>
                <code>crop</code> - Crop mode
              </li>
              <li>
                <code>fm</code> - Format
              </li>
              <li>
                <code>q</code> - Quality
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Color Values</h3>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>
                3-digit hex: <code>f00</code>
              </li>
              <li>
                6-digit hex: <code>ff0000</code>
              </li>
              <li>
                8-digit hex: <code>80ff0000</code>
              </li>
              <li>
                Color names: <code>red</code>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Keyboard Shortcuts</h3>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li className="mb-6">
                <kbd className="bg-white py-2 px-4 rounded text-xs">⌘K</kbd>{" "}
                Open search
              </li>
              <li>
                <kbd className="bg-white py-2 px-4 rounded text-xs">Esc</kbd>{" "}
                Close search
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          💡 Pro Tips
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Combine multiple parameters for complex transformations</li>
          <li>
            • Use <code>auto=format,compress</code> for automatic optimization
          </li>
          <li>
            • Set <code>dpr=2</code> for high-DPI displays
          </li>
          <li>
            • Use <code>crop=faces</code> for automatic face detection
          </li>
          <li>
            • Add <code>fm=webp</code> for modern browsers to reduce file size
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Docs;
