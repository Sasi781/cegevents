const express = require('express')
var nodemailer = require('nodemailer');
const {model}=require('mongoose')
const app = express()
//comment added
const user=require("./models/register")
const conn=require("./database");
const details=require("./models/details")
const register = require('./models/register');
const hostels = require('./models/hostels');
const events=require('./models/events');
const hostelStudents = require('./models/hostelStudents');
const cookieParser=require('cookie-parser');
const sessions=require('express-session');
const port = 5000
var urlToImage = require('url-to-image');
var url=require('url')
app.use(cookieParser());
require('dotenv').config();
app.use(express.static(__dirname+'/public'))
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
var myInt
const store=new sessions.MemoryStore()

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine','ejs')
var User = "",ses;

const oneDay = 86400000;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    store
}));

app.post("/uniqueUser",(req,res)=>{
  var cname = req.body.cname
  console.log(cname)
  res.json("")
})

app.get('/validate',(req,res)=>{
  if(!req.session.email){
     res.render("register.ejs",{"msg":""})
  }
  else{
     res.render("index.ejs",{"user":req.session.email,"msg":"first"});
    //  res.render("registration_form.ejs",{user:req.session.email});
  }
})
function myStopFunction() {
  clearTimeout(myInt);
}
app.use(express.urlencoded({extended:false}))
function sendEmail(email,otp){
    return new Promise((resolve,reject)=>{
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'cegevents2023@gmail.com',
              pass: 'oruvkoodggvmzdtj'
            }
          });
          // console.log(otpcode)
          
          var mail_configs = {
            from: 'CEG Events<cegevents2023@gmail.com>', 
            to: email,
            subject: 'Welcome to CEG Events',
            html:"<p>The OTP is : "+otp+"</p><div class='col-lg-12'><img src='https://www.nic.bc.ca/posts/images/2867-newsletter-jan-4-main.jpg' style='width:100%' alt='No Image'></div>"
          };

          transporter.sendMail(mail_configs, function(error, info){
            if (error) {
              console.log(error);
              return reject({message:'An error has occured'})
            }
            return resolve({message:'Email sent successfully'})
          });      

    })
}

function sendEmail1(email,pass){
  return new Promise((resolve,reject)=>{
      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'cegevents2023@gmail.com',
            pass: 'oruvkoodggvmzdtj'
          }
        });
        // console.log(otpcode)
        
        var mail_configs = {
          from: 'CEG Events<cegevents2023@gmail.com>', 
          to: email,
          subject: 'Welcome to CEG Events',
          html:"<p>Successfully Updated your password\nNew Password : "+pass+"</p><div class='col-lg-12'><img src='https://www.nic.bc.ca/posts/images/2867-newsletter-jan-4-main.jpg' style='width:100%' alt='No Image'></div>"
        };

        transporter.sendMail(mail_configs, function(error, info){
          if (error) {
            console.log(error);
            return reject({message:'An error has occured'})
          }
          return resolve({message:'Email sent successfully'})
        });      

  })
}
function userRegister(uname,uemail,upass,otpcode){
  User=new user({
    username:uname,
    email:uemail,
    password:upass,
    role:3,
    otp:otpcode,
    isVerified:"false",
    details:"NotEntered"
  })
}
app.post('/send',async (req,res)=>{
  client.messages.create({body:otp,from:"7339377666",to:"+917810860782"})
})


app.get('/',(req,res)=>{

    res.render("register.ejs",{msg:""})
})

app.get('/forget-pass',(req,res)=>{
  res.render("forget_pass.ejs",{"msg":""})
})

app.get('/resend_otp/:email',(req,res)=>{
  console.log("HIII")
  console.log(req.params)
  let email=req.params.email[0];
  email+="******@gmail.com";
  let otpcode=Math.floor(100000+(Math.random()*900000))
  otp=otpcode.toString();
  user.updateOne({email:req.params.email},{$set:{otp:otp}},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      console.log(doc)
    }
  })
  console.log("Hi")
  myStopFunction();
  myInt = setTimeout(function () {
    user.updateOne({email:req.params.email},{$set:{otp:"xxxxxx"}},(err,doc)=>{
      if(err){
        console.log(err)
      }
      else{
        console.log(doc)
      }
    })
}, 125000);
  sendEmail(req.params.email,otp)
  res.render("register_otp.ejs",{"email":email,"originalEmail":req.params.email,"msg":"OTP SENT"})
})

