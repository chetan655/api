import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRoter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors());

//api end points
app.use("/api/user", userRoter);
app.use("/api/product", productRouter);

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(port, () => console.log("server started"));
