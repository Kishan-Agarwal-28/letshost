import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  Server,
  HardDrive,
  Globe,
  FileText,
  Image,
  Video,
  Code,
  TrendingUp,
  Users,
  Activity,
  Zap,
  Crown,
  Calendar,
  TrendingDown,
  CircleAlert,
} from "lucide-react";
import { useApiGet } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { formatBytes } from "bytes-formatter";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
// Types
interface UserData {
  username: string;
  email: string;
  tier: "free" | "pro";
  isVerified: boolean;
  SDLimit: number;
  fileLimit: number;
  cdnCSSJSlimit: number;
  cdnMedialimit: number;
  totalMediaSize: number;
  totalJsCssSize: number;
  genCredits: number;
  createdAt: string;
}

interface SubdomainData {
  name: string;
  projectID: string;
  public: boolean;
  fileSize: number;
  createdAt: string;
}

interface CDNFile {
  filename: string;
  fileType: "js" | "css" | "image" | "video";
  size: number;
  bucketAssigned: string;
  createdAt: string;
}

interface UsageData {
  subdomains: SubdomainData[];
  cdnFiles: CDNFile[];
}

interface Calculations {
  subdomainUsage: number;
  fileUsage: number;
  mediaUsage: number;
  jssCssUsage: number;
}

interface FileTypeData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyUsage {
  month: string;
  subdomains: number;
  files: number;
  storage: string;
}

interface FileBreakdown {
  name: string;
  value: number;
  color: string;
}

