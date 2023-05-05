const express=require('express');
const mongoose=require('mongoose');
const dp=require('./connection');
 passport = require("passport"),
bodyParser = require("body-parser"),
LocalStrategy = require("passport-local"),
passportLocalMongoose = 
        require("passport-local-mongoose")
const app=express();
const path=require('path');
const nodemailer = require('nodemailer');
const cors=require('cors');
require('dotenv').config();
const UserDetails=require('./models/UserDetails');
const PostLoad=require('./models/PostLoad');
const Track=require('./models/Track');
const PostTruck=require('./models/PostTruck');
app.use(bodyParser.urlencoded({ extended: true }));
const session = require('express-session');
app.use(express.json());
const axios = require("axios");
const querystring = require('querystring');
const alert = require('alert-node');

//ADDING TWILIO API
const accountSid = 'ACf1312dd71e801f259015782aba72428c';
const authToken = '657c6671a143e186a0db42a67aae8914';
const client = require('twilio')(accountSid, authToken);
//END TWILLO


//set views's
//app.use(express.static("public"));
app.use(express.static(path.join(__dirname,'public')));
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');

//


//passport
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
  
passport.use(new LocalStrategy(UserDetails.authenticate()));
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());
//passport end




// Set up session middleware to use req.session.name
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

//end od session initialization







//main page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './views/main.html'));
});
//end of main page




//start of signin route
app.get('/signup', function(req, res) {
    res.sendFile(path.join(__dirname, './views/signup.html'));
});

//handling form submission on signup
app.post('/signup', function(req, res) {
    const { username, email,phone, password } = req.body;
    //req.session.email=email;

    const newUser = new UserDetails({ username, email,phone,password });
    newUser.save() 
    .then(() => {
        res.redirect('/login')
      })
      .catch((err) => {
        console.log(err);
        res.send('Error saving data');
      });
});

//end of sign up page



//start of login page
app.get('/login', function(req, res) {
  res.sendFile(path.join(__dirname, './views/login.html'));
});


//handling after login form submitted
app.post('/login',async(req, res)=> {
    const username = req.body.username;
    const password = req.body.password;
    try{
     const user=await UserDetails.findOne({ username:username})
     console.log(user);
     if(user) {
        const result = password === user.password;
        if(result)
        {
        req.session.name = user.username;
        req.session.email=user.email;
        req.session.id=user._id;
        req.session.phone=user.phone;
        res.redirect('/otpverify');
        }
        else{
          res.render('alert', { message: 'Entered password is wrong' });
        }
      }
      else
      {
        res.render('alert', { message: 'User not found' });
      }
    }
      catch(err) {
        res.send('Error saving data');
      }
        


});


/*function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}*/

//start of otp verification

app.get("/otpverify",(req,res)=>
{
  const name=req.session.name;
  let password = Math.floor(Math.random() * 9000) + 1000; // Generate a random number between 1000 and 9999
  const pw=password.toString(); 

  /*client.messages
          .create({
             body: `Hello ${name} thanks for login in to our website and your OTP is ${pw}`,
             from: '+16073502532',
             to: `+917397106325`
           })
          .then(message => console.log(message.sid))
          .catch(error => console.log(error));*/

          const transporter=nodemailer.createTransport({
            service:'gmail',
            auth:{
              user:'vasanthmarshal2020@gmail.com',
              pass:process.env.PASSWORD1
            }
          });
      
          const option3={
            from:'vasanthmarshal2020@gmail.com',
            to:`${req.session.email}`,
            subject:'From SMT Transport Manapparai',
            text:`the otp for your login is ${pw}`
          };
      
          transporter.sendMail(option3,function(error,info)
          {
            if(error)
            {
              console.log(error);
            }
            else{
              console.log('mail.send',info);
            }
          })

  req.session.otp=pw;
   res.render("otpverify");
});


