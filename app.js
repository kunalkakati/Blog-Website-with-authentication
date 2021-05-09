const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const about = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
// Password
const bcrypt = require("bcrypt");
const salt = 10;


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

const app = express();
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
const time = updateTime();


// Database
mongoose.connect("mongodb://localhost:27017/BlogDB", {useNewUrlParser: true,useUnifiedTopology: true})
mongoose.set('useCreateIndex', true);

    const Schema = new mongoose.Schema({
        tittle: String,
        time: String,
        content: String
    });
    //collection
    const Blog = mongoose.model("blog", Schema);

    const UserSchema = new mongoose.Schema({
        Username: String,
        email: String,
        password: String,
        googleID: String
    });


    const User = mongoose.model("blog_password", UserSchema);

   /*   let blog1 = new Blog ({
        tittle: "Day1",
        time: time,
        content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remainin"
    });
    blog1.save();  */

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/home.html");
});

app.get("/home", function(req,res){
    //find all data saved in database and pass into home.ejs
    Blog.find({}, function(err,doc){
        if(err){
            console.log("Error on find method" + err);
        }
        else{
            res.render("home", {posts: doc});
        }
    });
    
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

app.get("/register", (req,res)=>{
    res.render("register");
});

app.post("/register", (req,res)=>{
    bcrypt.hash(req.body.password, salt, function(err,hash){
        if(!err){
            const userData = new User({
                Username: req.body.username,
                email: req.body.email,
                password: hash
            });
            userData.save(function(err){
                if(err){
                    console.log("err on save method");
                }
            });
        }else{
            console.log(err);
        }
    });
    res.redirect("/home");
});

app.post("/login", (req,res)=>{
    User.findOne({Username: req.body.username}, function(err, doc){
        if(!err){
            bcrypt.compare(req.body.password, doc.password, function(err,resl){
                if(resl === true){
                    res.redirect("/home");
                }else{
                    res.redirect("/register");
                }
            });
        }
    })
})

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