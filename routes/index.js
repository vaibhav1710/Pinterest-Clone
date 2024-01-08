var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const boardModel = require("./boards");
const localStrategy = require("passport-local");
const upload = require("./multer");
const crypto =  require("crypto");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client , PutObjectCommand, GetObjectCommand , DeleteObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
passport.use(new localStrategy(userModel.authenticate()));

dotenv.config()

const randomImageName = (bytes = 32) => crypto.randomBytes(16).toString('hex');

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_KEY

const s3 = new S3Client({
  region:bucketRegion,
  credentials: {
    accessKeyId : accessKey,
    secretAccessKey : secretAccessKey,
  },
});

router.post('/createpost', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})

   const imageName = randomImageName();
   const params = {
    Bucket : bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype
   }
  // console.log(params);
   const command = new PutObjectCommand(params);
   await s3.send(command)

   const post = await  postModel.create({
    user: user._id,
    title:req.body.title,
    description:req.body.description,
    tags: req.body.tags,
    image:imageName,
  });

  user.posts.push(post._id);
  await user.save();

   res.redirect("/profile");
});


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
                     
   for(const post of user.posts){
    const getObjectParams = {
      Bucket : bucketName,
      Key : post.image,
    }
 
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3,command, {expiresIn: 3600});
    post.imageUrl = url;
   }

   for(const boards of user.boards){
    for(const post of boards.posts){
      const getObjectParams = {
        Bucket : bucketName,
        Key : post.image,
      }
   
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3,command, {expiresIn: 3600});
      post.imageUrl = url;
    }
   }
                     

  res.render('profile',{user, nav:true});
});

router.get('/show/posts', isLoggedIn , async function(req, res, next) {
  const user = await userModel
                     .findOne({username:req.session.passport.user})
                     .populate("posts");

                     for(const post of user.posts){
                      const getObjectParams = {
                        Bucket : bucketName,
                        Key : post.image,
                      }
                   
                      const command = new GetObjectCommand(getObjectParams);
                      const url = await getSignedUrl(s3,command, {expiresIn: 3600});
                      post.imageUrl = url;
                     // console.log(post.imageUrl);
                     }                 
                  
  res.render('show',{user, nav:true});
});

router.get('/feed', isLoggedIn , async function(req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  const posts = await postModel.find().populate("user");
  
 // console.log(posts);
  for(const post of posts){
   const getObjectParams = {
     Bucket : bucketName,
     Key : post.image,
   }

   const command = new GetObjectCommand(getObjectParams);
   const url = await getSignedUrl(s3,command, {expiresIn: 3600});
   post.imageUrl = url;
  // console.log(post.imageUrl);
  }
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





router.get("/board/:id" , async function(req,res,next){
  const boardId = req.params.id;
  const boards = await boardModel.findOne({_id:boardId}).populate("posts");
  
  for(const post of boards.posts){
    const getObjectParams = {
      Bucket : bucketName,
      Key : post.image,
    }
 
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3,command, {expiresIn: 3600});
    post.imageUrl = url;
   // console.log(post.imageUrl);
   }
 
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
const imageName = randomImageName();
const params = {
 Bucket : bucketName,
 Key: imageName,
 Body: req.file.buffer,
 ContentType: req.file.mimetype
}
// console.log(params);
const command = new PutObjectCommand(params);
await s3.send(command)

const post = await  postModel.create({
 user: user._id,
 title:req.body.title,
 description:req.body.description,
 tags: req.body.tags,
 image:imageName,
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

  const getObjectParams = {
    Bucket : bucketName,
    Key : post.image,
  }

  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3,command, {expiresIn: 3600});
  post.imageUrl = url;

  if (!post) {
    // Handle case when post is not found
    res.status(404).send('Post not found');
    return;
  }
   res.render("showpost", {nav:true,post,user});
});



// router.post('/createpost', isLoggedIn , upload.single("postimage")  , async function(req, res, next) {
//   const user = await userModel.findOne({username:req.session.passport.user})
// const post = await  postModel.create({
//      user: user._id,
//      title:req.body.title,
//      description:req.body.description,
//      tags: req.body.tags,
//      image:req.file.filename,
//    });
 
//    user.posts.push(post._id);
//    await user.save();
//    res.redirect("/profile");
// });


router.delete("/delete/:id", isLoggedIn ,async (req,res) => {
 
  const postid = req.params.id;
   const post = await postModel.findById(postid);
   const user = await userModel.findOne({username:req.session.passport.user});
  
   if(!post){
    res.status(404).send("Post Not Found");
    return 
   }

   const params = {
    Bucket : bucketName,
    Key : post.image,
  }

  const command = new DeleteObjectCommand(params);
  await s3.send(command)
   user.posts.pull(postid);
   await user.save();
   await postModel.findByIdAndDelete(postid);
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

const imageName = randomImageName();
const params = {
 Bucket : bucketName,
 Key: imageName,
 Body: req.file.buffer,
 ContentType: req.file.mimetype
}
// console.log(params);
let command = new PutObjectCommand(params);
await s3.send(command)

const getObjectParams = {
  Bucket : bucketName,
  Key : imageName,
}

command = new GetObjectCommand(getObjectParams);
const url = await getSignedUrl(s3,command, {expiresIn: 3600});

user.profileImage = url;
await user.save();




res.redirect("/profile");
})


module.exports = router;