app.post('/validate_otp',(req,res)=>{
  let entered_otp=req.body.f+req.body.s+req.body.t+req.body.fo+req.body.fi+req.body.si;
  console.log(entered_otp);
  let email=req.body.email[0];
  email+="******@gmail.com";
  console.log(req.body.email)
  user.findOne({email:req.body.email},(err,doc)=>{
    
     if(doc['otp']==entered_otp){
         res.render("change_password.ejs",{"email":req.body.email,"msg":""});
    }
    else{
      res.render("forget_otp.ejs",{"email":email,"originalEmail":req.body.email,"msg":"OTP is wrong"})
    }
  })
})

app.post('/changePassword',(req,res)=>{
  console.log("Hi")
  let pass = req.body.pass;
  let cpass = req.body.cpass;
  console.log(pass + cpass)
  console.log(req.body.email)
  if(pass == cpass){
    sendEmail1(req.body.email,pass)
    user.updateOne({email:req.body.email},{$set:{password:pass}},(err,doc)=>{
      if(err){
        console.log(err)
      }
      else{
        console.log(doc)
      }
    })
    res.render("register.ejs",{"msg":""});
  }
  else{
    res.render("change_password.ejs",{"email":req.body.email,"msg":"Password Mismatch"});
  }
})

app.get('/dashboard',(req,res)=>{

  res.render("index.ejs",{"user":ses.email,"msg":""})
})

