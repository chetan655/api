import express from "express";

const app = express();

app.use(express.json()); //enable backend to receive json files

//routed import
import userRoutes from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/user", userRoutes);

// Global error handler should be the last middleware to catch errors
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        success: error.success || false,
        message: error.message || "Internal server error.",
        errors: error.errors || [],
    });
});

export { app };
