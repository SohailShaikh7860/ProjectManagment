import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("MongoDb connection error",error);
        process.exit(1) 
    }
}

export default connectDB;