app.get('/login',(req,res)=>{
  // ses=req.session.email;
  if(ses){
    res.render('index.ejs',{"user":ses.email,"msg":""})
  }
  else{
    res.render("register.ejs",{"msg":""})
  }
})
app.post('/login',(req,res)=>{
  console.log(req.body)
  user.find({$and: [ { email: req.body.email   }, { password:req.body.pass } ]},(err,doc)=>{
    console.log(doc.length)
    if(err){
      console.log("HI"+err);
    }
    if(doc.length>0 && doc[0].email=="admin@gmail.com" && doc[0].password=="admin"){
        req.session.email=doc[0].email
        events.countDocuments({},(err,doc)=>{
          user.countDocuments({role:4},(err,doc1)=>{
            console.log(doc1)
            console.log(doc)
            var data={
            user:req.session.email,
            eventCount:doc,
            admin:doc1,
          }
          res.render("admin/index-admin.ejs",{data:data});
          })
        })
    }
    else if(doc.length>0 && doc[0].role==4){//hostel admin page
      req.session.email=doc.email
      res.render("hostel-admin/dashboard.ejs",{data:doc[0]});
    }
    else if(doc.length>0 && doc[0].role==3){
      ses=req.session
      ses.email=req.body.email;
      req.session.email=req.body.email;
      req.session.save()
      console.log(ses)
      if(doc[0].details=="NotEntered"){
        res.render("index.ejs",{"user":req.session.email,"msg":"first"});
      }
      else{
        res.render("index.ejs",{"user":req.session.email,"msg":""});
      }
    }
    else{
      res.render("register.ejs",{"msg":"Invalid Credentials"})
    }
  })
})
app.post('/validate',(req,res)=>{
  let entered_otp=req.body.f+req.body.s+req.body.t+req.body.fo+req.body.fi+req.body.si;
  console.log(entered_otp);
  console.log(req.body.email)
  user.findOne({email:req.body.email},(err,doc)=>{
    console.log(doc);
    if(err){
      console.log(err)
    }
    else if(doc['otp']==entered_otp){
      user.updateOne({email:req.body.email},{$set:{isVerified:"true"}},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          console.log(doc)
        }
      })
      
      res.render("register.ejs",{"msg":"Email Registered Successfully"});
    }
    else{
      let email=req.body.email[0];
      email+="******@gmail.com";
      res.render("register_otp.ejs",{"email":email,"originalEmail":req.body.email,"msg":"OTP IS WRONG"})
    }
  });
})

 app.post('/regForm',(req,res)=>{
  console.log(req.body)
  var q=url.parse(req.body.img,true)
  var val=q.pathname
  let ans=""
  let count=0
  for(let i=0;i<val.length;i++){
    if(count==3 && val[i]!='/') ans+=val[i]
    if(val[i]=='/') count++
  }
  console.log(ans)
  details.insertMany({
    email:req.session.email,
    firstname:req.body.fname,
    lastname:req.body.lname,
    phone:req.body.phone,
    rollno:req.body.rollno,
    dob:req.body.dob,
    college:req.body.college,
    department:req.body.dept,
    year:req.body.year,
    gender:req.body.gender,
    hostel:req.body.hostel,
    img:ans
  },(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      console.log(doc);
      user.updateOne({email:req.session.email},{$set:{"details":"Entered"}},(err,doc)=>{
        if(err){
          console.log(err);
        }
        else{
          console.log(doc)
          details.find({"email":req.session.email},(err,doc)=>{
            if(err){
               console.log(err)
            }
            else{
              console.log(doc)
              res.render("user-profile.ejs",{"data":doc,"msg":""})
            }
          })
        }
      })
      
    }
  })
})
app.post('/register',(req,res)=>{
      console.log(req.body);
      if(req.body.pass==req.body.cpass){
        user.find( { $and: [ { email: req.body.email   }, { isVerified:"true" } ] } ,(err,doc)=>{
          if(err){
            console.log(err)
          }
          else if(doc.length>0){
            res.render("register.ejs",{"msg":"EMAIL ALREADY EXISTS"})
          }
          else{
            console.log(req.body.email)
                user.find( { $and: [ { email: req.body.email   }, { isVerified:"false" } ] } ,(err,doc)=>{
                  console.log(doc.length)
                  if(err){
                    console.log(err)
                  }
                  else if(doc.length>0){
                    user.deleteOne({"email":req.body.email},(err,doc)=>{
                      if(err){
                        console.log(err)
                      }
                      else{
                        console.log(doc)
                      }
                    })
                  }
                  
                  let email=req.body.email[0];
                  email+="******@gmail.com";
                  let otpcode=Math.floor(100000+(Math.random()*900000))
                  otp=otpcode.toString()
                  userRegister(req.body.username,req.body.email,req.body.pass,otp);
                  User.save();
                  
                  myInt = setTimeout(function () {
                    user.updateOne({email:req.body.email},{$set:{otp:"xxxxxx"}},(err,doc)=>{
                      if(err){
                        console.log(err)
                      }
                      else{
                        console.log(doc)
                      }
                    })
                }, 130000);
                  sendEmail(req.body.email,otp)
                  res.render("register_otp.ejs",{"email":email,"originalEmail":req.body.email,"msg":""})
                })
          }
        }) 
       }
      else{
        res.render("register.ejs",{"msg":"PASSWORD MISMATCH"})
      } 
})

app.post('/check',(req,res)=>{
  console.log(req.body.email)
   user.find({email:req.body.email},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else if(doc.length>0){
      let email=req.body.email[0];
      email+="******@gmail.com";
      let otpcode=Math.floor(100000+(Math.random()*900000))
      otp=otpcode.toString()
      user.updateOne({email:req.body.email},{$set:{otp:otp}},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          console.log(doc)
        }
      })
      sendEmail(req.body.email,otp)
      res.render("forget_otp.ejs",{"email":email,"originalEmail":req.body.email,"msg":""})
    }
    else{
       res.render("forget_pass.ejs",{"msg":"Mail not exist"})
    }
   })
})

app.get('/user-profile',(req,res)=>{
  console.log(req.session)
  if(!req.session.email){
    console.log("HI")
    return res.render("register.ejs",{"msg":""})
  }
  details.find({"email":ses.email},(err,doc)=>{
    if(err){
       console.log(err)
    }
    else{
      console.log(doc)
      
    res.render("user-profile.ejs",{"data":doc,"msg":""})

      
    }
  })
})

