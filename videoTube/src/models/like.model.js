import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true },
);

const Like = mongoose.model("Like", likeSchema);

export default Like;
