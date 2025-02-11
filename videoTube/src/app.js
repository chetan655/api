import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json()); //enable backend to receive json files
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//routed import
import userRoutes from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";

// routes declaration
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRoutes);

// Global error handler should be the last middleware to catch errors
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        success: error.success || false,
        message: error.message || "Internal server error.",
        errors: error.errors || [],
    });
});

export { app };
