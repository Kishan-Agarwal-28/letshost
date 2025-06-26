import asyncHandler from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js';
import { nanoid } from 'nanoid';
import {CDN} from "../models/cdn.model.js";
import {User} from "../models/user.model.js";
import {apiResponse} from "../utils/apiResponse.js";
import mime from 'mime-types';
import { uploadToCDN, deleteFromCDN } from '../services/awsS3.service.js';
import { Pricing } from '../models/pricing.model.js';
import { uploadMediaToCDN, uploadMediaVideoToCDN, deleteMediaFromCDN, deleteEmptyFolders } from '../services/cloudinary.service.js';
import mongoose from 'mongoose';

const registerCDN = asyncHandler(async (req, res) => {
    
    if(!req.user._id){
        throw new apiError(400,"User ID is required");
    }
    const user=await User.findById(req.user._id);
    if(!user){
        throw new apiError(404,"User not found");
    }
    
    
    if((!req.files || req.files?.length === 0)&&!req.body.fileMetaData){
        
        throw new apiError(400,"No files uploaded");
    }
    
        const types=mime.lookup(Array.isArray(req.files)?req.files[0].filename:req.body.fileMetaData.filename);
        console.log("types", types);
        const contentType=types.toString()?.toLowerCase()?.includes("javascript")?"js"
        :types.toString()?.toLowerCase()?.includes("css")?"css"
        :types.toString()?.toLowerCase()?.includes("image")?"image"
        :types.toString()?.toLowerCase()?.includes("video")?"video"
        :types.toString()?.toLowerCase()?.includes("mp4")?"video"
        :undefined;
        if(!contentType){
            throw new apiError(400,"Unsupported file type");
        }
        const userID=req.user._id;
        const currentVersion=100;
        const prevVersion=0;
        const cdnProjectID=nanoid(10);
        const pricing=await Pricing.findOne({tier:user.tier});
        let url;
        let  cdn;
        switch(contentType){
            case "js":
               
               if((user.totalJsCssSize+req.files[0].size)>pricing.cdnCSSJSlimit){
                   throw new apiError(400,"File size exceeds the limit upgrade to pro tier");
               }

                url= await uploadToCDN(userID,currentVersion,prevVersion,cdnProjectID);
               if(!url){
                   throw new apiError(400,"Failed to upload to CDN");
               }
              
                cdn=await CDN.create({
                owner:req.user._id,
                cdnProjectID:cdnProjectID,
                filename:req.files[0].filename,
                fileType:contentType,
                currentVersion:currentVersion,
                previousVersion:prevVersion,
                size:req.files[0].size,
                bucketAssigned:"cdn",
                relativePath:url,
                secureUrl:`https://cdn.letshost.dpdns.org/${url}`
               })
               
               user.totalJsCssSize+=req.files[0].size;
               await user.save();
               return res.status(200)
               .json(new apiResponse(200,cdn,"File uploaded successfully"));




            case "css":
                 
               if((user.totalJsCssSize+req.files[0].size)>pricing.cdnCSSJSlimit){
                   throw new apiError(400,"File size exceeds the limit upgrade to pro tier");
               }
                 url= await uploadToCDN(userID,currentVersion,prevVersion,cdnProjectID);
                if(!url){
                    throw new apiError(400,"Failed to upload to CDN");
                }
                 cdn=await CDN.create({
                owner:req.user._id,
                cdnProjectID:cdnProjectID,
                filename:req.files[0].filename,
                fileType:contentType,
                currentVersion:currentVersion,
                previousVersion:prevVersion,
                size:req.files[0].size,
                bucketAssigned:"cdn",
                relativePath:url,
                secureUrl:`https://cdn.letshost.dpdns.org/${url}`
               })
                
               user.totalJsCssSize+=req.files[0].size;
               await user.save();
                return res.status(200)
                .json(new apiResponse(200,cdn,"File uploaded successfully"));




            case "image":
                
               if((user.totalMediaSize+req.files[0].size)>pricing.cdnCSSJSlimit){
                   throw new apiError(400,"File size exceeds the limit upgrade to pro tier");
               }
               const uploadResult= await uploadMediaToCDN(userID,currentVersion,prevVersion,cdnProjectID);
               
               if(!uploadResult){
                   throw new apiError(400,"Failed to upload to CDN");
               }
               const pathname=new URL(uploadResult.url).pathname;
               const ImageUrl=pathname.replace("/testifywebdev/","");
               cdn=await CDN.create({
                owner:req.user._id,
                cdnProjectID:cdnProjectID,
                filename:req.files[0].filename,
                fileType:contentType,
                currentVersion:currentVersion,
                previousVersion:prevVersion,
                size:req.files[0].size,
                bucketAssigned:"cloudinary",
                relativePath:uploadResult.url,
                secureUrl:`https://cdn.letshost.dpdns.org/${ImageUrl}`
               })
               
               user.totalMediaSize+=req.files[0].size;
               await user.save();
               return res.status(200)
               .json(new apiResponse(200,cdn,"File uploaded successfully"));



            case "video":
                if(!req.body.fileMetaData){
                    throw new apiError(400,"No files metadata uploaded");
                }

               if((user.totalMediaSize+req.body.fileMetaData.size)>pricing.cdnMedialimit){
                   throw new apiError(400,"File size exceeds the limit upgrade to pro tier");
               }
                const uploadResultVideo= await uploadMediaVideoToCDN(userID, currentVersion, prevVersion, cdnProjectID);
                if(!uploadResultVideo){
                    throw new apiError(400,"Failed to upload to CDN");
                }

                cdn=await CDN.create({
                owner:req.user._id,
                cdnProjectID:cdnProjectID,
                filename:req.body.fileMetaData.filename,
                fileType:contentType,
                currentVersion:currentVersion,
                previousVersion:prevVersion,
                size:0,
                bucketAssigned:"cloudinary",
                relativePath:uploadResultVideo.public_id,
                secureUrl:"waiting for video upload"
               })
               
               user.totalMediaSize+=req.body.fileMetaData.size;
               await user.save();
               return res.status(200)
               .json(new apiResponse(200,uploadResultVideo,"File uploaded successfully")); 
            default:
                throw new apiError(400,"Unsupported file type");
        }
        
})

