var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const boardModel = require("./boards");
const localStrategy = require("passport-local");
const upload = require("./multer");
passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {nav:false});
});

router.get('/register', function(req, res, next) {
  res.render('register',{nav:false});
});

router.get('/profile', isLoggedIn , async function(req, res, next) {
  const user = await userModel
                     .findOne({username:req.session.passport.user})
                     .populate({
                      path:"boards",
                      model:"board",
                      populate:{
                        path:"posts",
                        model:"post"
                      }
                     })
                     .populate("posts");
                     
   
                     

  res.render('profile',{user, nav:true});
});

router.get('/show/posts', isLoggedIn , async function(req, res, next) {
  const user = await userModel
                     .findOne({username:req.session.passport.user})
                     .populate("posts");
                  
  res.render('show',{user, nav:true});
});

router.get('/feed', isLoggedIn , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  const posts = await postModel.find().populate("user");
  res.render("feed", {user, posts ,nav : true});
});





router.get('/addPin', isLoggedIn , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
    res.render('addPin',{user, nav:true});
});

router.get('/addBoard', isLoggedIn , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
    res.render('addBoard',{user, nav:true});
});

router.post("/createboard", isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
 
  const board = await boardModel.create({
    title: req.body.title,
  });

 
  user.boards.push(board._id);
  await user.save();
  res.redirect("/profile");

})


router.post('/createpost', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
const post = await  postModel.create({
     user: user._id,
     title:req.body.title,
     description:req.body.description,
     tags: req.body.tags,
     image:req.file.filename,
   });
 
   user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");
});


router.get("/board/:id" , async function(req,res,next){
  const boardId = req.params.id;
  const boards = await boardModel.findOne({_id:boardId}).populate("posts");

 
  res.render("showboard", {nav:true,boards})
})



router.get('/addboardPin/:id', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
  const boardId = req.params.id;
  const user = await userModel.findOne({username:req.session.passport.user})
  const board = await boardModel.findOne({_id:boardId});
  res.render('addPinToBoard',{user, board ,nav:true});
});



router.post('/createboardpin/:id', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
const boardId = req.params.id;  
const board = await boardModel.findOne({_id:boardId}); 
const user = await userModel.findOne({username:req.session.passport.user})
const post = await  postModel.create({
     user: user._id,
     title:req.body.title,
     description:req.body.description,
     tags: req.body.tags,
     image:req.file.filename,
   });
 
   user.posts.push(post._id);
   board.posts.push(post._id);

   await user.save();
   await board.save();
   res.redirect(`/board/${boardId}`);
});


router.get("/edit", isLoggedIn ,async function(req,res,next){
  res.render("change", {nav:true});
});





router.get("/post/:id", isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user})
  const postId = req.params.id;
  const post = await postModel
  .findOne({ _id: postId })
  .populate("user");


  if (!post) {
    // Handle case when post is not found
    res.status(404).send('Post not found');
    return;
  }
   res.render("showpost", {nav:true,post,user});
});



router.post('/createpost', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
const post = await  postModel.create({
     user: user._id,
     title:req.body.title,
     description:req.body.description,
     tags: req.body.tags,
     image:req.file.filename,
   });
 
   user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");
});


router.delete("/delete/:id", isLoggedIn ,async (req,res) => {
 
  const postid = req.params.id;
   const post = await postModel.findById(postid);
   const user = await userModel.findOne({username:req.session.passport.user});
  
   console.log(post);
   console.log(user);
 
   user.posts.pull(postid);
   await user.save();
   await postModel.findByIdAndDelete(postid);
  console.log(postid);
  res.redirect("/feed");
});


router.post('/changing', async (req, res) => {
  try {
    const user =  await userModel.findOne({username:req.session.passport.user})
    const userId = req.user.id; // Assuming you use some form of authentication

    // Retrieve the fields to be updated from the request body
    const { name, contact } = req.body;

    // Construct the update object only with provided details
    const updateObject = {};
    if (name) updateObject.name = name;
    if (contact) updateObject.contact = contact;

    // Find the user in the database and update their information
    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { $set: updateObject },
        { new: true } // Return the updated document
    ).populate('boards').populate('posts');
    
    res.redirect('/profile'); // Redirect to the profile page after updating
} catch (err) {
    console.error('Error updating user information:', err);
    res.status(500).send(err.message);
}
});



router.post("/register", function(req,res,next){
 const data = new userModel({
  username:req.body.username,
  email: req.body.email,
  contact: req.body.contact,
  name:req.body.fullname,
 })

 userModel.register(data, req.body.password)
 .then(function(){
  passport.authenticate("local")(req,res,function(){
   res.redirect("/profile");
  })
 })
});


router.post("/login", passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile",
}),function(req,res,next){
});


router.get("/logout" , function(req,res,next){
  req.logout(function(err){
    if(err) {return next(err);}
    res.redirect("/");
  });
});


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}

router.post('/fileupload', isLoggedIn, upload.single("image") ,async function(req, res, next) {
const user = await userModel.findOne({username:req.session.passport.user})
user.profileImage = req.file.filename;
await user.save();
res.redirect("/profile");
})


module.exports = router;