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
import { useApiGet, useApiPost } from "@/hooks/apiHooks";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import config from "@/config/config";
import axios from "axios";
import { useConfettiCannon } from "@/components/ui/confetti-cannon";
import { Progress } from "@/components/ui/progress";
interface FileWithPreview extends File {
  preview?: string;
}

type FileType = "image" | "video" | "css" | "js" | "unsupported";

interface CompactFileUploaderProps {
  className?: string;
  cdnId?: string;
  allowedFileType?: FileType; // New prop to restrict file types
  onCancel?: () => void;
  onSuccess?: () => void;
  purpose:string;
}

const CompactFileUploader = ({
  className,
  cdnId,
  allowedFileType,
  onSuccess,
  purpose
}: CompactFileUploaderProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualFiles, setActualFiles] = useState<File[]>([]);
  const user = useUser();

  // File limits (in MB) - filtered based on allowed type
  const FILE_LIMITS = useMemo(() => {
    const baseLimits = {
      image: 10,
      video: 100,
      css: 10,
      js: 10,
      overall: {
        code: user?.cdnCSSJSlimit || 20,
        media: user?.cdnMedialimit || 100,
      },
    };

    if (allowedFileType && allowedFileType !== "unsupported") {
      return {
        ...baseLimits,
      };
    }

    return baseLimits;
  }, [user, allowedFileType]);

  // Supported file types - filtered based on allowed type
  const SUPPORTED_TYPES = useMemo(() => {
    const allTypes = {
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

    if (allowedFileType && allowedFileType !== "unsupported") {
      return {
        [allowedFileType]: allTypes[allowedFileType],
      };
    }

    return allTypes;
  }, [allowedFileType]);

  const getFileType = useCallback(
    (file: File): FileType => {
      // If we have a specific allowed type, only check for that type
      if (allowedFileType && allowedFileType !== "unsupported") {
        const typeArray =
          SUPPORTED_TYPES[allowedFileType as keyof typeof SUPPORTED_TYPES];
        if (
          typeArray?.includes(file.type) ||
          (allowedFileType === "css" && file.name.endsWith(".css")) ||
          (allowedFileType === "js" && file.name.endsWith(".js"))
        ) {
          return allowedFileType;
        }
        return "unsupported";
      }

      // Original logic for when no restriction
      if (SUPPORTED_TYPES.image?.includes(file.type)) return "image";
      if (SUPPORTED_TYPES.video?.includes(file.type)) return "video";
      if (
        SUPPORTED_TYPES.css?.includes(file.type) ||
        file.name.endsWith(".css")
      )
        return "css";
      if (SUPPORTED_TYPES.js?.includes(file.type) || file.name.endsWith(".js"))
        return "js";
      return "unsupported";
    },
    [SUPPORTED_TYPES, allowedFileType],
  );

  const getFileIcon = (type: FileType): React.ReactNode => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "css":
      case "js":
        return <Code className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
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
        if (allowedFileType) {
          return `Only ${allowedFileType.toUpperCase()} files are allowed for this update`;
        }
        return `Unsupported file type: ${file.name}`;
      }

      const limit = FILE_LIMITS[fileType as keyof typeof FILE_LIMITS] as number;
      if (limit && fileSizeMB > limit) {
        return `${file.name} exceeds ${limit}MB limit`;
      }

      return null;
    },
    [FILE_LIMITS, getFileType, allowedFileType],
  );

  const processFiles = useCallback(
    (newFiles: File[]) => {
      const fileToProcess = newFiles[newFiles.length - 1];
      if (!fileToProcess) return;

      const fileErrors: string[] = [];
      let validFile: FileWithPreview | null = null;

      const error = validateFile(fileToProcess);
      if (error) {
        fileErrors.push(error);
      } else {
        if (files.length > 0 && files[0].preview) {
          URL.revokeObjectURL(files[0].preview);
        }

        validFile = Object.assign(fileToProcess, {
          preview: createPreview(fileToProcess),
        }) as FileWithPreview;
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
    [files, createPreview, validateFile],
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
  const confettiCannon = useConfettiCannon;
  const cdnUpdate = useApiPost({
    type: "post",
    key: ["updateCDN"],
    path: ApiRoutes.updateCDN,
    sendingFile: true,
    setUploadProgress,
  });
  const cdnUpdateVideo = useApiPost({
    type: "post",
    key: ["updateCDN"],
    path: ApiRoutes.updateCDN,
    sendingFile: false,
  });
  const getCDN = useApiGet({
    key: ["getCDN"],
    path: ApiRoutes.getCDN,
    enabled: false,
  });
  const updateAvatar=useApiPost({
    type:"patch",
    key:["updateAvatar"],
    path:ApiRoutes.updateAvatar,
    sendingFile:true,
    setUploadProgress
  })
  const updateCoverImage=useApiPost({
    type:"patch",
    key:["updateCoverImage"],
    path:ApiRoutes.updateCoverImage,
    sendingFile:true,
    setUploadProgress
  })
  const getuser=useApiGet({
    key:["getUser"],
    path:ApiRoutes.getUserDetails,
    enabled:false
  })
  const { toast } = useToast();

  const uploadFiles = async () => {
    if (files.length === 0) return;
if(purpose==="cdnUpdate"){
    setIsUploading(true);
    const fileType = getFileType(files[0]);
    if (fileType !== "unsupported" && fileType !== "video") {
      setUploadProgress(0);
      setShowUploadProgress(true);
      const data = await cdnUpdate.mutateAsync({
        files: actualFiles,
        cdnProjectID: cdnId,
      });
      if (data.status === 200) {
        toast({
          title: "Success",
          description: cdnId
            ? "File updated successfully"
            : "File uploaded successfully",
          duration: 5000,
          variant: "success",
        });
        onSuccess?.();
        confettiCannon();
        setIsUploading(false);
        setShowUploadProgress(false);
        setUploadProgress(0);
        getCDN.refetch();
      } else {
        setUploadProgress(0);
        setShowUploadProgress(false);
        setIsUploading(false);
        toast({
          title: "Error",
          description: getErrorMsg(cdnUpdate),
          duration: 5000,
          variant: "error",
        });
      }
    } else if (fileType !== "unsupported" && fileType === "video") {
      const res = await cdnUpdateVideo.mutateAsync({
        fileMetaData: {
          filename: actualFiles[0].name,
          type: actualFiles[0].type,
          size: actualFiles[0].size,
          lastModified: new Date(actualFiles[0].lastModified).toISOString(),
          fileType: getFileType(actualFiles[0]),
        },
        cdnProjectID: cdnId,
      });
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

      console.log(uploadResult);
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
      } else {
        clearUploadStates();
        setUploadProgress(0);
        setShowUploadProgress(false);
        setErrors([uploadResult.data.error]);
        toast({
          title: "Error",
          description: "Failed to upload file",
          duration: 5000,
          variant: "error",
        });
      }
    }
  }
else if(purpose==="avatarUpdate")
  {
  setIsUploading(true);
  setUploadProgress(0);
  setShowUploadProgress(true);
  
  try {
    const fileType = getFileType(files[0]);
    if (fileType !== "unsupported" && fileType === "image") {
      const data = await updateAvatar.mutateAsync({
        files: actualFiles,
      });
      if (data.status === 200) {
        toast({
          title: "Success",
          description: "Avatar updated successfully",
          duration: 5000,
          variant: "success",
        });
        onSuccess?.();
        clearUploadStates(); // Clear states on success
        getuser.refetch();
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(updateAvatar) || "Failed to update avatar",
          duration: 5000,
          variant: "error",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        duration: 5000,
        variant: "error",
      });
    }
  } catch (error) {
    console.error("Avatar update error:", error);
    toast({
      title: "Error",
      description: getErrorMsg(updateAvatar) || "Failed to update avatar",
      duration: 5000,
      variant: "error",
    });
  } finally {
    setUploadProgress(0);
    setShowUploadProgress(false);
    setIsUploading(false);
  }
}
  else if(purpose==="coverImage"){
     setIsUploading(true);
  setUploadProgress(0);
  setShowUploadProgress(true);
  
  try {
    const fileType = getFileType(files[0]);
    if (fileType !== "unsupported" && fileType === "image") {
      const data = await updateCoverImage.mutateAsync({
        files: actualFiles,
      });
      if (data.status === 200) {
        toast({
          title: "Success",
          description: "Avatar updated successfully",
          duration: 5000,
          variant: "success",
        });
        onSuccess?.();
        clearUploadStates(); // Clear states on success
        getuser.refetch();
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(updateCoverImage) || "Failed to update avatar",
          duration: 5000,
          variant: "error",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        duration: 5000,
        variant: "error",
      });
    }
  } catch (error) {
    console.error("Avatar update error:", error);
    toast({
      title: "Error",
      description: getErrorMsg(updateCoverImage) || "Failed to update avatar",
      duration: 5000,
      variant: "error",
    });
  } finally {
    setUploadProgress(0);
    setShowUploadProgress(false);
    setIsUploading(false);
  }
  }

}

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
    cdnUpdate.reset?.();
    cdnUpdateVideo.reset?.();
  }, [files, cdnUpdate, cdnUpdateVideo]);

  // Get accept attribute for file input based on allowed type
  const getAcceptAttribute = () => {
    if (!allowedFileType || allowedFileType === "unsupported") {
      return ".css,.js,.jpeg,.jpg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.wmv,.webm,.mkv";
    }

    const acceptMap = {
      image: ".jpeg,.jpg,.png,.gif,.webp,.svg",
      video: ".mp4,.avi,.mov,.wmv,.webm,.mkv",
      css: ".css",
      js: ".js",
    };

    return acceptMap[allowedFileType];
  };

  // Cleanup function for file previews
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className={`w-full h-full flex flex-col space-y-3 ${className}`}>
      {/* Compact Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">
          {cdnId
            ? `Update ${allowedFileType?.toUpperCase() || "File"}`
            : "Upload File"}
        </h2>
        {allowedFileType && (
          <p className="text-xs text-muted-foreground">
            Only {allowedFileType.toUpperCase()} files are allowed
          </p>
        )}
      </div>

      {/* Compact Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-md p-4 text-center transition-colors ${
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
          accept={getAcceptAttribute()}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-2">
          {getFileIcon(allowedFileType || "image")}
          <div className="space-y-1">
            <p className="text-sm font-medium">Drop file or click to browse</p>
            <p className="text-xs text-muted-foreground">
              {allowedFileType
                ? `${allowedFileType.toUpperCase()} files only`
                : "CSS, JS, Images, Videos"}
            </p>
          </div>
        </div>
      </div>

      {/* Compact URL Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="url"
              placeholder="Or paste URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <button
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim() || isUploading}
          className="px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* File Limits Info - Compact */}
      <div className="bg-muted/30 rounded p-2">
        <h4 className="text-xs font-medium mb-1">Limits</h4>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {allowedFileType ? (
            <div>
              {allowedFileType.charAt(0).toUpperCase() +
                allowedFileType.slice(1)}
              :
              {["image", "video", "css", "js"].includes(allowedFileType)
                ? FILE_LIMITS[
                    allowedFileType as "image" | "video" | "css" | "js"
                  ] + "MB"
                : "10MB"}
            </div>
          ) : (
            <>
              <div>
                Images: {FILE_LIMITS.image}MB • Videos: {FILE_LIMITS.video}MB
              </div>
              <div>CSS/JS: {FILE_LIMITS.css}MB each</div>
            </>
          )}
        </div>
      </div>

      {/* Errors - Compact */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <h4 className="text-xs font-medium text-destructive">Error</h4>
          </div>
          <div className="text-xs text-destructive space-y-0.5">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Selected File - Compact */}
      {files.length > 0 && (
        <div className="space-y-2 flex-1 min-h-0">
          <h4 className="text-xs font-medium">Selected File</h4>
          <div className="bg-muted/30 rounded overflow-hidden">
            {files.map((file, index) => {
              const fileType = getFileType(file);
              return (
                <div key={index} className="flex h-30 w-full">
                  {file.preview &&
                    (fileType === "image" || fileType === "video") && (
                      <div className="relative w-1/2 h-full aspect-video bg-black rounded-xl ">
                        {fileType === "image" ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={file.preview}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    )}
                  <div className="flex items-center justify-between p-2 w-1/2 h-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(fileType)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {fileType}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button - Compact */}
      {files.length > 0 && (
        <div className="mt-auto">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              {showUploadProgress && (
                <Progress value={uploadProgress} className="h-2 w-full" />
              )}
              <p className="text-xs text-muted-foreground">
                {cdnId ? "Updating..." : "Uploading..."}
              </p>
            </div>
          ) : (
            <button
              onClick={uploadFiles}
              className="w-full py-2 bg-primary text-primary-foreground rounded font-medium flex items-center justify-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              {cdnId ? "Update File" : "Upload File"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactFileUploader;
