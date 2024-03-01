import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("MONGODB CONNECTED SUCCESSFULLY !!!", connection.connection.host);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};