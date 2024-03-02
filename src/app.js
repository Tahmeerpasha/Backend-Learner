import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/*  app.use() - For configuration
    This function is used to mount the specified middleware function(s) at the path which is being specified. 
    It is mostly used to set up middleware for your application.
*/

/*  
    This is to enalble cross origin resource sharing (CORS). 
    This is necessary because the client and server will be running on different ports.
*/
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN_URL,
        credentials: true
    }
))

/*  
    This is to enable parsing of json data from the request body
    You can set the limit of data to accept in json 
*/
app.use(express.json({ limit: process.env.LIMIT || "16kb" }));

/* 
    This configuration is to read the url encoded string since different OS and browsers encode strings in different format.
*/
app.use(express.urlencoded({ extended: true, limit: process.env.LIMIT || "16kb" }));

/* 
    This configuration defines a public folder where we can store static assets in our project such as pdf, images etc...
*/
app.use(express.static("public"));

/* 
    This is to securely access and perform crud operations on cookies in clients browser.
*/
app.use(cookieParser());

// routes import 
import userRouter from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users", userRouter)
export default app;