const Analytics: React.FC = () => {
  const getAnalytics = useApiGet({
    key: ["getAnalytics"],
    path: ApiRoutes.getAnalytics,
    enabled: false,
  });

  const { toast } = useToast();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [fileTypeData, setFileTypeData] = useState<FileTypeData[] | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[] | null>(null);

  useEffect(() => {
    getAnalytics.refetch();
  }, []);

  useEffect(() => {
    // console.log("useEffect");
    if (getAnalytics.isSuccess && getAnalytics.data?.data) {
      setUserData(getAnalytics.data.data.data.userData);
      setUsageData(getAnalytics.data.data.data.usageData);
      setCalculations(getAnalytics.data.data.data.calculations);
      setFileTypeData(getAnalytics.data.data.data.fileTypeData);
      const tempMonthlyUsage:MonthlyUsage[] = getAnalytics.data.data.data.monthlyUsage;
      tempMonthlyUsage.forEach((usage:MonthlyUsage, index:number) => {
        tempMonthlyUsage[index].storage = formatBytes(Number(usage.storage));
        tempMonthlyUsage[index].subdomains = usage.subdomains;
        tempMonthlyUsage[index].files = usage.files;
      });

      setMonthlyUsage(tempMonthlyUsage);
      
    }
    if (getAnalytics.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(getAnalytics),
        variant: "error",
        duration: 5000,
      });
    }
  }, [
    getAnalytics.isSuccess,
    getAnalytics.isError,
    getAnalytics.dataUpdatedAt,
    toast,
  ]);

  // Individual file type breakdowns
  const getFileTypeBreakdown = (
    fileType: "js" | "css" | "image" | "video"
  ): FileBreakdown[] => {
    if (!usageData?.cdnFiles) return [];

    const files = usageData.cdnFiles.filter((f) => f.fileType === fileType);
    const colors = [
      "#8b5cf6",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#84cc16",
      "#f97316",
    ];
    return files.map((file, index) => ({
      name: file.filename,
      value: file.size,
      color: colors[index % colors.length],
    }));
  };

  const jsFiles = getFileTypeBreakdown("js");
  const cssFiles = getFileTypeBreakdown("css");
  const imageFiles = getFileTypeBreakdown("image");
  const videoFiles = getFileTypeBreakdown("video");

  const getTotalSizeByType = (
    fileType: "js" | "css" | "image" | "video"
  ): number => {
    if (!usageData?.cdnFiles) return 0;

    return usageData.cdnFiles
      .filter((f) => f.fileType === fileType)
      .reduce((total, file) => total + file.size, 0);
  };



  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (
    getAnalytics.isLoading ||
    !userData ||
    !usageData ||
    !calculations ||
    !fileTypeData ||
    !monthlyUsage
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative mb-8 opacity-40">
          <div className="w-24 h-24 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-muted border-b-primary rounded-full animate-spin" />
          <div className="absolute inset-4 w-8 h-8 border-4 border-muted border-l-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Track your usage and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={userData?.tier === "pro" ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {userData?.tier === "pro" && <Crown className="w-3 h-3" />}
              {userData?.tier.toUpperCase()} Plan
            </Badge>
            <Badge variant={userData?.isVerified ? "default" : "destructive"}>
              {userData?.isVerified ? "✓ Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Subdomains
              </CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-400">
                {usageData?.subdomains?.length}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-600">
                  of {userData?.SDLimit} limit
                </p>
                <span className="text-xs text-slate-500">
                  {calculations?.subdomainUsage?.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={calculations?.subdomainUsage}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                CDN Files
              </CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {usageData?.cdnFiles.length}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-600">
                  of {formatBytes(userData?.fileLimit)} limit
                </p>
                <span className="text-xs text-slate-500">
                  {calculations?.fileUsage?.toFixed(1)}%
                </span>
              </div>
              <Progress value={calculations?.fileUsage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Storage Used
              </CardTitle>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {formatBytes(
                  userData?.totalMediaSize + userData?.totalJsCssSize
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-600">Media + Code</p>
                <span className="text-xs text-slate-500">
                  {(
                    ((userData?.totalMediaSize + userData?.totalJsCssSize) /
                      (userData?.cdnMedialimit + userData?.cdnCSSJSlimit)) *
                    100
                  )?.toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                value={
                  ((userData?.totalMediaSize + userData?.totalJsCssSize) /
                    (userData?.cdnMedialimit + userData?.cdnCSSJSlimit)) *
                  100
                }
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Gen Credits
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {userData?.genCredits}
              </div>
              <p className="text-xs text-slate-600 mt-2">Available credits</p>
              <div className={`mt-2 text-xs ${userData.genCredits>3? "text-green-600":userData.genCredits===0? "text-red-600":"text-yellow-600"} flex items-center gap-1`}>
              {
                userData.genCredits>3?(
                  <>
                    <TrendingUp className="w-3 h-3" />
                Active
                  </>
                ):(
                  userData.genCredits===0?(
                    <>
                    <TrendingDown className="w-3 h-3" />
                  Active
                      </>
                  ):(
                  <>
                  <CircleAlert className="w-3 h-3" />
                  Inactive
                  </>
                  )
                )
              }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Storage Breakdown
                  </CardTitle>
                  <CardDescription>
                    Your storage usage by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Media Files</span>
                        <span className="text-sm text-slate-600">
                          {formatBytes(userData?.totalMediaSize)}
                        </span>
                      </div>
                      <Progress
                        value={calculations?.mediaUsage}
                        className="h-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {formatBytes(calculations?.mediaUsage)}% of{" "}
                        {formatBytes(userData?.cdnMedialimit)} limit
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          JS & CSS Files
                        </span>
                        <span className="text-sm text-slate-600">
                          {formatBytes(userData?.totalJsCssSize)}
                        </span>
                      </div>
                      <Progress
                        value={calculations?.jssCssUsage}
                        className="h-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {formatBytes(calculations?.jssCssUsage)}% of{" "}
                        {formatBytes(userData?.cdnCSSJSlimit)} limit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>File Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of your CDN files by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={fileTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {fileTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Individual File Type Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* JavaScript Files Breakdown */}
              {jsFiles.length > 0 && (
                <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Code className="w-4 h-4 text-yellow-600" />
                      JavaScript Files
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {jsFiles.length} files •{" "}
                      {formatBytes(getTotalSizeByType("js"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={jsFiles}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          dataKey="value"
                        >
                          {jsFiles.map((entry, index) => (
                            <Cell key={`js-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatBytes(value as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {jsFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: file.color }}
                          ></div>
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-slate-500">
                            {formatBytes(file.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CSS Files Breakdown */}
              {cssFiles.length > 0 && (
                <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-blue-600" />
                      CSS Files
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {cssFiles.length} files •{" "}
                      {formatBytes(getTotalSizeByType("css"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={cssFiles}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          dataKey="value"
                        >
                          {cssFiles.map((entry, index) => (
                            <Cell key={`css-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatBytes(value as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {cssFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: file.color }}
                          ></div>
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-slate-500">
                            {formatBytes(file.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Image Files Breakdown */}
              {imageFiles.length > 0 && (
                <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Image className="w-4 h-4 text-green-600" />
                      Image Files
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {imageFiles.length} files •{" "}
                      {formatBytes(getTotalSizeByType("image"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={imageFiles}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          dataKey="value"
                        >
                          {imageFiles.map((entry, index) => (
                            <Cell key={`img-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatBytes(value as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {imageFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: file.color }}
                          ></div>
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-slate-500">
                            {formatBytes(file.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Video Files Breakdown */}
              {videoFiles.length > 0 && (
                <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Video className="w-4 h-4 text-purple-600" />
                      Video Files
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {videoFiles.length} files •{" "}
                      {formatBytes(getTotalSizeByType("video"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={videoFiles}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          dataKey="value"
                        >
                          {videoFiles.map((entry, index) => (
                            <Cell key={`vid-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatBytes(value as number)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {videoFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: file.color }}
                          ></div>
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-slate-500">
                            {formatBytes(file.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  CDN Files
                </CardTitle>
                <CardDescription>All your uploaded CDN files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageData?.cdnFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/80 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {file.fileType === "js" && (
                          <Code className="w-5 h-5 text-yellow-600" />
                        )}
                        {file.fileType === "css" && (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                        {file.fileType === "image" && (
                          <Image className="w-5 h-5 text-green-600" />
                        )}
                        {file.fileType === "video" && (
                          <Video className="w-5 h-5 text-purple-600" />
                        )}
                        <div>
                          <p className="font-medium text-slate-600">
                            {file.filename}
                          </p>
                          <p className="text-sm text-slate-600">
                            {file.bucketAssigned}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-600">
                          {formatBytes(file.size)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Your Subdomains
                </CardTitle>
                <CardDescription>Manage your deployed projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageData?.subdomains.map((subdomain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-600">
                            {subdomain.name}.yourdomain.com
                          </p>
                          <Badge
                            variant={subdomain.public ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {subdomain.public ? "Public" : "Private"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Project ID: {subdomain.projectID}
                        </p>
                        <p className="text-xs text-slate-500">
                          Created: {formatDate(subdomain.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-600">
                          {formatBytes(subdomain.fileSize)}
                        </p>
                        <p className="text-sm text-slate-600">File Size</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Usage Trends
                </CardTitle>
                <CardDescription>
                  Track your monthly usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyUsage}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="month" label={{value:"Month",position:"center",style:{textAnchor:"middle"}}}/>
                    <YAxis dataKey={"files"} label={{value:"Files",position:"insideBottomLeft",style:{textAnchor:"middle",transform:"translate(20px,-10px)"}}}/>
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="storage"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="files"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="subdomains"
                      stackId="3"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Account Age
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-semibold">
                      {dayjs(userData?.createdAt).fromNow()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Member since {formatDate(userData?.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-semibold">
                      {usageData?.subdomains.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Active deployments
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-muted/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Public Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-lg font-semibold">
                      {usageData?.subdomains.filter((s) => s.public).length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Publicly accessible
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