app.post('/updatePassword',(req,res)=>{
  var currpass = req.body.currentPassword
  var newpass = req.body.newPassword
  var rpass = req.body.reNewPassword
console.log("SESSION : "+ses.email)

  if(newpass!=rpass){
    details.find({"email":req.body.email},(err,doc)=>{
      if(err){
         console.log(err)
      }
      else{
        console.log(doc)
        res.render("user-profile.ejs",{"data":doc,"msg":"Password MisMatch"})
      }
    })
  }
  else{
    user.find({"email":req.body.email,"password":currpass},(err,doc)=>{
      if(err){
        console.log(err)
      }
      else if(doc.length>0){
        user.updateOne({"email":req.body.email},{$set:{"password":newpass}},(err,doc)=>{
          if(err){
            console.log(err);
          }
          else{
            details.find({"email":req.body.email},(err,doc)=>{
              if(err){
                 console.log(err)
              }
              else{
                console.log(doc)
                res.render("user-profile.ejs",{"data":doc,"msg":"Updated Successfully"})
              }
            })
          }
        })
      }
      else{
        details.find({"email":req.body.email},(err,doc)=>{
          if(err){
             console.log(err)
          }
          else{
            console.log("doc")
            res.render("user-profile.ejs",{"data":doc,"msg":"Password Wrong"})
          }
        })
      }
    })
  }
  
})
app.post('/updateProfile',(req,res)=>{
  console.log(req.body.img)
  console.log(req.session)
console.log(req.session.email)
var q=url.parse(req.body.img,true)
  var val=q.pathname
  let ans=""
  let count=0
  for(let i=0;i<val.length;i++){
    if(count==3 && val[i]!='/') ans+=val[i]
    if(val[i]=='/') count++
  }
  console.log(ans);
  details.updateMany({"email":ses.email},{$set:{"firstname":req.body.fname,
  "lastname":req.body.lname,"phone":req.body.phone,"rollno":req.body.rollno
,"dob":req.body.dob,"college":req.body.college,"department":req.body.dept,
 "year":req.body.year,"img":ans}},(err,doc)=>{
  if(err){
    console.log(err)
  }
  else{
    console.log(doc)
    details.find({"email":req.session.email},(err,doc)=>{
      if(err){
         console.log(err)
      }
      else{
        console.log(doc)
        res.render("user-profile.ejs",{"data":doc,"msg":"Profile Updated Successfully"})
      }
    })
  }
})
})
app.post('/events',(req,res)=>{
  console.log(req.body.eventid)
  events.insertMany({eventID:req.body.eventid,eventname:req.body.ename,
                    date:req.body.date,venue:req.body.venue,cash:req.body.price,
                    domain:req.body.domain,email1:req.body.email1,email2:req.body.email2,desc:req.body.desc
  },(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      user.insertMany([{email:req.body.email1,password:req.body.pass1,role:2},{email:req.body.email2,password:req.body.pass2,role:2}],
      (err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          emailForEvent(req.body.email1,req.body.pass1,req.body.ename)
          emailForEvent(req.body.email2,req.body.pass2,req.body.ename)
          events.countDocuments({},(err,doc)=>{
            user.countDocuments({role:4},(err,doc1)=>{
              console.log(doc1)
              console.log(doc)
              var data={
              user:req.session.email,
              eventCount:doc,
              admin:doc1,
            }
            res.render("admin/index-admin.ejs",{data:data});
            })
          })
          // res.render("admin/index-admin.ejs",{"user":req.session.email})
        }
      })
    }
  })
})
app.get('/addEvents',(req,res)=>{
  
  events.aggregate([
    {
      $group: {
        _id: null,
        maxQty: { $max: '$eventID' },
      },
    },
  ],(err,doc)=>{9
    // console.log(doc)
    if(err){
      console.log(err)
    }
    else if(doc.length == 0){
      console.log(doc)
      res.render("admin/add-events.ejs",{"ID":20231})
    }
    else{
      console.log(doc)
      console.log(doc[0].maxQty)
      res.render("admin/add-events.ejs",{"ID":doc[0].maxQty+1})
    }
  });
})
function emailForEvent(email,pass,eventname){
  return new Promise((resolve,reject)=>{
      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'cegevents2023@gmail.com',
            pass: 'oruvkoodggvmzdtj'
          }
        });
        // console.log(otpcode)
        
        var mail_configs = {
          from: 'CEG Events<cegevents2023@gmail.com>', 
          to: email,
          subject: 'Welcome to CEG Events',
          html:"<p>Username : "+email+"</p><p>Password : "+pass+"</p><p>Your are Assigned for the Event : "+eventname+"</p><div class='col-lg-12'><img src='https://ananyaseeds.com/images/event.gif' style='width:100%' alt='No Image'></div>"
        };

        transporter.sendMail(mail_configs, function(error, info){
          if (error) {
            console.log(error);
            return reject({message:'An error has occured'})
          }
          return resolve({message:'Email sent successfully'})
        });      

  })
}
app.post('/addAdmin',(req,res)=>{
  user.insertMany({username:req.body.admin,email:req.body.email,password:req.body.pass,role:4},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      events.countDocuments({},(err,doc)=>{
        user.countDocuments({role:4},(err,doc1)=>{
          console.log(doc1)
          console.log(doc)
          var data={
          user:req.session.email,
          eventCount:doc,
          admin:doc1,
        }
        emailForEvent(req.body.email,req.body.pass,"Hostel Admin")
        res.render("admin/index-admin.ejs",{data:data});
        })
      })
    }
  })
})
app.get('/eventDetails',(req,res)=>{
  events.find({},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      res.render("admin/event-details.ejs",{data:doc})
    }
  })
})

