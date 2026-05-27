import express from "express";
import 'dotenv/config.js';
import profileRoutes from './routes/profileRoutes.js';

//initialize the app
const app = express();


//add Middlewares here
app.use(express.json());

//This is used to log the request on the console
app.use((req, res, next) =>{
    console.log(req.path, req.method);
    next();
})

//Start the app
try{
    app.listen(process.env.PORT || 4000, () =>{
        console.log(`Listening to port ${process.env.PORT || 4000}...`);
        console.log(`Student Profile Management API is running on port ${process.env.PORT}`);
    })
}catch(e){
    console.log(e);
}

// Register the profile routes
app.use('/api', profileRoutes);

//if no request matches the endpoints from the user
//This endpoint will send a 404 not found error to the client
app.use((req, res) =>{
    res.status(404).json({suucess: false, message: 'No such endpoint exists'});
});