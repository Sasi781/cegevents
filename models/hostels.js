const { Int32 } = require('mongodb');
var mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    hname:{
        type:String,
        required:true,
    },
    totalCount:{
        type:Number,
        required:true,
    },
    type:{
        type:String,
        required:true
    },
    roomsGF:{
        type:Array,
        required:true
    },
    roomsFF:{
        type:Array,
        required:true
    },
    roomsSF:{
        type:Array,
        required:true
    },
    roomsTF:{
        type:Array,
        required:true
    },
});
module.exports=User=mongoose.model("hostels",userSchema)