//verifying otp once form is filed;
app.post("/otpverify",(req,res)=>
{
  const {text1,text2,text3,text4}=req.body;
  const enteredotp=text1+text2+text3+text4;
  if(enteredotp===req.session.otp)
  {
    res.redirect(`/index/${req.session.id}`);//after login displaying it along with object id
  }
  else{
    alert(`Enter the correct Otp send to the phone number${req.session.phone}`);
  }
});



//end of otp verification




app.get('/index/:id',(req, res) => {
      //getting data from express session
      const name=req.session.name;
      const id=req.session.id;
      //console.log(id);
      //console.log(name);
      //end of the page
      res.render('index', { username:name,id:id});  
  });



  //making a conatus post request to send to email
  app.post('/contactus',async(req,res,next)=>
  {

    const transporter=nodemailer.createTransport({
      service:'gmail',
      auth:{
        user:'vasanthmarshal2020@gmail.com',
        pass:process.env.PASSWORD1
      }
    });

    const option1={
      from:'vasanthmarshal2020@gmail.com',
      to:`${req.body.email}`,
      subject:'From SMT Transport Manapparai',
      text:'We receied your request our team will contact you sonner'
    };

    transporter.sendMail(option1,function(error,info)
    {
      if(error)
      {
        console.log(error);
      }
      else{
        console.log('mail.send',info);
      }
    })

    const option2={
      from:'vasanthmarshal2020@gmail.com',
      to:`vasathmarshal2020@gmail.com`,
      subject:'From SMT Transport Manapparai',
      text:`the first name of the customer is ${req.body.fname} 
      the last of the customer is${req.body.lastname} 
      the customer email is ${req.body.email} 
      the customers description ${req.body.subject} 
      the customers phone number${req.body.phone} `
    };

    transporter.sendMail(option2,function(error,info)
    {
      if(error)
      {
        console.log(error);
      }
      else{
        console.log('mail.send',info);
      }
    })

    res.redirect(`/index/${req.session.id}`);

  });



  //end------------------



  //starting of posting a load route
  app.get("/postload",(req,res)=>{
    const id=req.session.id;
    //console.log(id);
    res.render('postload',{id:id});
  });

  app.post('/postload',(req,res)=>{

    const id=req.session.id;
    const {fromloc,toloc,loadtype,quantity,price,description,phone}=req.body;
    console.log(fromloc+toloc+loadtype+quantity+price+description+phone);
    const newload= new PostLoad({fromlocation:fromloc,tolocation:toloc,loadtype:loadtype,quantity:quantity,price:price,description:description,phone:phone});
    newload.save() 
    .then(() => {
        res.redirect(`/index/${req.session.id}`);
      })
      .catch((err) => {
        console.log(err);
        res.send('Error saving data');
      });
  });

  //end of posting a load route

  //starting of posting a truckroute
  app.get("/posttruck",(req,res)=>{
    const id=req.session.id;
    //console.log(id);
    res.render('posttruck',{id:id});
  });

  app.post('/posttruck',(req,res)=>{
   

    const id=req.session.id;
    const {curloc,toloc,vehnumber,phone,vehtype,capacity}=req.body;
    console.log(curloc+toloc+vehnumber+phone+vehtype+capacity);
    const newtruck= new PostTruck({currentlocation:curloc,tolocation:toloc,vehiclenumber:vehnumber,phone:phone,vehicletype:vehtype,capacity:capacity});
    newtruck.save() 
    .then(() => {
        res.redirect(`/index/${req.session.id}`);
      })
      .catch((err) => {
        console.log(err);
        res.send('Error saving data');
      });
  });

  //end of posting a truck route


  //starting of bboking a load
  app.get("/bookload",async(req,res)=>{
    const id=req.session.id;
    const loads=await PostLoad.find({})
    
    res.render('bookload',{id:id,loads:loads});
  });

  //starting of filtering loading
  app.post("/filterload",async(req,res)=>{
    const {fromlocation,tolocation}=req.body;
    console.log(fromlocation);
    console.log(tolocation+"  hello");
    //based onused entered which location
    if(fromlocation!=""&&tolocation=="")
    {
       var loads=await PostLoad.find({fromlocation:fromlocation});
    }
    else if(fromlocation==""&&tolocation!="")
    {
       var loads=await PostLoad.find({tolocation:tolocation});
    }
    else if(fromlocation==""&&tolocation=="")
    {
       var loads=await PostLoad.find({});
    }

    else
    {
      var loads=await PostLoad.find({fromlocation:fromlocation,tolocation:tolocation});
    }
    res.render('bookload',{loads:loads});
  });


  //end of filtering loading


  //end of booking truck route





  //starting of bboking a truckroute
  app.get("/booktruck",async(req,res)=>{
    const id=req.session.id;
    const trucks=await PostTruck.find({})
    res.render('booktruck',{id:id,trucks:trucks});
  });
  //sending details based on choose by form and to location
  app.post("/filtertruck",async(req,res)=>{
    const {fromlocation,tolocation}=req.body;
    console.log(fromlocation);
    console.log(tolocation+"  hello");
    //based onused entered which location
    if(fromlocation!=""&&tolocation=="")
    {
       var trucks=await PostTruck.find({currentlocation:fromlocation});
    }
    else if(fromlocation==""&&tolocation!="")
    {
       var trucks=await PostTruck.find({tolocation:tolocation});
    }
    else if(fromlocation==""&&tolocation=="")
    {
       var trucks=await PostTruck.find({});
    }
    else
    {
      var trucks=await PostTruck.find({currentlocation:fromlocation,tolocation:tolocation});
    }
    res.render('booktruck',{trucks:trucks});
  });


  // end sending details based on choose by form and to location


  //end of booking truck route

  //start of connecting end to end customers
  app.all('/contact/:phone', (req, res) => {
    const name=req.session.name;
    const phoneNumber = `${req.params.phone}`; // Replace with your phone number
    const message = `Hello this is ${name}`; // Replace with your message
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    res.redirect(url);

  });


  //end of connecting end to end customers


 //start of handling whatsup message 
 //code is working perfectly

  app.all('/whatsup', (req, res) => {
    const phoneNumber = '7397106325'; // Replace with your phone number
    const message = `Hello this is ${req.session.name}`; // Replace with your message
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    res.redirect(url);
  });

  //end of handling whatsup message
  
  app.listen(3001, () => {
    console.log('Server listening on port 3000');
  });



  //end of handling whatsup message


  



  


