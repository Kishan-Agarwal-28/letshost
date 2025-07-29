import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { type } from "os";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      minlength: 3,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      minlength: 3,
    },
    description: {
      type: String,
      minlength: 10,
      maxlength: 500,
    },
    coverImage: {
      type: String,
    },
    location: {
      type: String,
    },
    links: [
      {
        socialPlatform: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    isCreator: {
      type: Boolean,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
    },
    oauth: {
      providers: [
        {
          providerName: {
            type: String,
            default: null,
            enum: ["google", "github", "spotify", "microsoft", "facebook"],
          },
          sub: {
            type: String,
            default: null,
          },
        },
      ],
    },
    SDLimit: {
      type: Number,
      default: 10,
      validate(value) {
        if (value < 0) throw new Error("SDLimit must be a positive number");
      },
      required: true,
    },
    tier: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
      required: true,
    },
    fileLimit: {
      type: Number,
      default: 0,
    },
    cdnCSSJSlimit: {
      type: Number,
      default: 0,
    },
    cdnMedialimit: {
      type: Number,
      default: 0,
    },
    totalMediaSize: {
      type: Number,
      default: 0,
    },
    totalJsCssSize: {
      type: Number,
      default: 0,
    },
    genCredits: {
      type: Number,
      default: 10,
    },
    password: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenExpiryDate: {
      type: Date,
      default: null,
    },
    TwoFAchallenge: {
      type: String,
      default: null,
    },
    TwoFAEnabled: {
      type: Boolean,
      default: false,
    },
    TwoFAverified: {
      type: Boolean,
      default: false,
    },
    PassKey: {
      type: Schema.Types.Mixed,
      default: null,
      required: function () {
        return this.TwoFAEnabled && this.TwoFAverified;
      },
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.pre("save", async function (next) {
  // If none of the limits are being modified, skip
  if (
    !this.isModified("fileLimit") &&
    !this.isModified("SDLimit") &&
    !this.isModified("cdnCSSJSlimit") &&
    !this.isModified("cdnMedialimit")
  ) {
    return next();
  }

  try {
    const pricing = await this.model("Pricing").findOne({ tier: this.tier });

    if (!pricing) {
      return next(new Error(`No pricing found for tier: ${this.tier}`));
    }

    if (this.isModified("fileLimit") && this.fileLimit > pricing.fileLimit) {
      return next(new Error("File limit exceeded"));
    }

    if (this.isModified("SDLimit") && this.SDLimit > pricing.SDLimit) {
      return next(new Error("Subdomain limit exceeded"));
    }

    if (
      this.isModified("cdnCSSJSlimit") &&
      this.cdnCSSJSlimit > pricing.cdnCSSJSlimit
    ) {
      return next(new Error("CSS/JS CDN limit exceeded"));
    }

    if (
      this.isModified("cdnMedialimit") &&
      this.cdnMedialimit > pricing.cdnMedialimit
    ) {
      return next(new Error("Media CDN limit exceeded"));
    }

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.plugin(mongooseAggregatePaginate);
export const User = mongoose.model("User", userSchema);
