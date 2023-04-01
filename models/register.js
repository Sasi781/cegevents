const { Int32 } = require('mongodb');
var mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:Number,
        required:true
    },
    otp:{
        type:String,
        
    },
    isVerified:{
        type:String,
       
    },
    details:{
        type:String,
        
    }
});
module.exports=User=mongoose.model("registers",userSchema)