const getCDN = asyncHandler(async (req, res) => {
    if(!req.user._id){
        throw new apiError(400,"User ID is required");
    }
   const data=await CDN.aggregate([
    {
        $match:{
            owner:new mongoose.Types.ObjectId(req.user._id)
        }
    }
   ])
    return res.status(200)
    .json(new apiResponse(200,data,"CDN details fetched successfully"));
})

const updateCDN = asyncHandler(async (req, res) => {
    const { cdnProjectID } = req.body;
    console.log(cdnProjectID);
    
    if (!cdnProjectID) {
        throw new apiError(400, "cdnProjectID is required");
    }
    if (!req.user._id) {
        throw new apiError(400, "User ID is required");
    }
    
    const prevCdn = await CDN.findOne({ cdnProjectID: cdnProjectID });
    if (!prevCdn) {
        throw new apiError(404, "CDN not found");
    }
    if (prevCdn.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "Unauthorized: You don't own this CDN");
    }
    
    if ((!req.files || req.files?.length === 0) && !req.body.fileMetaData) {
        throw new apiError(400, "No files uploaded");
    }
    
    const types = mime.lookup(Array.isArray(req.files) ? req.files[0].filename : req.body.fileMetaData.filename);
    console.log("types", types);
    
    const contentType = types.toString()?.toLowerCase()?.includes("javascript") ? "js"
        : types.toString()?.toLowerCase()?.includes("css") ? "css"
        : types.toString()?.toLowerCase()?.includes("image") ? "image"
        : types.toString()?.toLowerCase()?.includes("video") ? "video"
        : types.toString()?.toLowerCase()?.includes("mp4") ? "video"
        : undefined;
        
    if (!contentType) {
        throw new apiError(400, "Unsupported file type");
    }
    
    const userID = req.user._id;
    const currentVersion = Number(prevCdn.currentVersion) + 1;
    const previousVersion = prevCdn.currentVersion;
    const cdnID = cdnProjectID;
    const user = await User.findById(req.user._id);
    const pricing = await Pricing.findOne({ tier: user.tier });
    let url;
    
    switch (contentType) {
        case "js":
            if ((user.cdnCSSJSlimit+req.files[0].size-prevCdn.size) > pricing.cdnCSSJSlimit) {
                throw new apiError(400, "File size exceeds the limit upgrade to pro tier");
            }

            url = await uploadToCDN(userID, currentVersion, previousVersion, cdnID);
            if (!url) {
                throw new apiError(400, "Failed to upload to CDN");
            }
            
            user.totalJsCssSize = user.totalJsCssSize - prevCdn.size + req.files[0].size;
            await user.save();
            
            prevCdn.filename = req.files[0].filename;
            prevCdn.relativePath = url;
            prevCdn.currentVersion = currentVersion;
            prevCdn.previousVersion = previousVersion;
            prevCdn.size = req.files[0].size;
            prevCdn.secureUrl=`https://cdn.letshost.dpdns.org/${url}`
            await prevCdn.save();
            
            return res.status(200)
                .json(new apiResponse(200, prevCdn, "File uploaded successfully"));

        case "css":
            if ((user.cdnCSSJSlimit+req.files[0].size-prevCdn.size) > pricing.cdnCSSJSlimit) {
                throw new apiError(400, "File size exceeds the limit upgrade to pro tier");
            }
            
            url = await uploadToCDN(userID, currentVersion, previousVersion, cdnID);
            if (!url) {
                throw new apiError(400, "Failed to upload to CDN");
            }
            
            user.totalJsCssSize = user.totalJsCssSize - prevCdn.size + req.files[0].size;
            await user.save();
            
            prevCdn.filename = req.files[0].filename;
            prevCdn.relativePath = url;
            prevCdn.currentVersion = currentVersion;
            prevCdn.previousVersion = previousVersion;
            prevCdn.size = req.files[0].size;
            prevCdn.secureUrl=`https://cdn.letshost.dpdns.org/${url}`
            await prevCdn.save();

            return res.status(200)
                .json(new apiResponse(200, prevCdn, "File uploaded successfully"));

        case "image":
            if ((user.totalMediaSize + req.files[0].size-prevCdn.size) > pricing.cdnMedialimit) {
                throw new apiError(400, "File size exceeds the limit upgrade to pro tier");
            }
            
            const uploadResult = await uploadMediaToCDN(userID, currentVersion, previousVersion, cdnID);
            if (!uploadResult) {
                throw new apiError(400, "Failed to upload to CDN");
            }
            
            user.totalMediaSize = user.totalMediaSize - prevCdn.size + req.files[0].size;
            await user.save();
            const pathname=new URL(uploadResult.url).pathname;
            const ImageUrl=pathname.replace("/testifywebdev/","");
            prevCdn.filename = req.files[0].filename;
            prevCdn.relativePath = uploadResult.url;
            prevCdn.currentVersion = currentVersion;
            prevCdn.previousVersion = previousVersion;
            prevCdn.size = req.files[0].size;
            prevCdn.secureUrl=`https://cdn.letshost.dpdns.org/${ImageUrl}`
            await prevCdn.save();

            return res.status(200)
                .json(new apiResponse(200, prevCdn, "File uploaded successfully"));

        case "video":
            if (!req.body.fileMetaData) {
                throw new apiError(400, "No files metadata uploaded");
            }
            
            if ((user.cdnMedialimit+req.body.fileMetaData.size-prevCdn.size )> pricing.cdnMedialimit) {
                throw new apiError(400, "File size exceeds the limit upgrade to pro tier");
            }
            
            const uploadResultVideo = await uploadMediaVideoToCDN(userID, currentVersion, previousVersion, cdnID);
            if (!uploadResultVideo) {
                throw new apiError(400, "Failed to upload to CDN");
            }
            
            user.totalMediaSize = user.totalMediaSize - prevCdn.size + req.body.fileMetaData.size;
            await user.save();
            prevCdn.filename = req.body.fileMetaData.filename;
            prevCdn.relativePath = uploadResultVideo.public_id;
            prevCdn.currentVersion = currentVersion;
            prevCdn.previousVersion = previousVersion;
            prevCdn.size = 0;
            await prevCdn.save();

            return res.status(200)
                .json(new apiResponse(200, uploadResultVideo, "File uploaded successfully"));
                
        default:
            throw new apiError(400, "Unsupported file type");
    }
});

