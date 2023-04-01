const { Int32 } = require('mongodb');
var mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    studentID:{
        type:String,
        // required:true,
    },
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    college:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    hostelname:{
        type:String,
        required:true
    },
    roomno:{
        type:String,
        required:true
    }
});
module.exports=User=mongoose.model("hostelStudents",userSchema)