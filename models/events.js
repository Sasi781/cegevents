const { Int32 } = require('mongodb');
var mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    eventID:{
        type:Number,
        required:true,
    },
    eventname:{
        type:String,
        required:true,
    },
    date:{
        type:String,
        required:true
    },
    venue:{
        type:String,
        required:true
    },
    cash:{
        type:String,
        required:true
    },
    domain:{
        type:String,
        required:true
    },
    email1:{
        type:String,
        required:true
    },
    email2:{
        type:String,
        required:true
    },
    desc:{
        type:String,
        required:true
    },
    fulldesc:{
        type:Array
    },
    rules:{
        type:Array
    },
    roundname:{
        type:String
    },
    rounddesc:{
        type:Array
    }
});
module.exports=User=mongoose.model("events",userSchema)