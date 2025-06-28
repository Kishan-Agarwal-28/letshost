import { User } from "../models/user.model.js";
import { CDN } from "../models/cdn.model.js";
import { SubDomain } from "../models/subdomain.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const getAnalytics = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user data
    const user = await User.findById(userId).select(
      "-password -refreshToken -verificationToken"
    );

    if (!user) {
      throw new apiError(404, "User not found");
    }

    // Fetch user's subdomains
    const subdomains = await SubDomain.find({ owner: userId })
      .select("subDomain projectID public fileSize createdAt")
      .sort({ createdAt: -1 });

    // Fetch user's CDN files
    const cdnFiles = await CDN.find({ owner: userId })
      .select("filename fileType size bucketAssigned createdAt")
      .sort({ createdAt: -1 });

    // Calculate total sizes by file type
    const totalJsCssSize = cdnFiles
      .filter((file) => file.fileType === "js" || file.fileType === "css")
      .reduce((total, file) => total + file.size, 0);

    const totalMediaSize = cdnFiles
      .filter((file) => file.fileType === "image" || file.fileType === "video")
      .reduce((total, file) => total + file.size, 0);

    // Update user's total sizes if they've changed
    if (
      user.totalJsCssSize !== totalJsCssSize ||
      user.totalMediaSize !== totalMediaSize
    ) {
      await User.findByIdAndUpdate(userId, {
        totalJsCssSize,
        totalMediaSize,
      });
      user.totalJsCssSize = totalJsCssSize;
      user.totalMediaSize = totalMediaSize;
    }

    // Format user data for frontend
    const userData = {
      username: user.username,
      email: user.email,
      tier: user.tier,
      isVerified: user.isVerified,
      SDLimit: user.SDLimit,
      fileLimit: user.fileLimit,
      cdnCSSJSlimit: user.cdnCSSJSlimit,
      cdnMedialimit: user.cdnMedialimit,
      totalMediaSize: user.totalMediaSize,
      totalJsCssSize: user.totalJsCssSize,
      genCredits: user.genCredits,
      createdAt: user.createdAt.toISOString(),
    };

    // Format subdomains data
    const formattedSubdomains = subdomains.map((subdomain) => ({
      name: subdomain.subDomain,
      projectID: subdomain.projectID,
      public: subdomain.public,
      fileSize: subdomain.fileSize / 1024 / 1024, // Convert to MB
      createdAt: subdomain.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
    }));

    // Format CDN files data
    const formattedCdnFiles = cdnFiles.map((file) => ({
      filename: file.filename,
      fileType: file.fileType,
      size: file.size, // Size in KB
      bucketAssigned: file.bucketAssigned,
      createdAt: file.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
    }));

    // Generate monthly usage trend (last 6 months)
    const monthlyUsage = await generateMonthlyUsage(userId);

    // Calculate usage percentages
    const subdomainUsage =
      (formattedSubdomains.length / userData.SDLimit) * 100;
    const fileUsage = (formattedCdnFiles.length / userData.fileLimit) * 100;
    const mediaUsage = (userData.totalMediaSize / userData.cdnMedialimit) * 100;
    const jssCssUsage =
      (userData.totalJsCssSize / userData.cdnCSSJSlimit) * 100;

    // File type distribution
    const fileTypeData = [
      {
        name: "JavaScript",
        value: formattedCdnFiles.filter((f) => f.fileType === "js").length,
        color: "#f59e0b",
      },
      {
        name: "CSS",
        value: formattedCdnFiles.filter((f) => f.fileType === "css").length,
        color: "#3b82f6",
      },
      {
        name: "Images",
        value: formattedCdnFiles.filter((f) => f.fileType === "image").length,
        color: "#10b981",
      },
      {
        name: "Videos",
        value: formattedCdnFiles.filter((f) => f.fileType === "video").length,
        color: "#8b5cf6",
      },
    ];

    const usageData = {
      subdomains: formattedSubdomains,
      cdnFiles: formattedCdnFiles,
    };

    const analytics = {
      userData,
      usageData,
      calculations: {
        subdomainUsage: Math.min(subdomainUsage, 100),
        fileUsage: Math.min(fileUsage, 100),
        mediaUsage: Math.min(mediaUsage, 100),
        jssCssUsage: Math.min(jssCssUsage, 100),
      },
      fileTypeData,
      monthlyUsage,
    };

    return res
      .status(200)
      .json(
        new apiResponse(200, analytics, "Analytics data fetched successfully")
      );
  } catch (error) {
    throw new apiError(500, `Failed to fetch analytics: ${error.message}`);
  }
});

// Helper function to generate monthly usage trend
const generateMonthlyUsage = async (userId) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentDate = new Date();
  const monthlyData = [];

  // Get last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i + 1,
      1
    );

    // Get subdomains created in this month
    const subdomainsCount = await SubDomain.countDocuments({
      owner: userId,
      createdAt: {
        $gte: targetDate,
        $lt: nextMonth,
      },
    });

    // Get CDN files created in this month
    const filesCount = await CDN.countDocuments({
      owner: userId,
      createdAt: {
        $gte: targetDate,
        $lt: nextMonth,
      },
    });

    // Get total storage used in files created this month
    const filesInMonth = await CDN.find({
      owner: userId,
      createdAt: {
        $gte: targetDate,
        $lt: nextMonth,
      },
    }).select("size");

    const storageUsed = filesInMonth.reduce(
      (total, file) => total + file.size,
      0
    );

    monthlyData.push({
      month: months[targetDate.getMonth()],
      subdomains: subdomainsCount,
      files: filesCount,
      storage: storageUsed,
    });
  }

  return monthlyData;
};

// Helper function to get file breakdown by type
const getFileTypeBreakdown = (cdnFiles, fileType) => {
  const files = cdnFiles.filter((f) => f.fileType === fileType);
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

// Helper function to get total size by file type
const getTotalSizeByType = (cdnFiles, fileType) => {
  return cdnFiles
    .filter((f) => f.fileType === fileType)
    .reduce((total, file) => total + file.size, 0);
};

export { getAnalytics, getFileTypeBreakdown, getTotalSizeByType };
