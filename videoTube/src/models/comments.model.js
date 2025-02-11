import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "comment content is required."],
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
