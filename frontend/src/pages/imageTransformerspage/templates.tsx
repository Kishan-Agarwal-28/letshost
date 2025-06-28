import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
dayjs.extend(relativeTime);
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

interface AllOptions {
  rotation: {
    angle: number;
    flip: boolean;
    flop: boolean;
    autoRotate: boolean;
  };
  resize: {
    width: number;
    height: number;
    fit: string;
    position: string;
    socialPlatform: string;
  };
  colors: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    effect: string;
  };
  filters: {
    blur: number;
    sharpen: number;
  };
  borders: {
    border: { width: number; color: string };
    padding: { size: number; color: string };
  };
  composite: {
    textOverlays: TextOverlay[];
    badges: BadgeOverlay[];
  };
  output: {
    format: string;
    quality: number;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  options: AllOptions;
  createdAt: Date;
}

const TemplatesPage = ({
  templates,
  handleDeleteTemplate,
  handleApplyTemplate,
}: {
  templates: Template[];
  handleDeleteTemplate: (id: string) => void;
  handleApplyTemplate: (id: string) => void;
}) => {
  const getImageStyles = (options: AllOptions) => {
    const { colors, filters, rotation, borders } = options;

    return {
      filter: `
        brightness(${colors.brightness})
        contrast(${colors.contrast})
        saturate(${colors.saturation})
        hue-rotate(${colors.hue}deg)
        blur(${filters.blur}px)
        ${colors.effect === "sepia" ? "sepia(0.8)" : ""}
        ${colors.effect === "grayscale" ? "grayscale(1)" : ""}
      `.trim(),
      transform: `
        rotate(${rotation.angle}deg)
        ${rotation.flip ? "scaleX(-1)" : ""}
        ${rotation.flop ? "scaleY(-1)" : ""}
      `.trim(),
      border:
        borders.border.width > 0
          ? `${borders.border.width}px solid ${borders.border.color}`
          : "none",
      padding: borders.padding.size > 0 ? `${borders.padding.size}px` : "0",
      backgroundColor:
        borders.padding.size > 0 ? borders.padding.color : "transparent",
      borderRadius: "8px",
      transition: "all 0.3s ease",
    };
  };

  if (templates.length === 0) {
    return (
      <div className="min-h-screen  p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No Templates Found
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              You haven't created any templates yet. Templates will appear here
              once you save them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Templates</h1>
          <p className="text-gray-600">Your saved image processing templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Tooltip>
              <TooltipTrigger>
                <Card
                  key={template.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg backdrop-blur-sm cursor-pointer"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={`https://picsum.photos/400/300?random=${template.id}`}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getImageStyles(template.options)}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white/80 truncate">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dayjs(template.createdAt).format("DD MMM YYYY")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dayjs(template.createdAt).fromNow()}
                      </div>
                      {template.options.resize.socialPlatform && (
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                          {template.options.resize.socialPlatform}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {template.options.resize.width &&
                        template.options.resize.height && (
                          <div className="bg-gray-400 p-2 rounded">
                            <span className="text-gray-500">Size:</span>
                            <div className="font-medium">
                              {template.options.resize.width}x
                              {template.options.resize.height}
                            </div>
                          </div>
                        )}
                      {template.options.output.format && (
                        <div className="bg-gray-400 p-2 rounded">
                          <span className="text-gray-500">Format:</span>
                          <div className="font-medium uppercase">
                            {template.options.output.format}
                          </div>
                        </div>
                      )}
                    </div>

                    {(template.options.colors.effect !== "none" ||
                      template.options.filters.blur > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.options.colors.effect !== "none" && (
                          <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                            {template.options.colors.effect}
                          </span>
                        )}
                        {template.options.filters.blur > 0 && (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                            blur
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent
                className="bg-muted-foreground  text-balance"
                tip={false}
              >
                <span>Click to apply template</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
