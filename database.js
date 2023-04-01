const mongoose=require('mongoose');
mongoose.set('strictQuery',false);

const conn=mongoose.connect("mongodb+srv://cegevents2023:X5MJs22OBrRTO6Wz@cluster0.kf9pzo0.mongodb.net/CEGEVENTS?retryWrites=true&w=majority",{
    useNewUrlParser:true,useUnifiedTopology:true},(err)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log("Database Connected Successfully")
        }
    
})