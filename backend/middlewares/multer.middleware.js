import multer from "multer";
import fs from "fs/promises";
import path from "path";

// This middleware will run before multer to capture the relative paths
export const captureRelativePaths = (req, res, next) => {
  let relativePaths = [];
  if (req.headers["x-relative-paths"]) {
    try {
      relativePaths = JSON.parse(req.headers["x-relative-paths"]);
    } catch (err) {
      console.error("Error parsing relative paths:", err);
    }
  }
  req.relativePaths = relativePaths;
  next();
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const baseUploadPath = path.join(
      process.cwd(),
      "public",
      "temp",
      `${req.user._id}`
    );

    // Get relative path from the captured paths
    const relativePaths = req.relativePaths || [];
    const matchingPath = relativePaths.find((p) =>
      p.includes(file.originalname)
    );

    if (matchingPath) {
      // Get the directory part of the relative path
      const relativeDir = path.dirname(matchingPath);
      // Create the full directory path
      const fullPath = path.join(baseUploadPath, relativeDir);

      try {
        // Create all necessary directories
        await fs.mkdir(fullPath, { recursive: true });
        cb(null, fullPath);
      } catch (err) {
        cb(err, fullPath);
      }
    } else {
      try {
        await fs.mkdir(baseUploadPath, { recursive: true });
        cb(null, baseUploadPath);
      } catch (err) {
        cb(err, baseUploadPath);
      }
    }
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const uploadFile = multer({ storage });
