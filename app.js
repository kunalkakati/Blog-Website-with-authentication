require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const about = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
// Password
const session = require("express-session");
const passport = require("passport");
const PassportLocalMongoose = require("passport-local-mongoose");
//Google AOuth.
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


// real time
function updateTime(){
    const date = new Date();
    const dates = date.getDate();
    const mounth = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const secound = date.getMinutes();
    let currentDate = dates +"/"+mounth+"/"+year+" "+hour+":"+minute+":"+secound;
    return currentDate;
};
setInterval(updateTime, 1000);
const time = updateTime();

const app = express();
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

// console.log(process.env.SECRET);
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

//Initialize passport.
app.use(passport.initialize());
//tell passport to deal with session.
app.use(passport.session());

// Database
mongoose.connect("mongodb://localhost:27017/BlogDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false})
mongoose.set('useCreateIndex', true);

    //User data schema
    const Schema = new mongoose.Schema({
        tittle: String,
        time: String,
        content: String
    });
    //collection
    const Blog = mongoose.model("blog", Schema);

    //security schema
    const UserSchema = new mongoose.Schema({
        Username: String,
        email: String,
        password: String,
        googleId: String
    });
    //use hash and salt password and save into mongodb database. 
    UserSchema.plugin(PassportLocalMongoose);
    //use as a plugin findOrCreate dependencies
    UserSchema.plugin(findOrCreate);
    // collection usename password etc.
    const User = mongoose.model("blog_password", UserSchema);

    //only need when we use session.
    //this only work on pass-local-mongoose, if you use passport-local its different.
    passport.use(User.createStrategy()); 
    //create a cookie and put info
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    // crumble the cookie and to discover what is inside
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
      
      passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/Blog"
      },
      function(accessToken, refreshToken, profile, cb) {
          console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

app.get("/", (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/home");
    }else{
        res.sendFile(__dirname + "/home.html");
    }
});

app.get("/home", function(req,res){
    //find all data saved in database and pass into home.ejs
    if(req.isAuthenticated()){
        Blog.find({}, function(err,doc){
            if(err){
                console.log("Error on find method" + err);
            }
            else{
                res.render("home", {posts: doc});
            }
        });
    }else{
        res.redirect("/login");
    }
    
});

//Google strategy
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/Blog", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

//About page
app.get("/about", (req,res)=>{
        res.render("about", {header: "About", pera: about});
});
//contect page
app.get("/contact", (req,res)=>{
    res.render("contect", {header: "contect", pera: about});
});
// Write new blog
app.get("/compose", (req,res)=>{
    res.render("compose");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/logout", (req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get("/register", (req,res)=>{
    res.render("register");
});

app.post("/register", (req,res)=>{
// comes from local passport mongoose.
   User.register({username: req.body.username, email: req.body.email},req.body.password, function(err,resl){
       if(err){
           console.log(err);
           res.redirect("/register");
       }else{
           passport.authenticate("local")(req,res, ()=>{
               res.redirect("/home");
           });
       }
   });
});

app.post("/login", (req,res)=>{
   
   const log = new User({
        Username: req.body.username,
        password: req.body.password
   });

   req.logIn(log, function(err){
        if(err){
            console.log(err);
            // res.redirect("/register");
        }else{
           passport.authenticate("local")(req,res, ()=>{
               res.redirect("/home");
           });
        }
   });
});

//data back from compose page
app.post("/compose", (req,res)=>{    
       let Tittle = _.capitalize(req.body.textTittle); 
       let Contant = _.capitalize(req.body.textContant);
       //save data into database
        const saveData = new Blog({
            tittle:Tittle,
            time: time,
            content: Contant
        });
        saveData.save((err)=>{
            if(!err){
                res.redirect("/home");
            }
        });
});

// to show a particular blog 
app.get("/post/:postID", (req,res)=>{
    const urlID = req.params.postID;
    //find document using there _ID
    Blog.findById(urlID, function(err,doc){
        if(err){
            console.log("Error in findById method"+err);
        }
        else{
            res.render("post", {H1: doc.tittle, peragraph: doc.content});
        }
    });

});



app.post("/delete", (req,res)=>{
    console.log(req.body.docID);

    Blog.findByIdAndRemove(req.body.docID, function(err){
        if(!err){
        console.log("Successfully removed item");
    }
    });
    res.redirect("home");
});



app.listen(3000, ()=>{
    console.log("server running at port 3000");
});