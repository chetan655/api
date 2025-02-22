import mongoose from "mongoose";

const connectDB = async () => {
  const connectionInstance = mongoose.connection.on("connected", () => {
    console.log("db connected");
  });
  console.log("connction:", connectionInstance);
  await mongoose.connect(`${process.env.MONGODB_URL}/ecommerce`);
};

export default connectDB;
