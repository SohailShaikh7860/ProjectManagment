import express from "express"
import cors from "cors"
import routerCheck from "./routes/healtCheck-route.js";
import authRouter from "./routes/auth.router.js"
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

app.get('/',(req,res)=>{
    res.end("hi, i am sohail");
})

app.get('/home',(req,res)=>{
    res.end("this is home page")
})


app.use(express.json({ limit: "16kb"}));
app.use(express.urlencoded({ extended:true, limit : "16kb"}))
app.use(express.static("public"))

app.use(cors({
    origins: process.env.CORS_ORIGIN || "https://localhost:5137",
    credentials:true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use('/api/v1/healthcheck', routerCheck);
app.use('/api/v1/auth', authRouter);

export default app;