app.get('/adminDetails',(req,res)=>{
  var adminData=new events()
  events.find({},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      adminData = doc
      // console.log(adminData)
      var len = adminData.length
      user.find({"role":4},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          console.log(doc.length)
          for(i=0;i<doc.length;i++){
            adminData['eventID'] = 0000
            adminData['eventname'] = "Hostel"
            adminData['date'] = "Hostel"
            adminData['venue'] = "Hostel"
            adminData['cash ']= "Hostel"
            adminData['domain'] = "Hostel"
            adminData['desc'] = "Hostel"
            adminData['email1'] = doc[i]['email']
            adminData['email2'] = ""
            
          }
        }
      })
      console.log(adminData)
      res.render("admin/admin-details.ejs",{data:adminData})
    }
  })
  
})


app.get('/eventDelete/:ID',(req,res)=>{
  console.log("Hi")
  console.log(req.params.ID)
  events.deleteOne({_id:req.params.ID},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      console.log(doc)
      events.find({},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          res.render("admin/event-details.ejs",{data:doc})
        }
      })
    }
  })
})
app.get('/finalBooking/:id/:floor/:room',(req,res)=>{
  console.log(req.params.id+" "+req.params.floor+" "+req.params.room)
  hostels.find({_id:req.params.id},(err,doc)=>{
     if(err){
      console.log(err)
     }
     else{
      count = doc[0]['totalCount']
      hname = doc[0]['hname']
      room = req.params.room
      gender=doc[0]['type']
      console.log(count+" "+hname+" "+room)
      hostelStudents.find({$and: [ { hostelname:hname  }, { roomno:room } ]},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          console.log(doc)
          res.render('hostel-admin/tableHostelpage.ejs',{data:doc,count:count,hname:hname,room:room,floor:req.params.floor,gender:gender})
        }
      })
     }
  })
})
app.get('/specific-hostel/:id',(req,res)=>{
  hostels.find({_id:req.params.id},(err,doc)=>{
    if(err){
      console.log(err);
    }
    else{
      console.log(doc);
      res.render("hostel-admin/specific-rooms",{data:doc})
    }
  })
})
app.get('/book-rooms',(req,res)=>{
  hostels.find({},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      res.render('hostel-admin/book-rooms.ejs',{data:doc})
    }
  })
})
app.post('/addHostel',(req,res)=>{
  console.log(req.body)
  var GF={},FF={},SF={},TF={};
  var val="";
  let key={};
  var roomGF=req.body.roomGF
  for(let i=0;i<roomGF.length;i++){
    if(req.body.roomGF[i]==','){
      GF[val]=0
      key={}
      val=""
    }
    else{
      val+=roomGF[i];
    }
  }
  if(roomGF.length!=0) GF[val]=0;
  val=""
  var roomFF=req.body.roomFF
  for(let i=0;i<roomFF.length;i++){
    if(req.body.roomFF[i]==','){
      FF[val]=0;
      val=""
    }
    else{
      val+=roomFF[i];
    }
  }
  if(roomFF.length!=0) FF[val]=0;
  console.log(FF)
  val=""
  var roomSF=req.body.roomSF
  for(let i=0;i<roomSF.length;i++){
    if(req.body.roomSF[i]==','){
      SF[val]=0;
      val=""
    }
    else{
      val+=roomSF[i];
    }
  }
  if(roomSF.length!=0) SF[val]=0;
  val=""
  var roomTF=req.body.roomTF
  for(let i=0;i<roomTF.length;i++){
    if(req.body.roomTF[i]==','){
      TF[val]=0
      val=""
    }
    else{
      val+=roomTF[i];
    }
  }
  if(roomTF.length!=0) TF[val]=0
  hostels.insertMany({
    hname:req.body.hname,
    totalCount:req.body.count,
    type:req.body.type,
    roomsGF:GF,
    roomsFF:FF,
    roomsSF:SF,
    roomsTF:TF,
  },(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      res.render("hostel-admin/add-rooms.ejs")
    }
  })
  
})

