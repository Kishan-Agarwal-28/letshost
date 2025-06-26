import mongoose,{Schema} from "mongoose";

const likesSchema=new Schema({
    image:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Image",
        required:true
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

},{
    timestamps:true
})

export const Like=mongoose.model("Likes",likesSchema)