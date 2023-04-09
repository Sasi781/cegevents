const { Int32 } = require('mongodb');
var mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    hostelname:{
        type:String,
        required:true
    },
    roomno:{
        type:String,
        required:true
    }
});
module.exports=User=mongoose.model("processing",userSchema)