const express = require('express')
var nodemailer = require('nodemailer');
const {model}=require('mongoose')
const app = express()
const excelJs = require("exceljs")
var fs = require("fs")
const xl = require('excel4node');
const user=require("./models/register")
const conn=require("./database");
const details=require("./models/details")
const register = require('./models/register');
const hostels = require('./models/hostels');
const events=require('./models/events');
const hostelStudents = require('./models/hostelStudents');
const processing=require('./models/processing')
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

const oneDay = 3600000;
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
app.get('/hostelDashboard',(req,res)=>{
  if(req.session.email){
    console.log(req.session.email)
    user.find({"email":req.session.email},(err,doc)=>{
      if(err) console.log(err)
      else{
        res.render("hostel-admin/dashboard.ejs",{data:doc[0]});
      }
    })
  }
  else{
    res.render('register.ejs',{msg:""})
  }
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
  console.log(req.session)
  console.log(req.session.email)
  if(req.session.email){
    let value=0
    register.findOne({email:req.session.email},(err,doc)=>{
      if(err) console.log(err)
      else{
        console.log(doc)
        if(doc['role']==3 && doc['details']=="Entered") value= 1
        else if(doc['role']==3 && doc['details']!="Entered") value= 2
        else if(doc['role']==1) value=3
        else if(doc['role']==2) value=4
        else if(doc['role']==4) value=5
        if(value==1) res.render('index.ejs',{"user":req.session.email,"msg":""})
        else if(value==2) res.render('index.ejs',{"user":req.session.email,"msg":"first"})
        else if(value==3){
          events.countDocuments({},(err,doc)=>{
            user.countDocuments({$or:[{role:4},{role:2}]},(err,doc1)=>{
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
        else if(value==4){
          var data={
            username:req.session.email
          }
          res.render("hostel-admin/dashboard.ejs",{data:data});
        }
      }
    })
    
  }
   else res.render("register.ejs",{msg:""})
})

app.get('/forget-pass',(req,res)=>{
  res.render("forget_pass.ejs",{"msg":""})
})

app.get('/resend_otp/:email',(req,res)=>{
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
  if(req.session.email){
    res.render('index.ejs',{"user":req.session.email,"msg":""})
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
          user.countDocuments({$or:[{role:4},{role:2}]},(err,doc1)=>{
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
      req.session.email=doc[0]["email"]
      res.render("hostel-admin/dashboard.ejs",{data:doc[0]});
    }
    else if(doc.length>0 && doc[0].role==3){
      ses=req.session
      ses.email=req.body.email;
      req.session.email=req.body.email;
      req.session.save()
      console.log(req.session)
      if(doc[0].details=="NotEntered"){
        res.render("index.ejs",{"user":req.session.email,"msg":"first"});
      }
      else{
        res.render("index.ejs",{"user":req.session.email,"msg":""});
      }
    }

    else if(doc.length>0 && doc[0].role==2){
      ses=req.session
      ses.email=req.body.email;
      req.session.email=req.body.email;
      req.session.save()
      console.log(ses)
      events.find( { $or: [ { email1: req.body.email   }, { email2: req.body.email  } ] } ,(err,doc)=>{
        if(err) console.log(err)
        else{
          console.log(doc)
          res.render("event-admin/event_index.ejs",{"user":req.session.email,data:doc})
        }
      })
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
app.post('/deleteHostelStudent',(req,res)=>{
  hostelStudents.findOneAndUpdate({email:req.body.studentEmail},{$set:{flag:0}},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      console.log(doc)
      var hostelname=doc['hostelname']
      var room=doc['roomno']
      var floor
      hostels.findOne({hname:hostelname},(err,doc)=>{
        if(err) console.log(err)
        else{
          var count=doc['totalCount']
          var gender=doc['type']
          if(room in doc['roomsGF'][0]){
            doc['roomsGF'][0][room]-=1
            floor="0"
            hostels.updateMany({hname:hostelname},{$set:{roomsGF:doc['roomsGF'][0]}},(err,doc)=>{

            })
          }
          else if(room in doc['roomsFF'][0]){
            doc['roomsFF'][0][room]-=1
            floor="1"
            hostels.updateMany({hname:hostelname},{$set:{roomsFF:doc['roomsFF'][0]}},(err,doc)=>{
              
            })
          }
          else if(room in doc['roomsSF'][0]){
            doc['roomsSF'][0][room]-=1
            floor="2"
            hostels.updateMany({hname:hostelname},{$set:{roomsSF:doc['roomsSF'][0]}},(err,doc)=>{
              
            })
          }
          else if(room in doc['roomsTF'][0]){
            doc['roomsTF'][0][room]-=1
            floor="3"
            hostels.updateMany({hname:hostelname},{$set:{roomsTF:doc['roomsTF'][0]}},(err,doc)=>{
              
            })
          }
          
          hostelStudents.find({$and: [ { hostelname:hostelname  }, { roomno:room },{"flag":1} ]},(err,doc)=>{
            if(err){
              console.log(err)
            }
            else{
              console.log(doc)
              res.render('hostel-admin/tableHostelpage.ejs',{data:doc,count:count,hname:hostelname,room:room,floor:floor,gender:gender})
            }
          })
         




        }
      })
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
  hostels.findOne({_id:req.params.id},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      processing.find({$and:[{hostelname:doc['hname']},{roomno:req.params.room}]},(err,doc1)=>{
        if(err){
          console.log(err)
        }
        else if(doc1.length>0){
          hostels.findOne({_id:req.params.id},(err,doc)=>{
            if(err){
              console.log(err);
            }
            else{
              var avail=0;
                let keys=Object.keys(doc['roomsGF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsGF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsFF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsFF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsSF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsSF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsTF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsTF'][0][keys[j]])
                }
                processing.find({},(err,doc1)=>{
                  if(err) console.log(err)
                  else{
                    var data1=[]
                    for(let i=0;i<doc1.length;i++){
                      data1.push({hostelname:doc1[i]['hostelname'],room:doc1[i]['roomno']})
                    }
                    
                    res.render("hostel-admin/specific-rooms",{data:doc,avail:avail,data1:data1,msg:"The Room is Processing by other Admin"})
                  }
                })
                
            }
          
          })
        }
        else{
          processing.insertMany({hostelname:doc['hname'],roomno:req.params.room},(err,doc)=>{
            if(err){
              console.log(err)
            }
            else{
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
                 hostelStudents.find({$and: [ { hostelname:hname  }, { roomno:room },{"flag":1} ]},(err,doc)=>{
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
            }
          })
          
        }
      })
    }
  })
  
  
})
app.get('/specific-hostel/:id',(req,res)=>{
  hostels.findOne({_id:req.params.id},(err,doc)=>{
    if(err){
      console.log(err);
    }
    else{
      var avail=0;
        let keys=Object.keys(doc['roomsGF'][0])
        for(let j=0;j<keys.length;j++){
            avail+=(doc['totalCount']-doc['roomsGF'][0][keys[j]])
        }
        keys=Object.keys(doc['roomsFF'][0])
        for(let j=0;j<keys.length;j++){
            avail+=(doc['totalCount']-doc['roomsFF'][0][keys[j]])
        }
        keys=Object.keys(doc['roomsSF'][0])
        for(let j=0;j<keys.length;j++){
            avail+=(doc['totalCount']-doc['roomsSF'][0][keys[j]])
        }
        keys=Object.keys(doc['roomsTF'][0])
        for(let j=0;j<keys.length;j++){
            avail+=(doc['totalCount']-doc['roomsTF'][0][keys[j]])
        }
        processing.find({},(err,doc1)=>{
          if(err) console.log(err)
          else{
            var data1=[]
            for(let i=0;i<doc1.length;i++){
              data1.push({hostelname:doc1[i]['hostelname'],room:doc1[i]['roomno']})
            }
            res.render("hostel-admin/specific-rooms",{data:doc,avail:avail,data1:data1,msg:""})
          }
        })
    }
  
  })
})
app.get('/book-rooms',(req,res)=>{
  hostels.find({},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      var male_availability=0,female_availability=0;
      hostels.find({},(err,doc)=>{
        if(err){
          console.log(err)
        }
        else{
          for(let i=0;i<doc.length;i++){
              let keys=Object.keys(doc[i]['roomsGF'][0])
              for(let j=0;j<keys.length;j++){
                if(doc[i]['type']=="male"){
                  male_availability+=(doc[i]['totalCount']-doc[i]['roomsGF'][0][keys[j]])
                }
                else{
                  female_availability+=(doc[i]['totalCount']-doc[i]['roomsGF'][0][keys[j]])
                }
              }
              keys=Object.keys(doc[i]['roomsFF'][0])
              for(let j=0;j<keys.length;j++){
                if(doc[i]['type']=="male"){
                  male_availability+=(doc[i]['totalCount']-doc[i]['roomsFF'][0][keys[j]])
                }
                else{
                  female_availability+=(doc[i]['totalCount']-doc[i]['roomsFF'][0][keys[j]])
                }
              }
              keys=Object.keys(doc[i]['roomsSF'][0])
              for(let j=0;j<keys.length;j++){
                if(doc[i]['type']=="male"){
                  male_availability+=(doc[i]['totalCount']-doc[i]['roomsSF'][0][keys[j]])
                }
                else{
                  female_availability+=(doc[i]['totalCount']-doc[i]['roomsSF'][0][keys[j]])
                }
              }
              keys=Object.keys(doc[i]['roomsTF'][0])
              for(let j=0;j<keys.length;j++){
                if(doc[i]['type']=="male"){
                  male_availability+=(doc[i]['totalCount']-doc[i]['roomsTF'][0][keys[j]])
                }
                else{
                  female_availability+=(doc[i]['totalCount']-doc[i]['roomsTF'][0][keys[j]])
                }
              }
            
          }
          var avail={
            mavail:male_availability,
            favail:female_availability
          }
          res.render('hostel-admin/book-rooms.ejs',{data:doc,avail:avail})
        }
      })
      
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
          from: 'Kurukshetra\'23<cegevents2023@gmail.com>', 
          to: email,
          subject: 'Welcome to Kurukshetra 2023',
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
  var arr=[]
if(req.body.check1) arr.push("18/04/2023")
if(req.body.check2) arr.push("19/04/2023")
if(req.body.check3) arr.push("20/04/2023")
if(req.body.check4) arr.push("21/04/2023")
  hostelStudents.insertMany({
    KID:req.body.kid,
    name:req.body.name,
    email:req.body.email,
    phone:req.body.phone,
    college:req.body.clg,
    gender:req.body.gender,
    dept:req.body.dept,
    year:req.body.year,
    mode:req.body.mode,
    tid:req.body.tid,
    deposit:req.body.deposit,
    food:req.body.food,
    date:arr,
    feedback:"NO",
    hostelname:req.body.hname,
    roomno:req.body.hroom,
    flag:1,
    amount:req.body.amount,
    advance:"NO"

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

app.get('/vacateHostels/:email',(err,doc)=>{
  console.log(req.params.email)
  hostelStudents.updateOne({email:req.params.email},{$set:{flag:0}},(err,doc)=>{
    if(err) console.log(err)
    else{
      console.log(doc);
    }
  })
})

app.get('/export',(req,res)=>{
  console.log("hi")

   hostelStudents.find({},(err,doc)=>{
    if(err) console.log(err)
    else{
      
      try{
        let workbook = new excelJs.Workbook()
        const sheet = workbook.addWorksheet()

        sheet.columns = [
         {header:"KID",key:"kid",width:25},
         {header:"Name",key:"name",width:25},
         {header:"E-mail",key:"email",width:25},
         {header:"Phone",key:"phone",width:25},
         {header:"College",key:"clg",width:25},
         {header:"Gender",key:"gen",width:25},
         {header:"Dept/Yr",key:"dept",width:25},
         {header:"Hostel/Roomno",key:"hname",width:25},
         {header:"Mode/TID",key:"mode",width:35},
         {header:"Deposit Status",key:"deposit",width:25},
         {header:"Date",key:"date",width:25},
         {header:"No.of days",key:"days",width:25},
         {header:"Food Requried",key:"food",width:25},
         {header:"Feedback",key:"feed",width:25},
         {header:"Amount Paid",key:"amt",width:25},
        ]
        
       
        sheet.getRow(1).font = {bold:true,size:15}
        
        for(i=0;i<doc.length;i++){
          var m = "";
          if(doc[i]["mode"] == "online"){
            m = doc[i]["mode"]+"/"+doc[i]["tid"]
          }
          else{
            m = doc[i]["mode"]
          }
          sheet.addRow({
            kid:doc[i]["KID"],
            name:doc[i]["name"],
            email:doc[i]["email"],
            phone:doc[i]["phone"],
            clg:doc[i]["college"],
            gen:doc[i]["gender"],
            dept:doc[i]["dept"]+"/"+doc[i]["year"],
            hname:doc[i]["hostelname"]+"/"+doc[i]["roomno"],
            mode:m,
            deposit:doc[i]["deposit"],
            date:doc[i]["date"],
            days:doc[i]["date"].length,
            food:doc[i]["food"],
            feed:doc[i]["feedback"],
            amt:doc[i]["amount"],
          })
        }

        console.log(sheet.rowCount)
        for(i = 1;i <=sheet.rowCount; i++){
          sheet.getRow(i).alignment = {horizontal:"center",vertical:"middle"};
        }

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment;filename=" + "hostelStudents.xlsx"
        )

        workbook.xlsx.write(res)

     }catch(err){
       console.log("ERROR"+err)
     }
    }
  })
})

app.post('/hostelBookingManual',(req,res)=>{
  console.log("HostelManual")
  console.log(req.body.check1+" "+req.body.check4)
  processing.find({$and:[{hostelname:req.body.hname},{roomno:req.body.hroom}]},(err,doc)=>{
    if(err) console.log(err)
    else if(doc.length == 1){
      hostelStudents.find({KID:req.body.kid},(err,doc1)=>{
        if(err) console.log(err)
        else if(doc1.length==0){
          HostelBooking(req)
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
              
              hostelStudents.find({$and: [ { hostelname:req.body.hname  }, { roomno:req.body.hroom },{"flag":1} ]},(err,doc)=>{
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
      



          
        }
      else{
        hostelStudents.find({$and: [ { hostelname:req.body.hname  }, { roomno:req.body.hroom },{"flag":1} ]},(err,doc)=>{
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
        
        
    }
    else{
      processing.deleteOne({$and:[{hostelname:req.body.hname},{roomno:req.body.hroom}]},(err,doc)=>{
        if(err) console.log(err)
        else{
          hostels.findOne({hname:req.body.hname},(err,doc)=>{
            if(err){
              console.log(err);
            }
            else{
                var avail=0;
                let keys=Object.keys(doc['roomsGF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsGF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsFF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsFF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsSF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsSF'][0][keys[j]])
                }
                keys=Object.keys(doc['roomsTF'][0])
                for(let j=0;j<keys.length;j++){
                    avail+=(doc['totalCount']-doc['roomsTF'][0][keys[j]])
                }
                processing.find({},(err,doc1)=>{
                  if(err) console.log(err)
                  else{
                    var data1=[]
                    for(let i=0;i<doc1.length;i++){
                      data1.push({hostelname:doc1[i]['hostelname'],room:doc1[i]['roomno']})
                    }
                    res.render("hostel-admin/specific-rooms",{data:doc,avail:avail,data1:data1,msg:"The Room is Processing by other Admin"})
                    return 
                  }
                })
            }
          })
         
        }
      })
    }    
  })
})
app.get('/deleteProcessing/:hname/:room',(req,res)=>{
  console.log("YES")
  processing.deleteOne({$and:[{hostelname:req.params.hname},{roomno:req.params.room}]},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      console.log(doc)
      hostels.findOne({hname:req.params.hname},(err,doc)=>{
        if(err){
          console.log(err);
        }
        else{
          var avail=0;
            let keys=Object.keys(doc['roomsGF'][0])
            for(let j=0;j<keys.length;j++){
                avail+=(doc['totalCount']-doc['roomsGF'][0][keys[j]])
            }
            keys=Object.keys(doc['roomsFF'][0])
            for(let j=0;j<keys.length;j++){
                avail+=(doc['totalCount']-doc['roomsFF'][0][keys[j]])
            }
            keys=Object.keys(doc['roomsSF'][0])
            for(let j=0;j<keys.length;j++){
                avail+=(doc['totalCount']-doc['roomsSF'][0][keys[j]])
            }
            keys=Object.keys(doc['roomsTF'][0])
            for(let j=0;j<keys.length;j++){
                avail+=(doc['totalCount']-doc['roomsTF'][0][keys[j]])
            }
            processing.find({},(err,doc1)=>{
              if(err) console.log(err)
              else{
                var data1=[]
                for(let i=0;i<doc1.length;i++){
                  data1.push({hostelname:doc1[i]['hostelname'],room:doc1[i]['roomno']})
                }
                res.render("hostel-admin/specific-rooms",{data:doc,avail:avail,data1:data1,msg:""})
              }
            })
        }
      
      })
    }
  })
})
app.get('/bookedRoomDetails',(req,res)=>{
  hostelStudents.find({"flag":1},(err,doc)=>{
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
    res.render('index.ejs',{"user":req.session.email,"msg":""})
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

app.get('/events-display/:ID',(req,res)=>{
   console.log(req.params.ID)
   res.render("events_display.ejs",{"user":req.params.ID})
})

app.post('/addEventDetails',(req,res)=>{
  console.log("hi");
  if(req.body.desc!=""){
    var arr=new Array(),val="";
    console.log(req.body.desc);
    desc = req.body.desc;
    console.log(req.body.eventid);
    for(i=0;i<desc.length;i++){
     if(desc[i] == "."){
        arr.push(val);
        val=""
     }
     else{
        val+=desc[i];
     }
    }
    console.log(arr)
    events.updateOne({eventID:req.body.eventid},{$set:{fulldesc:arr}},(err,doc)=>{
     if(err)  console.log(err)
     else{
        console.log(req.session.email)
        events.find( { $or: [ { email1: req.session.email   }, { email2: req.session.email  } ] } ,(err,doc1)=>{
         if(err) console.log(err)
         else{
           console.log(doc1)
           res.render("event-admin/event_index.ejs",{"user":req.session.email,data:doc1})
         }
       })
       console.log(doc)
     }
    })
  }
  else if(req.body.rule!=""){
    console.log("Hi2")
    var arr=new Array(),val="";
    console.log(req.body.rule);
    desc = req.body.rule;
    console.log(req.body.eventid);
    for(i=0;i<desc.length;i++){
     if(desc[i] == "."){
        arr.push(val);
        val=""
     }
     else{
        val+=desc[i];
     }
    }
    console.log(arr)
    events.updateOne({eventID:req.body.eventid},{$set:{rules:arr}},(err,doc)=>{
     if(err)  console.log(err)
     else{
        console.log(req.session.email)
        events.find( { $or: [ { email1: req.session.email   }, { email2: req.session.email  } ] } ,(err,doc1)=>{
         if(err) console.log(err)
         else{
           console.log(doc1)
           res.render("event-admin/event_index.ejs",{"user":req.session.email,data:doc1})
         }
       })
       console.log(doc)
     }
    })
  }
  else if(req.body.roundname!="" && req.body.rounddesc!=""){
       console.log("Hi3")
       var arr=new Array(),val="";
       console.log(req.body.rounddesc);
       desc = req.body.rounddesc;
       console.log(req.body.eventid);
       for(i=0;i<desc.length;i++){
        if(desc[i] == "."){
           arr.push(val);
           val=""
        }
        else{
           val+=desc[i];
        }
       }
       console.log(arr)
       events.updateMany({eventID:req.body.eventid},{$set:{rounddesc:arr,roundname:req.body.roundname}},(err,doc)=>{
        if(err)  console.log(err)
        else{
           console.log(req.session.email)
           events.find( { $or: [ { email1: req.session.email   }, { email2: req.session.email  } ] } ,(err,doc1)=>{
            if(err) console.log(err)
            else{
              console.log(doc1)
              res.render("event-admin/event_index.ejs",{"user":req.session.email,data:doc1})
            }
          })
          console.log(doc)
        }
       })

  }
})
app.post('/getData',(req,res)=>{
  // console.log("GETDATA"+req.body.id)
  hostels.findOne({'hname':req.body.id},(err,doc)=>{
    if(err){
      console.log(err)
    }
    else{
      processing.find({},(err,doc1)=>{
        if(err) console.log(err)
        else{
          // console.log(doc1)
          var data={
            data:doc,
            data1:doc1
          }
          res.status(200).send(data);
        }
      })
    }
  })
  
})
app.get('/feedback/:email',(req,res)=>{
  console.log(req.params.email)
  hostelStudents.updateMany({email:req.params.email},{$set:{feedback:"YES"}},(err,doc)=>{
    if(err) console.log(err)
    else res.status(200).send(doc);
  })
})
app.get('/logout',(req,res)=>{
  req.session.email=null;
  req.session.destroy();
  
  console.log(req.session)
  res.render("register.ejs",{"msg":""})
})
app.listen(port,()=>{
    console.log("Server is Running");
})

app.use(function(req,res){
  res.status(404).render("pages-error-404.html");
});