app.get('/hostelAdmission/:ID',(req,res)=>{
  console.log(req.params.ID)
  details.find({_id:req.params.ID},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      var gen
      var info = details()
      info = doc[0]
       console.log(doc[0]['email'])
       if(doc[0]['gender'] == "1"){
          gen = "male"
       }
       else{
          gen = "female"
       }
       console.log(gen)
       var name=""
       hostels.find({"type":gen},(err,doc)=>{
         if(err){
          console.log(err)
         }
         else{
           len = doc.length
           let flag=0;
           for(i=0;i<doc.length;i++){
             var GG = {}
             var roomno
             GG = doc[i].roomsGF[0]
             name = doc[i]['hname']
             console.log(GG)
             let keys=Object.keys(GG)
             console.log(keys.length)
             for(let j=0;j<keys.length;j++){
              console.log(GG[keys[j]])
              if(GG[keys[j]] < doc[i]['totalCount']){
                  roomno = keys[j]
                  GG[keys[j]] += 1
                  flag=1
                  break;
               }
             }
             if(flag==1){
             console.log(GG)
             console.log(name)
             console.log(roomno)
             hostels.updateMany({"hname":name},{$set:{roomsGF:GG}},(err,doc)=>{
              if(err){
                console.log(err)
              }
              else{
                console.log(doc)
              }
             })
             console.log(roomno)
             res.render("hostel-admin/hostel-booking",{data:info,hostel1:name,"gender":gen,room:roomno})
             break;
             }
           }
         }
       })
    }
  })
})
function sendEmailHostel(email,hostel,room){
  return new Promise((resolve,reject)=>{
      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'cegevents2023@gmail.com',
            pass: 'oruvkoodggvmzdtj'
          }
        });
        // console.log(otpcode)
        
        var mail_configs = {
          from: 'CEG Events<cegevents2023@gmail.com>', 
          to: email,
          subject: 'Welcome to CEG Events',
          html:"<p>The Hostel Name is : "+hostel+"</p><p>The Room Number is : "+room+"</p><a href='https://goo.gl/maps/s73NjX6QbGXeG1rYA'><img src='https://drive.google.com/uc?export=view&id=15F-TtCSKlwWQ-K3cXfA5Z5IPWKIBwMXx' width='100%' height='300px' alt='NO IMAGE'></a>"
        };

        transporter.sendMail(mail_configs, function(error, info){
          if (error) {
            console.log(error);
            return reject({message:'An error has occured'})
          }
          return resolve({message:'Email sent successfully'})
        });      

  })
}
function HostelBooking(req){
  hostelStudents.insertMany({
    name:req.body.name,
    email:req.body.email,
    phone:req.body.phone,
    college:req.body.clg,
    gender:req.body.gender,
    hostelname:req.body.hname,
    roomno:req.body.hroom
  },(err,doc)=>{
    if(err){
     console.log(err)
    }
    else{
      console.log(doc)
      sendEmailHostel(req.body.email,req.body.hname,req.body.hroom)
      details.updateOne({email:req.body.email},{$set:{hostel:req.body.hname}},(err,doc)=>{
         if(err){
           console.log(err)
         }
         else{
           console.log(doc)
         }
      })
    }
  })
  return
}


