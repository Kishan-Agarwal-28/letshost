import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Upload,
  X,
  FileIcon,
  Image,
  Video,
  Code,
  Link,
  AlertCircle,
} from "lucide-react";
import useUser from "@/hooks/useUser";
import ApiRoutes from "@/connectors/api-routes";
import { useApiPost, useApiGet } from "@/hooks/apiHooks";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import config from "@/config/config";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { useConfettiCannon } from "@/components/ui/confetti-cannon";

interface FileWithPreview extends File {
  preview?: string;
}

type FileType = "image" | "video" | "css" | "js" | "unsupported";

const FileUploader = ({ className }: { className?: string }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualFiles, setActualFiles] = useState<File[]>([]);
  const user = useUser();

  // File limits (in MB)
  const FILE_LIMITS = useMemo(() => {
    return {
      image: 10,
      video: 100,
      css: 10,
      js: 10,
      overall: {
        code: user?.cdnCSSJSlimit || 20,
        media: user?.cdnMedialimit || 100,
      },
    };
  }, [user]);

  // Supported file types
  const SUPPORTED_TYPES = {
    image: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    video: [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
      "video/mkv",
    ],
    css: ["text/css"],
    js: [
      "text/javascript",
      "application/javascript",
      "application/x-javascript",
    ],
  };

  const getFileType = useCallback(
    (file: File): FileType => {
      if (SUPPORTED_TYPES.image.includes(file.type)) return "image";
      if (SUPPORTED_TYPES.video.includes(file.type)) return "video";
      if (SUPPORTED_TYPES.css.includes(file.type) || file.name.endsWith(".css"))
        return "css";
      if (SUPPORTED_TYPES.js.includes(file.type) || file.name.endsWith(".js"))
        return "js";
      return "unsupported";
    },
    [
      SUPPORTED_TYPES.image,
      SUPPORTED_TYPES.video,
      SUPPORTED_TYPES.css,
      SUPPORTED_TYPES.js,
    ],
  );

  const getFileIcon = (type: FileType): React.ReactNode => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "css":
      case "js":
        return <Code className="w-5 h-5" />;
      default:
        return <FileIcon className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const createPreview = useCallback(
    (file: File): string => {
      const fileType = getFileType(file);
      if (fileType === "image" || fileType === "video") {
        return URL.createObjectURL(file);
      }
      return "";
    },
    [getFileType],
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      const fileType = getFileType(file);
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileType === "unsupported") {
        return `Unsupported file type: ${file.name}`;
      }

      if (fileSizeMB > FILE_LIMITS[fileType]) {
        return `${file.name} exceeds ${FILE_LIMITS[fileType]}MB limit`;
      }

      return null;
    },
    [FILE_LIMITS, getFileType],
  );

  const processFiles = useCallback(
    (newFiles: File[]) => {
      // Take only the last file if multiple files are provided
      const fileToProcess = newFiles[newFiles.length - 1];
      if (!fileToProcess) return;

      const fileErrors: string[] = [];
      let validFile: FileWithPreview | null = null;

      // Validate the file
      const error = validateFile(fileToProcess);
      if (error) {
        fileErrors.push(error);
      } else {
        // If we already have a file, remove its preview
        if (files.length > 0 && files[0].preview) {
          URL.revokeObjectURL(files[0].preview);
        }

        validFile = Object.assign(fileToProcess, {
          preview: createPreview(fileToProcess),
        }) as FileWithPreview;

        console.log("File Metadata:", {
          name: validFile.name,
          type: validFile.type,
          size: validFile.size,
          lastModified: new Date(validFile.lastModified).toISOString(),
          fileType: getFileType(validFile),
        });
      }

      if (fileErrors.length > 0) {
        setErrors(fileErrors);
        return;
      }

      if (validFile) {
        setFiles([validFile]);
        setActualFiles([validFile]);
        setErrors([]);
      }
    },
    [files, createPreview, getFileType, validateFile],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    },
    [processFiles],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === "file") {
            const file = items[i].getAsFile();
            if (file) pastedFiles.push(file);
          }
        }
        if (pastedFiles.length > 0) {
          processFiles(pastedFiles);
        }
      }
    },
    [processFiles],
  );

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const fileName = urlInput.split("/").pop() || "downloaded-file";
      const file = new File([blob], fileName, { type: blob.type });
      processFiles([file]);
      setUrlInput("");
    } catch (error) {
      if (error instanceof Error) {
        setErrors([`Failed to fetch file from URL: ${error.message}`]);
      } else {
        setErrors(["Failed to fetch file from URL"]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
    setActualFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    setErrors([]);
  };
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showUploadProgress, setShowUploadProgress] = useState<boolean>(false);

  const cdnRegister = useApiPost({
    type: "post",
    key: ["register"],
    path: ApiRoutes.registerCDN,
    sendingFile: true,
    setUploadProgress,
  });

  const cdnRegisterVideo = useApiPost({
    type: "post",
    key: ["register"],
    path: ApiRoutes.registerCDN,
    sendingFile: false,
  });

  const { toast } = useToast();
  const getCDN = useApiGet({
    key: ["getCDN"],
    path: ApiRoutes.getCDN,
    enabled: false,
  });
  const confettiCannon = useConfettiCannon;
  // Helper function to clear all states after upload
  const clearUploadStates = useCallback(() => {
    // Clear file previews
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });

    setFiles([]);
    setActualFiles([]);
    setErrors([]);
    setIsUploading(false);

    // Reset API mutation states
    cdnRegister.reset?.();
    cdnRegisterVideo.reset?.();
  }, [files, cdnRegister, cdnRegisterVideo]);

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      if (
        getFileType(files[0]) !== "unsupported" &&
        getFileType(files[0]) !== "video"
      ) {
        setUploadProgress(0);
        setShowUploadProgress(true);
        await cdnRegister.mutate({
          files: actualFiles,
        });
      } else if (
        getFileType(files[0]) !== "unsupported" &&
        getFileType(files[0]) === "video"
      ) {
        const res = await cdnRegisterVideo.mutateAsync({
          fileMetaData: {
            filename: actualFiles[0].name,
            type: actualFiles[0].type,
            size: actualFiles[0].size,
            lastModified: new Date(actualFiles[0].lastModified).toISOString(),
            fileType: getFileType(actualFiles[0]),
          },
        });

        console.log(res.data.data);
        const formData = new FormData();
        formData.append("file", actualFiles[0]);
        formData.append("folder", res.data.data.folder);
        formData.append("public_id", res.data.data.public_id);
        formData.append("timestamp", res.data.data.timestamp);
        formData.append("unique_filename", res.data.data.unique_filename);
        formData.append("api_key", config.ConfirmKey);
        formData.append("signature", res.data.data.signature);
        formData.append(
          "notification_url",
          "https://b602-2409-40e5-100e-da14-e87e-cc83-c411-5a94.ngrok-free.app/api/v1/cdn/video/upload/callback",
        );

        const uploadResult = await axios.post(
          "https://api.cloudinary.com/v1_1/testifywebdev/video/upload",
          formData,
          {
            onUploadProgress: (progressEvent) => {
              if (
                typeof progressEvent.total === "number" &&
                progressEvent.total > 0
              ) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                );
                setShowUploadProgress(true);
                setUploadProgress(percentCompleted);
              }
            },
          },
        );

        if (uploadResult.status === 200) {
          clearUploadStates();
          setUploadProgress(0);
          setShowUploadProgress(false);
          getCDN.refetch();
          toast({
            title: "Success",
            description: "File uploaded successfully",
            duration: 5000,
            variant: "success",
          });
          confettiCannon();
        } else {
          clearUploadStates();
          setErrors([uploadResult.data.error]);
          toast({
            title: "Error",
            description: "Failed to upload file",
            duration: 5000,
            variant: "error",
          });
        }
      }
    } catch (error) {
      clearUploadStates();
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setErrors([errorMessage]);
      toast({
        title: "Error",
        description: errorMessage,
        duration: 5000,
        variant: "error",
      });
    }
  };

  // Handle non-video upload success/error
  useEffect(() => {
    if (cdnRegister.isSuccess) {
      clearUploadStates();
      setUploadProgress(0);
      setShowUploadProgress(false);
      getCDN.refetch();
      confettiCannon();
      toast({
        title: "Success",
        description: "File uploaded successfully",
        duration: 5000,
        variant: "success",
      });
    }
    if (cdnRegister.isError) {
      clearUploadStates();
      setUploadProgress(0);
      setShowUploadProgress(false);
      setErrors([getErrorMsg(cdnRegister)]);
      toast({
        title: "Error",
        description: getErrorMsg(cdnRegister),
        duration: 5000,
        variant: "error",
      });
    }
  }, [cdnRegister.isSuccess, cdnRegister.isError, clearUploadStates]);

  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (
        (e.target as HTMLElement)?.tagName !== "INPUT" &&
        (e.target as HTMLElement)?.tagName !== "TEXTAREA"
      ) {
        handlePaste(e);
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [handlePaste]);

  // Cleanup function for file previews
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">File Uploader</h1>
        <p className="text-muted-foreground">
          Upload a single CSS, JS, image, or video file. Drag & drop, paste, or
          provide URL.
          {files.length > 0 && (
            <span className="block text-sm text-yellow-600">
              Note: Uploading a new file will replace the current one.
            </span>
          )}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".css,.js,.jpeg,.jpg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.wmv,.webm,.mkv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              You can also paste a file or provide a URL below
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="Enter file URL to download and upload"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim() || isUploading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add URL
        </button>
      </div>

      {/* File Limits Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">File Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>• Images: {FILE_LIMITS.image}MB each</div>
          <div>• Videos: {FILE_LIMITS.video}MB each</div>
          <div>• CSS/JS: {FILE_LIMITS.css}MB each</div>
          <div>• Total CSS/JS: {FILE_LIMITS.overall.code}MB</div>
          <div>• Total Media: {FILE_LIMITS.overall.media}MB</div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-medium text-destructive">Upload Errors</h3>
          </div>
          <ul className="space-y-1 text-sm text-destructive">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Selected File</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => {
              const fileType = getFileType(file);
              return (
                <div
                  key={index}
                  className="flex flex-col bg-muted/50 rounded-lg overflow-hidden"
                >
                  {file.preview &&
                    (fileType === "image" || fileType === "video") && (
                      <div className="relative w-full aspect-video bg-black">
                        {fileType === "image" ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <video
                            src={file.preview}
                            controls
                            className="w-full h-full object-contain"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    )}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(fileType)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {fileType}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-destructive/10 rounded-full"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-4 w-300">
              {showUploadProgress && (
                <Progress value={uploadProgress} className="h-2" />
              )}
              <p className="text-muted-foreground">Uploading files...</p>
            </div>
          ) : (
            <button
              onClick={uploadFiles}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Upload File
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