const deleteCDN=asyncHandler(async (req,res)=>{
    const {cdnId}=req.body;
    const user=await User.findById(req.user._id);

    if(!cdnId){
        throw new apiError(400,"cdnId is required");
    }
    if(!req.user._id){
        throw new apiError(400,"User ID is required");
    }
    const prevCdn=await CDN.findOne({cdnProjectID:cdnId});
    if(!prevCdn){
        throw new apiError(404,"CDN not found");
    }
    if(prevCdn.owner.toString()!==req.user._id.toString()){
        throw new apiError(403,"Unauthorized: You don't own this CDN");
    }
    if(prevCdn.bucketAssigned==="cdn"){
        

        await deleteFromCDN(req.user._id,prevCdn.cdnProjectID,prevCdn.currentVersion,prevCdn.fileType);

            user.totalJsCssSize=Math.max(user.totalJsCssSize-prevCdn.size,0);
            await user.save();
    }
   
    else{
        
          const publicId=prevCdn.relativePath.includes("http://res.cloudinary.com/testifywebdev/")?prevCdn.relativePath.split("/").pop().split(".")[0]:prevCdn.relativePath;

        const folder=prevCdn.fileType==="image"?"img":prevCdn.fileType==="video"?"video":"";

        await deleteMediaFromCDN(req.user._id,prevCdn.currentVersion,folder,prevCdn.cdnProjectID);
        // await deleteEmptyFolders(req.user._id,folder,prevCdn.cdnProjectID);
       user.totalJsCssSize=Math.max(user.totalJsCssSize-prevCdn.size,0);
        await user.save();
    }
    await CDN.deleteOne({cdnProjectID:cdnId});  
    return res.status(200)
    .json(new apiResponse(200,{},"CDN deleted successfully"));
})
const confirmVideoUpload=asyncHandler(async (req,res)=>{

    if(req.body.notification_type==="upload" && req.body.resource_type==="video"){
       const public_id = req.body.public_id.split("/").pop();
        const playbackUrl = req.body.url;
    
    const cdn=await CDN.findOne({relativePath:public_id});
    if(!cdn){
        throw new apiError(404,"CDN not found");
    }

    if(cdn.bucketAssigned !="cdn"){
        cdn.relativePath=playbackUrl;
        cdn.size=req.body.bytes;
        const pathname=new URL(req.body.secure_url).pathname;
        const VideoUrl=pathname.replace("/testifywebdev/","");
        cdn.secureUrl=`https://cdn.letshost.dpdns.org/${VideoUrl}`
    }
    if(cdn.previousVersion!==0){
 await deleteMediaFromCDN(cdn.owner.toString(), cdn.previousVersion,"video",cdn.cdnProjectID)
    }
    await cdn.save();

    return res.status(200)
    .json(new apiResponse(200,cdn,"Video uploaded successfully"));
}
else if(req.body.notification_type==="upload" && req.body.resource_type==="image"){
    return res.status(200)
    .json(new apiResponse(200,{},"Image uploaded successfully"));
}
else{
    throw new apiError(400,"Invalid notification type");
}
})



export {registerCDN,updateCDN,getCDN,deleteCDN,confirmVideoUpload};