app.post('/hostelBookingManual',(req,res)=>{
  console.log("HostelManual")
  HostelBooking(req)
  console.log(req.body.rfloor)

    hostels.find({hname:req.body.hname},(err,doc)=>{
      if(err){
        console.log(err)
      }
      else{
          gender=doc[0]['type']
          console.log(req.body.hroom)
          var GG = {}
          if(req.body.rfloor == 0) GG = doc[0].roomsGF[0]
          else if(req.body.rfloor == 1) GG = doc[0].roomsFF[0]
          else if(req.body.rfloor == 2) GG = doc[0].roomsSF[0]
          else if(req.body.rfloor == 3) GG = doc[0].roomsTF[0]
          console.log(GG)
          let keys=Object.keys(GG)
          console.log(keys.length)
          GG[req.body.hroom] += 1
          console.log(GG)
          if(req.body.rfloor == 0){
            hostels.updateMany({"hname":req.body.hname},{$set:{roomsGF:GG}},(err,doc)=>{
              if(err){
                console.log(err)
              }
              else{
                console.log(doc)
              }
             })
          }
          else if(req.body.rfloor == 1){
            hostels.updateMany({"hname":req.body.hname},{$set:{roomsFF:GG}},(err,doc)=>{
              if(err){
                console.log(err)
              }
              else{
                console.log(doc)
              }
             })
          }
          else if(req.body.rfloor == 2){
            hostels.updateMany({"hname":req.body.hname},{$set:{roomsSF:GG}},(err,doc)=>{
              if(err){
                console.log(err)
              }
              else{
                console.log(doc)
              }
             })
          }
          else if(req.body.rfloor == 3){
            hostels.updateMany({"hname":req.body.hname},{$set:{roomsTF:GG}},(err,doc)=>{
              if(err){
                console.log(err)
              }
              else{
                console.log(doc)
              }
             })
          }
          
          hostelStudents.find({$and: [ { hostelname:req.body.hname  }, { roomno:req.body.hroom } ]},(err,doc)=>{
            if(err){
              console.log(err)
            }
            else{
              console.log(doc)
              res.render('hostel-admin/tableHostelpage.ejs',{data:doc,count:req.body.count,hname:req.body.hname,room:req.body.hroom,floor:req.body.rfloor,gender:gender})
            }
          })
        
       
      }
    })
})
app.get('/bookedRoomDetails',(req,res)=>{
  hostelStudents.find({},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      res.render("hostel-admin/booked-roomDetails.ejs",{data:doc})
    }
  })
})
app.post('/hostelBooking',(req,res)=>{
  console.log("Hostel")
  HostelBooking(req)
})

app.get('/adminUser',(req,res)=>{
  console.log("hi")
  if(ses){
    res.render('index.ejs',{"user":ses.email,"msg":""})
  }
  else{
    // res.render("register.ejs",{"msg":""})
  }

  });

app.get('/adminMain',(req,res)=>{
  events.countDocuments({},(err,doc)=>{
    user.countDocuments({role:4},(err,doc1)=>{
      console.log(doc1)
      console.log(doc)
      var data={
      user:req.session.email,
      eventCount:doc,
      admin:doc1,
    }
    res.render("admin/index-admin.ejs",{data:data});
    })
  })
})

app.get('/hostel-index',(req,res)=>{
  res.render("hostel-admin/dashboard.ejs",{})
})

app.get('/hostelAdmin',(req,res)=>{
  res.render("admin/add-admin.ejs")
})

app.get('/add-hostelrooms',(req,res)=>{
  res.render("hostel-admin/add-rooms.ejs")
})

app.get('/hostel-students',(req,res)=>{
  details.find({"hostel":"yes"},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      res.render("hostel-admin/view-students.ejs",{data:doc})
    }
  })
})

app.get('/logout',(req,res)=>{
  req.session.destroy();
  ses=""
  
  console.log(req.session)
  res.render("register.ejs",{"msg":""})
})
app.listen(port,()=>{
    console.log("Server is Running");
})

app.use(function(req,res){
  res.status(404).render("pages-error-404.html");
});