app.get('/booking/:username', function(req, res) {
   res.render('booking',{id:req.session.id});
  });



app.post('/bookloadsmt/:id',async(req,res) => {

  const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
      user:'vasanthmarshal2020@gmail.com',
      pass:process.env.PASSWORD1
    }
  });
  //console(req.body)

  const option4={
    from:'vasanthmarshal2020@gmail.com',
    to:`${req.body.email}`,
    subject:'From SMT Transport Manapparai',
    text:'We receied your request our team will contact you sonner'
  };

  transporter.sendMail(option4,function(error,info)
  {
    if(error)
    {
      console.log(error);
    }
    else{
      console.log('mail.send',info);
    }
  })

  const option5={
    from:'vasanthmarshal2020@gmail.com',
    to:`vasathmarshal2020@gmail.com`,
    subject:'From SMT Transport Manapparai',
    text:`the first name of the customer is ${req.body.firstname} 
    the last of the customer is  ${req.body.lastname} 
    the customer email is ${req.body.email} 
    the from location is ${req.body.fromlocation} 
    the tolocation is ${req.body.tolocation} 
    the capacity is ${req.body.capacity} 
    the needed vehicle company ${req.body.company} 
    the needed ehicle type is ${req.body.type} 
    the needed length of vehicle is${req.body.length} 
    the customers description ${req.body.subject} 
    the customers phone number${req.body.phone} `
  };

  transporter.sendMail(option5,function(error,info)
  {
    if(error)
    {
      console.log(error);
    }
    else{
      console.log('mail.send',info);
    }
  })

  


    res.redirect(`/index/${req.params.id}`)
         
}
);

