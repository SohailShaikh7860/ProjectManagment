import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/mongo.js";

dotenv.config({
    path:"./.env",
})

const PORT = process.env.PORT || 8000;


connectDB()
.then(    
app.listen(PORT, ()=>{
    console.log(`Server is running on PORT : ${PORT}`);  
})
)
.catch((err)=>{
    console.log("Connection failed",err);
})





