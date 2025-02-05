import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/db.js";

dotenv.config({
    path: "./.env",
});

const app = express();

const port = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    })
    .catch((error) =>
        console.log(`mongodb connection failed. ERROR: ${error}`),
    );