//checking whether

app.post('/getweather',(req,res)=>
{
  const apiKey = '37703db95dec06430e8d026a901a26a5';
  const {location}=req.body;
const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;

axios.get(apiUrl)
  .then(response => {
    res.send(response.data);
  })
  .catch(error => {
    console.log(error);
  });

});


//end of checking weather


//getting and display fuel price API
app.get('/getfuelprice',async(req, res) => {
  const options = {
    method: 'GET',
    url: 'https://daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com/v1/list/india/states',
    params: {
      isoDate: '2022-09-01',
      'fuelTypes[0]': 'petrol'
    },
    headers: {
      'X-RapidAPI-Key': '56039ed7fcmshfb3e635008eb9f2p144630jsn292ffbb1d736',
      'X-RapidAPI-Host': 'daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com'
    }
  };
  
  try {
    const response = await axios.request(options);
    console.log(response.data);
    res.render('fuelstates',{states:response.data.states});
  } catch (error) {
    console.error(error);
  }
 
});
//en dof fuel price API

//get fuel price by state

app.get('/getfuelprice/:stateId',async(req,res) =>
{
  const options = {
    method: 'GET',
    url: `https://daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com/v1/list/india/${req.params.stateId}/cities`,
    params: {
      isoDate: '2022-09-01',
      'fuelTypes[0]': 'petrol'
    },
    headers: {
      'X-RapidAPI-Key': '56039ed7fcmshfb3e635008eb9f2p144630jsn292ffbb1d736',
      'X-RapidAPI-Host': 'daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com'
    }
  };
  
  try {
    const response = await axios.request(options);
    console.log(response.data);
    res.render('fuelcities',{cities:response.data.cities,state:req.params.stateId});
  } catch (error) {
    res.redirect('/getfuelprice');
  }

});

app.get('/getfuelprice/:stateId/:cityId',async(req,res)=>{

  const options = {
    method: 'GET',
    url: `https://daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com/v1/fuel-prices/today/india/${req.params.stateId}/${req.params.cityId}`,
    headers: {
      'X-RapidAPI-Key': '56039ed7fcmshfb3e635008eb9f2p144630jsn292ffbb1d736',
      'X-RapidAPI-Host': 'daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com'
    }
  };
  
  try {
    const response = await axios.request(options);
    console.log(response.data);
    //res.send(response.data);
    res.render('fuelprice',{data:response.data});
  } catch (error) {
    res.redirect('/getfuelprice');
  }

});
//end of get fuel price by city

//allowing admin to ente the truck link

app.get('/enterlink',(req,res)=>
{
  res.render('enterlink');
});
app.post('/enterlink',async(req,res)=>
{
    //const id=req.session.id;
    const {loadid,tracklink}=req.body;
    const newtrack= await new Track({loadid,tracklink});
    newtrack.save() 
    .then(() => {
        res.redirect(`/index/123`);
      })
      .catch((err) => {
        console.log(err);
        res.send('Error saving data');
      });
});

//send the link through wgatsup if corresct customer id

app.post('/sendtracklink',async(req, res) => {
  const {loadid,phone}=req.body;
  try{
    const user=await Track.findOne({ loadid:loadid});
    console.log(user);
    if(user) {
      const phoneNumber = phone; // Replace with your phone number
    const message = `Hello this is your ${user.tracklink}`; // Replace with your message
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    res.redirect(url);
     }
     else
     {
       res.send("error");
     }
   }
     catch(err) {
      res.send(error);
     }
})

//


app.listen(3000,()=>{
    console.log('listening on port 3000');
});

