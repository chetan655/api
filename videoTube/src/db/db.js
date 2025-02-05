import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.DB_NAME}`,
        );
        console.log(`Mongodb connected ! HOST: ${connection.connection.host}`);
    } catch (error) {
        console.log("Mongodb connection failed, ERROR: ", error);
        process.exit(1);
    }
};

export default connectDB;
