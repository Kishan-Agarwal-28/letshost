import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { sendEmail } from "../helpers/sendEmail.js";
import { nanoid } from "nanoid";
import { APPURL, VERIFICATIONTOKENEXPIRYTIME, APPNAME } from "../constants.js";
import bcrypt from "bcrypt";
import { registerUserRedirectUri } from "../helpers/oAuth.helper.js";
import { AuthorizationCode } from "simple-oauth2";
import { GoogleClient, GithubClient, SpotifyClient } from "../oauth.secrets.js";
import mongoose from "mongoose";
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
} from "../services/cloudinary.service.js";
import { CDN } from "../models/cdn.model.js";
import { SubDomain } from "../models/subdomain.model.js";
import { deleteObjects, deleteFromCDN } from "../services/awsS3.service.js";
import {
  deleteEmptyFolders,
  deleteMediaFromCDN,
} from "../services/cloudinary.service.js";
import { redis } from "../db/connectRedis.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { Pricing } from "../models/pricing.model.js";
import { checkEmail } from "../services/checkMail.service.js";
import validator from "validator";
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
};
const generateAccessTokenAndRefreshToken = async (user) => {
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  } else if (password === email || password === username) {
    throw new apiError(400, "Password should not be same as username or email");
  } else {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    console.log(existingUser);
    if (existingUser && existingUser.oauth.providers.providerName === null) {
      if (
        existingUser.username === username &&
        existingUser.isVerified == true
      ) {
        throw new apiError(409, "User Username already taken");
      }
      throw new apiError(409, "User email already exists");
    } else if (
      existingUser &&
      existingUser.oauth.providers.providerName !== null &&
      existingUser.password
    ) {
      throw new apiError(409, "User password already set please login");
    } else if (
      existingUser &&
      existingUser.oauth.providers.providerName !== null &&
      !existingUser.password
    ) {
      const passwordSaved = await bcrypt.hash(password, 10);
      const updatedUser = await User.findByIdAndUpdate(existingUser._id, {
        $set: {
          password: passwordSaved,
        },
      }).select("-password -refreshToken");
      if (!updatedUser) {
        throw new apiError(
          500,
          "User not updated something went wrong while updating the user"
        );
      }
      return res
        .status(200)
        .json(new apiResponse(200, updatedUser, "User updated successfully"));
    } else {
      if (!(await checkEmail(email))) {
        throw new apiError(400, "Email is not deliverable or is disposable");
      }
      if (!validator.isStrongPassword(password)) {
        throw new apiError(400, "Password is not strong enough");
      }
      const verificationToken = nanoid(10);
      const verificationTokenExpiryDate =
        Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
      const avatar = await uploadOnCloudinary(
        `https://ui-avatars.com/api/?name=${username.replace(" ", "+")}&background=random&rounded=true&format=png&size=128`
      );
      const pricing = await Pricing.findOne({ tier: "free" });
      const user = await User.create({
        username,
        fullName: username,
        email,
        password,
        verificationToken,
        verificationTokenExpiryDate,
        avatar: avatar.url,
        fileLimit: pricing.fileLimit,
        cdnCSSJSlimit: pricing.cdnCSSJSlimit,
        cdnMedialimit: pricing.cdnMedialimit,
      });

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
      );
      if (!createdUser) {
        throw new apiError(
          500,
          "User not created something went wrong while registering the user"
        );
      }
      await sendEmail({
        to: createdUser.email,
        reason: "verify",
        data: {
          username: createdUser.username,
          token: createdUser.verificationToken,
        },
        toBeVerified: false,
      });
      const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user);
      return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
          new apiResponse(200, createdUser, "User registered successfully")
        );
    }
  }
});
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!password.trim()) {
    throw new apiError(400, "Password is required");
  }
  if (!username?.trim() && !email?.trim()) {
    throw new apiError(400, "Either username or email is required");
  } else {
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      throw new apiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new apiError(401, "Invalid credentials");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user);

    await user.save({ validateBeforeSave: false });
    if (!user.TwoFAEnabled) {
      const logginedUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
      if (!logginedUser) {
        throw new apiError(500, "Failed to login the user");
      }

      return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
          new apiResponse(
            200,
            { user: logginedUser, accessToken, refreshToken },
            "User logged in successfully"
          )
        );
    } else {
      const opts = await generateAuthenticationOptions({
        rpID: APPURL,
      });
      user.TwoFAchallenge = opts.challenge;
      await user.save({ validateBeforeSave: false });

      return res
        .cookie("user", user._id, cookieOptions)
        .json(
          new apiResponse(
            200,
            { challenge: opts },
            "User logged in successfully but pending 2FA"
          )
        );
    }
  }
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new apiResponse(200, {}, "User logged Out"));
});
const generateNewTokens = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  console.log(oldRefreshToken);
  if (!oldRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }
  const user = await User.findOne({ refreshToken: oldRefreshToken });
  if (!user) {
    throw new apiError(401, "Unauthorized request user not found");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new apiResponse(
        200,
        { accessToken, refreshToken },
        "Tokens generated successfully"
      )
    );
});
const verifyUser = asyncHandler(async (req, res) => {
  const token = req.body.verificationToken;
  if (!token) {
    throw new apiError(400, "Verification token is required");
  }
  const user = await User.findOne({ verificationToken: token }).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.verificationTokenExpiryDate < Date.now()) {
    throw new apiError(400, "Verification token expired");
  } else {
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiryDate = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "User verified successfully"));
  }
});
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "-password -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const verificationToken = nanoid(10);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiryDate =
    Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    to: user.email,
    reason: "forgotPassword",
    data: {
      username: user.username,
      token: user.verificationToken,
    },
    toBeVerified: false,
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset link sent to your email"));
});
const changePassword = asyncHandler(async (req, res) => {
  const { verificationToken, newPassword } = req.body;
  if (!verificationToken) {
    throw new apiError(400, "Verification token is required");
  }
  const user = await User.findOne({ verificationToken: verificationToken });
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.verificationTokenExpiryDate < Date.now()) {
    throw new apiError(400, "Verification token expired");
  }
  user.password = newPassword;
  user.verificationToken = undefined;
  user.verificationTokenExpiryDate = undefined;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, user, "Password changed successfully"));
});
const sendUpdatePasswordEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const verificationToken = nanoid(10);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiryDate =
    Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    to: user.email,
    reason: "updatePassword",
    data: {
      username: user.username,
      token: user.verificationToken,
    },
    html: null,
    userID: user._id,
    toBeVerified: false,
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Verification token sent to your email"));
});
const updatePassword = asyncHandler(async (req, res) => {
  const { verificationToken, newPassword, oldPassword } = req.body;
  if (!verificationToken) {
    throw new apiError(400, "Verification token is required");
  }
  const user = await User.findOne({ verificationToken: verificationToken });
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.verificationTokenExpiryDate < Date.now()) {
    throw new apiError(400, "Verification token expired");
  }
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    throw new apiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  user.verificationToken = undefined;
  user.verificationTokenExpiryDate = undefined;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, user, "Password changed successfully"));
});
const resendVerificationToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.verificationToken == undefined) {
    throw new apiError(400, "cannot find verification token to resend");
  }
  if (user.isVerified) {
    throw new apiError(400, "User is already verified");
  }
  const verificationToken = nanoid(10);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiryDate =
    Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    to: user.email,
    reason: "verify",
    data: {
      username: user.username,
      token: user.verificationToken,
    },
    toBeVerified: false,
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Verification token sent to your email"));
});
const changeEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const verificationToken = nanoid(10);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiryDate =
    Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
  await user.save({ validateBeforeSave: false });
  await sendEmail({
    to: user.email,
    reason: "emailChangeVerification",
    data: {
      username: user.username,
      token: user.verificationToken,
    },
    toBeVerified: false,
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Email change link sent to your email"));
});
const updateEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.verificationTokenExpiryDate < Date.now()) {
    throw new apiError(400, "Verification token expired");
  } else {
    if (!(await checkEmail(req.body.email))) {
      throw new apiError(400, "Email is not deliverable or is disposable");
    }
    const oldEmail = user.email;
    user.email = req.body.email;
    user.verificationToken = undefined;
    user.verificationTokenExpiryDate = undefined;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
      to: oldEmail,
      reason: "emailChange",
      data: {
        username: user.username,
        email: user.email,
      },
      toBeVerified: false,
    });
    return res
      .status(200)
      .json(new apiResponse(200, user, "Email updated successfully"));
  }
});
const forgotUserName = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    " -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { username: user.username },
          "Username found successfully"
        )
      );
  } else {
    throw new apiError(400, "Invalid Credentials");
  }
});
const forgotEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.body.username }).select(
    " -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    return res
      .status(200)
      .json(
        new apiResponse(200, { email: user.email }, "Email found successfully")
      );
  } else {
    throw new apiError(400, "Invalid Credentials");
  }
});
const changeUserName = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const userWithSameUsername = await User.findOne({
    username: req.body.username,
  });
  if (userWithSameUsername) {
    throw new apiError(400, "Username already exists");
  } else {
    user.username = req.body.username;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new apiResponse(200, user, "Username updated successfully"));
  }
});
const updateAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken "
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const oldAvatarUrl = user.avatar;

  const avatarLocalFilePath = req.files[0]?.path;
  if (!avatarLocalFilePath) {
    throw new apiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  if (!avatar.url) {
    throw new apiError(500, "Failed to upload avatar to cloudinary");
  }
  user.avatar = avatar.url;
  await user.save({ validateBeforeSave: false });
  await deleteOnCloudinary(oldAvatarUrl);
  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar updated successfully"));
});
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "subdomains",
        localField: "_id",
        foreignField: "owner",
        as: "subdomains",
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        avatar: 1,
        SDLimit: 1,
        subdomains: {
          subDomain: 1,
          public: 1,
          projectID: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        createdAt: 1,
        updatedAt: 1,
        oauth: {
          providers: {
            providerName: 1,
            sub: 1,
          },
        },
        tier: 1,
        fileLimit: 1,
        cdnCSSJSlimit: 1,
        cdnMedialimit: 1,
        totalMediaSize: 1,
        totalJsCssSize: 1,
        genCredits: 1,
        fullName: 1,
        description: 1,
        location: 1,
        coverImage: 1,
        links: 1,
        isCreator: 1,
        isVerified: 1,
        verificationToken: 1,
        verificationTokenExpiryDate: 1,
        TwoFAEnabled: 1,
        TwoFAverified: 1,
        refreshToken: 1,
      },
    },
  ]);

  if (!user) {
    throw new apiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, user[0], "User details fetched successfully"));
});
// ---------------------------------------------------------------------------------------------------------------------------------------
//o-auth controllers
// ---------------------------------------------------------------------------------------------------------------------------------------
const registerOauthUser = asyncHandler(async (req, res) => {
  const redirectUri = registerUserRedirectUri(req.query.provider);
  if (redirectUri == undefined) {
    throw new apiError(400, "Invalid provider");
  }
  res.redirect(redirectUri);
});
const handleGoogleOauthCallback = async (req, res) => {
  const { code } = req.query;

  if (code) {
    try {
      const tokenParams = {
        code: code,
        redirect_uri: `${process.env.BACKEND_URI}/api/v1/users/auth/oauth/google/callback`,
      };

      // Ensure the 'client' is properly initialized
      const client = new AuthorizationCode(GoogleClient);

      const accessToken = await client.getToken(tokenParams);

      if (accessToken.token) {
        const userData = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken.token.access_token}`
        );
        const userFromGoogle = await userData.json();
        const existingUser = await User.findOne({
          email: userFromGoogle.email,
        });
        if (existingUser) {
          const existingProvider = existingUser.oauth.providers.find(
            (provider) => provider.providerName === "google"
          );
          if (!existingProvider) {
            existingUser.oauth.providers.push({
              providerName: "google",
              sub: userFromGoogle.sub,
            });
            await existingUser.save({ validateBeforeSave: false });
          }
          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(existingUser);
          res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}/auth?status=${encodeURIComponent("User logged in successfully")}`
            );
        } else {
          const user = await User.create({
            username: userFromGoogle.name,
            fullName: userFromGoogle.name,
            email: userFromGoogle.email,
            avatar: userFromGoogle.picture,
            isVerified: userFromGoogle.email_verified,
            oauth: {
              providers: {
                providerName: "google",
                sub: userFromGoogle.sub,
              },
            },
            password: 123456,
            verificationToken: null,
            verificationTokenExpiryDate: null,
          });
          const createdUser = await User.findByIdAndUpdate(user._id, {
            $unset: {
              password: 1,
            },
          }).select("-password -refreshToken");
          if (!createdUser) {
            throw new apiError(
              500,
              "User not created something went wrong while registering the user"
            );
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user);

          return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}/auth?status=${encodeURIComponent("User registered successfully")}`
            );
        }
      } else {
        throw new Error("Token not returned from Google API");
      }
    } catch (error) {
      console.error("Error during token retrieval:", error);
      res
        .status(500)
        .json({ message: "Authentication failed", error: error.message });
    }
  } else {
    console.log("No authorization code provided");
    res.status(400).json("Authorization code not provided");
  }
};
const handleGithubOauthCallback = async (req, res) => {
  const { code } = req.query;

  if (code) {
    try {
      const tokenParams = {
        code: code,
        redirect_uri: `${process.env.BACKEND_URI}/api/v1/users/auth/oauth/github/callback`,
      };
      const client = new AuthorizationCode(GithubClient);

      const accessToken = await client.getToken(tokenParams);
      if (accessToken.token) {
        const userData = await fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken.token.access_token}`,
          },
        });
        const userEmailData = await fetch(
          "https://api.github.com/user/emails",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken.token.access_token}`,
            },
          }
        );
        const userFromGithub = await userData.json();
        const userFromGithubEmails = await userEmailData.json();
        console.log(userFromGithub);
        console.log(userFromGithubEmails);

        const existingUser = await User.findOne({
          email: userFromGithubEmails[0].email,
        });
        if (existingUser) {
          const existingProvider = existingUser.oauth.providers.find(
            (provider) => provider.providerName === "github"
          );
          if (!existingProvider) {
            existingUser.oauth.providers.push({
              providerName: "github",
              sub: userFromGithub.id,
            });
            await existingUser.save({ validateBeforeSave: false });
          }
          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(existingUser);

          res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}/auth?status=${encodeURIComponent("User logged in successfully")}`
            );
        } else {
          const user = await User.create({
            username: userFromGithub.login,
            fullName: userFromGithub.login,
            email: userFromGithubEmails[0].email,
            avatar: userFromGithub.avatar_url,
            isVerified: userFromGithubEmails[0].verified,
            oauth: {
              providers: {
                providerName: "github",
                sub: userFromGithub.id,
              },
            },
            password: 123456,
            verificationToken: null,
            verificationTokenExpiryDate: null,
          });
          const createdUser = await User.findByIdAndUpdate(user._id, {
            $unset: {
              password: 1,
            },
          }).select("-password -refreshToken");
          if (!createdUser) {
            throw new apiError(
              500,
              "User not created something went wrong while registering the user"
            );
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user);

          return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}/auth?status=${encodeURIComponent("User registered successfully")}`
            );
        }
      } else {
        throw new Error("Token not returned from Github API");
      }
    } catch (error) {
      console.error("Error during token retrieval:", error); // Log full error for debugging
      res
        .status(500)
        .json({ message: "Authentication failed", error: error.message });
    }
  } else {
    console.log("No authorization code provided");
    res.status(400).json("Authorization code not provided");
  }
};
const handleSpotifyOauthCallback = async (req, res) => {
  const { code } = req.query;
  console.log(code);
  if (code) {
    try {
      const tokenParams = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.BACKEND_URI}/api/v1/users/auth/oauth/spotify/callback`,
      };
      const client = new AuthorizationCode(SpotifyClient);

      const accessToken = await client.getToken(tokenParams);
      console.log(accessToken);
      if (accessToken.token) {
        const userData = await fetch("https://api.spotify.com/v1/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken.token.access_token}`,
          },
        });

        const userFromSpotify = await userData.json();
        console.log(userFromSpotify);
        const existingUser = await User.findOne({
          email: userFromSpotify.email,
        });
        if (existingUser) {
          const existingProvider = existingUser.oauth.providers.find(
            (provider) => provider.providerName === "spotify"
          );
          if (!existingProvider) {
            existingUser.oauth.providers.push({
              providerName: "spotify",
              sub: userFromSpotify.id,
            });
            await existingUser.save({ validateBeforeSave: false });
          }
          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(existingUser);

          res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User logged in successfully")}`
            );
        } else {
          let avatarUrl;
          if (userFromSpotify.images[0]?.url) {
            avatarUrl = userFromSpotify.images[0].url;
          } else {
            const avatar = await uploadOnCloudinary(
              `https://ui-avatars.com/api/?name=${userFromSpotify.display_name.replace(" ", "+")}&background=random&rounded=true&format=png&size=128`
            );
            avatarUrl = avatar.url;
          }
          const verificationToken = nanoid(10);
          const verificationTokenExpiryDate =
            Date.now() + VERIFICATIONTOKENEXPIRYTIME * 1000;
          const user = await User.create({
            username: userFromSpotify.display_name,
            fullName: userFromSpotify.display_name,
            email: userFromSpotify.email,
            avatar: avatarUrl,
            oauth: {
              providers: {
                providerName: "spotify",
                sub: userFromSpotify.id,
              },
            },
            password: 123456,
            verificationToken,
            verificationTokenExpiryDate,
          });
          const createdUser = await User.findByIdAndUpdate(user._id, {
            $unset: {
              password: 1,
            },
          }).select("-password -refreshToken");
          if (!createdUser) {
            throw new apiError(
              500,
              "User not created something went wrong while registering the user"
            );
          }
          await sendEmail({
            to: createdUser.email,
            reason: "verify",
            data: {
              username: createdUser.username,
              token: createdUser.verificationToken,
            },
            toBeVerified: true,
          });
          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user);

          return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User registered successfully")}`
            );
        }
      } else {
        throw new Error("Token not returned from Spotify API");
      }
    } catch (error) {
      console.error("Error during token retrieval:", error); // Log full error for debugging
      res
        .status(500)
        .json({ message: "Authentication failed", error: error.message });
    }
  } else {
    console.log("No authorization code provided");
    res.status(400).json("Authorization code not provided");
  }
};
const handleFacebookOauthCallback = async (req, res) => {
  const { code } = req.query;

  if (code) {
    try {
      const tokenParams = {
        code: code,
        redirect_uri: `${process.env.BACKEND_URI}/api/v1/users/auth/oauth/facebook/callback`,
      };

      const client = new AuthorizationCode(FacebookClient);

      const accessToken = await client.getToken(tokenParams);
      if (accessToken.token) {
        const userData = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken.token.access_token}`
        );
        const userFromFacebook = await userData.json();
        console.log(userFromFacebook);

        const existingUser = await User.findOne({
          email: userFromFacebook.email,
        });
        if (existingUser) {
          const existingProvider = existingUser.oauth.providers.find(
            (provider) => provider.providerName === "facebook"
          );
          if (!existingProvider) {
            existingUser.oauth.providers.push({
              providerName: "facebook",
              sub: userFromFacebook.id,
            });
            await existingUser.save({ validateBeforeSave: false });
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(existingUser);

          return res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User logged in successfully")}`
            );
        } else {
          const user = await User.create({
            username: userFromFacebook.name,
            email: userFromFacebook.email,
            avatar: userFromFacebook.picture.data.url,
            isVerified: true, // Facebook email is always verified
            oauth: {
              providers: [
                {
                  providerName: "facebook",
                  sub: userFromFacebook.id,
                },
              ],
            },
            password: 123456, // You can choose to generate a random password or use some other logic
            verificationToken: null,
            verificationTokenExpiryDate: null,
          });

          const createdUser = await User.findByIdAndUpdate(user._id, {
            $unset: {
              password: 1,
            },
          }).select("-password -refreshToken");

          if (!createdUser) {
            throw new apiError(
              500,
              "User not created, something went wrong while registering the user"
            );
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user);

          return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User registered successfully")}`
            );
        }
      } else {
        throw new Error("Token not returned from Facebook API");
      }
    } catch (error) {
      console.error("Error during token retrieval:", error);
      res
        .status(500)
        .json({ message: "Authentication failed", error: error.message });
    }
  } else {
    console.log("No authorization code provided");
    res.status(400).json("Authorization code not provided");
  }
};
const handleMicrosoftOauthCallback = async (req, res) => {
  const { code } = req.query;

  if (code) {
    try {
      const tokenParams = {
        code: code,
        redirect_uri: `${process.env.BACKEND_URI}/api/v1/users/auth/oauth/microsoft/callback`,
      };

      const client = new AuthorizationCode(MicrosoftClient);

      const accessToken = await client.getToken(tokenParams);
      if (accessToken.token) {
        const userData = await fetch("https://graph.microsoft.com/v1.0/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken.token.access_token}`,
          },
        });

        const userFromMicrosoft = await userData.json();
        console.log(userFromMicrosoft);

        const existingUser = await User.findOne({
          email: userFromMicrosoft.mail || userFromMicrosoft.userPrincipalName,
        });
        if (existingUser) {
          const existingProvider = existingUser.oauth.providers.find(
            (provider) => provider.providerName === "microsoft"
          );
          if (!existingProvider) {
            existingUser.oauth.providers.push({
              providerName: "microsoft",
              sub: userFromMicrosoft.id,
            });
            await existingUser.save({ validateBeforeSave: false });
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(existingUser);

          return res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User logged in successfully")}`
            );
        } else {
          const user = await User.create({
            username: userFromMicrosoft.displayName,
            email:
              userFromMicrosoft.mail || userFromMicrosoft.userPrincipalName,
            avatar: userFromMicrosoft.photo
              ? userFromMicrosoft.photo
              : "default-avatar-url", // Adjust according to the API response
            isVerified: true, // Microsoft email is verified by default
            oauth: {
              providers: [
                {
                  providerName: "microsoft",
                  sub: userFromMicrosoft.id,
                },
              ],
            },
            password: 123456, // You can generate a random password
            verificationToken: null,
            verificationTokenExpiryDate: null,
          });

          const createdUser = await User.findByIdAndUpdate(user._id, {
            $unset: {
              password: 1,
            },
          }).select("-password -refreshToken");

          if (!createdUser) {
            throw new apiError(
              500,
              "User not created, something went wrong while registering the user"
            );
          }

          const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user);

          return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .redirect(
              302,
              `${APPURL}?status=${encodeURIComponent("User registered successfully")}`
            );
        }
      } else {
        throw new Error("Token not returned from Microsoft API");
      }
    } catch (error) {
      console.error("Error during token retrieval:", error);
      res
        .status(500)
        .json({ message: "Authentication failed", error: error.message });
    }
  } else {
    console.log("No authorization code provided");
    res.status(400).json("Authorization code not provided");
  }
};
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const subdomains = await SubDomain.find({ owner: req.user._id });
  const cdns = await CDN.find({ owner: req.user._id });

  const ProjectIds = subdomains.map((subdomain) => subdomain.projectID);
  const CDNIds = cdns.map((cdn) => cdn.projectID);

  console.log(
    `Deleting user ${req.user._id}: ${subdomains.length} subdomains, ${cdns.length} CDNs`
  );

  const formatSubdomainKey = (subdomain) => `user_${subdomain}`;

  // Helper function to handle individual CDN deletion with error handling
  const deleteCDNSafely = async (cdn) => {
    try {
      if (cdn.bucketAssigned === "cdn") {
        // Delete from S3 CDN bucket
        console.log(`Deleting S3 CDN: ${cdn.cdnProjectID}`);
        return deleteFromCDN(
          req.user._id,
          cdn.cdnProjectID,
          cdn.currentVersion,
          cdn.fileType
        );
      } else {
        // Delete from Cloudinary
        const folder =
          cdn.fileType === "image"
            ? "img"
            : cdn.fileType === "video"
              ? "video"
              : "";

        if (folder) {
          console.log(
            `Deleting Cloudinary CDN: ${cdn.cdnProjectID}, folder: ${folder}, version: ${cdn.currentVersion}`
          );

          // Delete media files from Cloudinary
          const deleteResult = await deleteMediaFromCDN(
            req.user._id,
            cdn.currentVersion,
            folder,
            cdn.cdnProjectID,
            null
          );
          console.log(`Delete media result:`, deleteResult);

          // Delete empty folders from Cloudinary
          const folderResult = await deleteEmptyFolders(
            req.user._id,
            folder,
            cdn.cdnProjectID
          );
          console.log(`Delete folder result:`, folderResult);
        } else {
          console.warn(
            `Unknown file type for CDN ${cdn.cdnProjectID}: ${cdn.fileType}`
          );
        }
      }
      return { success: true, cdn: cdn.cdnProjectID };
    } catch (error) {
      console.error(`Error deleting CDN ${cdn.cdnProjectID}:`, error);
      return { success: false, cdn: cdn.cdnProjectID, error: error.message };
    }
  };

  // Helper function to handle individual subdomain deletion with error handling
  const deleteSubdomainSafely = async (projectID) => {
    try {
      console.log(`Deleting subdomain files: ${projectID}`);
      await deleteObjects(`${req.user._id}/${projectID}`);
      return { success: true, projectID };
    } catch (error) {
      console.error(`Error deleting subdomain ${projectID}:`, error);
      return { success: false, projectID, error: error.message };
    }
  };

  // Helper function to handle Redis deletion with error handling
  const deleteRedisSafely = async (subdomain) => {
    try {
      const formattedSubdomain = formatSubdomainKey(subdomain.subDomain);
      const getOldKeyDataRedis = await redis.get(formattedSubdomain);
      if (getOldKeyDataRedis) {
        await redis.del(formattedSubdomain);
        console.log(`Deleted Redis key: ${formattedSubdomain}`);
      }
      return { success: true, subdomain: formattedSubdomain };
    } catch (error) {
      console.error(
        `Error deleting Redis key for ${subdomain.subDomain}:`,
        error
      );
      return {
        success: false,
        subdomain: subdomain.subDomain,
        error: error.message,
      };
    }
  };

  try {
    // Delete subdomain files from S3 with individual error handling
    const subdomainResults = await Promise.allSettled(
      ProjectIds.map(deleteSubdomainSafely)
    );

    // Delete CDN files with individual error handling
    const cdnResults = await Promise.allSettled(cdns.map(deleteCDNSafely));

    // Delete Redis cache entries for subdomains with individual error handling
    const redisResults = await Promise.allSettled(
      subdomains.map(deleteRedisSafely)
    );

    // Log results
    const subdomainFailures = subdomainResults.filter(
      (r) => r.status === "rejected" || !r.value?.success
    );
    const cdnFailures = cdnResults.filter(
      (r) => r.status === "rejected" || !r.value?.success
    );
    const redisFailures = redisResults.filter(
      (r) => r.status === "rejected" || !r.value?.success
    );

    if (subdomainFailures.length > 0) {
      console.warn(`Failed to delete ${subdomainFailures.length} subdomain(s)`);
    }

    if (cdnFailures.length > 0) {
      console.warn(`Failed to delete ${cdnFailures.length} CDN(s)`);
    }

    if (redisFailures.length > 0) {
      console.warn(`Failed to delete ${redisFailures.length} Redis key(s)`);
    }

    // Delete database records (this should succeed even if file deletions failed)
    await SubDomain.deleteMany({ owner: req.user._id });
    console.log(`Deleted ${subdomains.length} subdomain records from database`);

    await CDN.deleteMany({ owner: req.user._id });
    console.log(`Deleted ${cdns.length} CDN records from database`);

    await User.findByIdAndDelete(req.user._id);
    console.log(`Deleted user ${req.user._id} from database`);

    // Prepare response message
    const totalFailures =
      subdomainFailures.length + cdnFailures.length + redisFailures.length;
    let message = "User deleted successfully";

    if (totalFailures > 0) {
      message += ` (with ${totalFailures} file/cache deletion warnings - check logs)`;
    }

    return res.status(200).json(
      new apiResponse(
        200,
        {
          subdomainsDeleted: subdomains.length,
          cdnsDeleted: cdns.length,
          warnings: totalFailures,
        },
        message
      )
    );
  } catch (error) {
    console.error("Critical error during user deletion:", error);

    throw new apiError(500, `Failed to delete user: ${error.message}`);
  }
});
const checkPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    return res
      .status(200)
      .json(new apiResponse(200, { status: true }, "Password is correct"));
  } else {
    return res
      .status(200)
      .json(new apiResponse(200, { status: false }, "Password is incorrect"));
  }
});
// ---------------------------------------------------------------------------------------------------------------------------------------
// 2fa controllers
// ---------------------------------------------------------------------------------------------------------------------------------------
const initialize2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    " -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const { password } = req.body;
  if (!password) {
    throw new apiError(400, "Password is required to initialize 2FA");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    throw new apiError(400, "Password is incorrect");
  }
  const challengePayload = await generateRegistrationOptions({
    rpID: APPURL,
    rpName: APPNAME,
    attestationType: "none",
    userName: user.username,
    timeout: 60000,
    extensions: {
      credProps: true,
    },
  });
  user.TwoFAchallenge = challengePayload.challenge;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(
      new apiResponse(200, challengePayload, "2FA initialized successfully")
    );
});
const verify2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const { cred } = req.body;
  if (user.TwoFAverified) {
    throw new apiError(400, "User is already verified");
  }
  if (user.TwoFAchallenge === null) {
    throw new apiError(400, "2FA not initialized");
  }
  const verificationResult = await verifyRegistrationResponse({
    expectedChallenge: user.TwoFAchallenge,
    expectedOrigin: APPURL,
    expectedRPID: APPURL,
    response: cred,
  });
  if (!verificationResult.verified) {
    throw new apiError(400, "Verification failed");
  }
  if (verificationResult.registrationInfo === undefined) {
    throw new apiError(500, "Registration info not found");
  }
  user.PassKey = verificationResult.registrationInfo.credential;
  user.TwoFAEnabled = true;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, user, "2FA verified successfully"));
});
const verify2FALogin = asyncHandler(async (req, res) => {
  const userID = req.cookies?.user;
  console.log(userID);
  const user = await User.findById(userID).select(
    "-password -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  user.TwoFAverified = false;
  await user.save({ validateBeforeSave: false });
  const { cred } = req.body;
  console.log(cred);
  if (user.TwoFAchallenge === null) {
    throw new apiError(400, "2FA challenge not found");
  }
  if (user.PassKey === null) {
    throw new apiError(500, "2FA key not found");
  }
  const result = await verifyAuthenticationResponse({
    expectedChallenge: user.TwoFAchallenge,
    expectedOrigin: APPURL,
    expectedRPID: APPURL,
    response: cred,
    credential: {
      id: user.PassKey.id,
      publicKey: new Uint8Array(user.PassKey.publicKey.buffer),
      counter: user.PassKey.counter,
      transports: user.PassKey.transports,
    },
  });
  if (!result.verified) {
    throw new apiError(400, "Verification failed");
  }
  user.TwoFAverified = true;
  await user.save({ validateBeforeSave: false });
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  return res
    .clearCookie("user")
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new apiResponse(200, user, "User logged in successfully"));
});
const disable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    " -refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (!req.body.password) {
    throw new apiError(400, "Password is required");
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    throw new apiError(400, "Password is incorrect");
  }
  if (user.TwoFAEnabled) {
    user.TwoFAEnabled = false;
    user.TwoFAverified = false;
    user.TwoFAchallenge = null;
    user.PassKey = null;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new apiResponse(200, user, "2FA disabled successfully"));
  } else {
    return res
      .status(200)
      .json(new apiResponse(200, user, "2FA is already disabled"));
  }
});
const userHasPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.password) {
    return res
      .status(200)
      .json(new apiResponse(200, true, "User has password"));
  } else {
    return res
      .status(200)
      .json(new apiResponse(200, false, "User does not have password"));
  }
});
const setPasswordForOauthUser= asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-refreshToken -verificationToken -verificationTokenExpiryDate"
  );
  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (user.password) {
    throw new apiError(400, "User already has password");
  }
  const { password } = req.body;
  if (!password) {
    throw new apiError(400, "Password is required");
  }
  if(user.oauth.providers.length === 0) {
    throw new apiError(400, "User does not have any oauth providers");
  }
  if(user.isVerified) {
    throw new apiError(400, "User is already verified");
  }
  user.password = password;
  await user.save();
  return res
    .status(200)
    .json(new apiResponse(200, user, "Password set successfully"));
});
export {
  registerUser,
  registerOauthUser,
  loginUser,
  logoutUser,
  generateNewTokens,
  verifyUser,
  forgotPassword,
  changePassword,
  resendVerificationToken,
  changeEmail,
  updateEmail,
  forgotUserName,
  forgotEmail,
  changeUserName,
  updateAvatar,
  handleGoogleOauthCallback,
  handleGithubOauthCallback,
  handleSpotifyOauthCallback,
  handleFacebookOauthCallback,
  handleMicrosoftOauthCallback,
  getUserDetails,
  sendUpdatePasswordEmail,
  updatePassword,
  deleteUser,
  initialize2FA,
  verify2FA,
  verify2FALogin,
  checkPassword,
  disable2FA,
  userHasPassword,
  setPasswordForOauthUser,
};
