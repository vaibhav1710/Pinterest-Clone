var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const boardModel = require("./boards");
const localStrategy = require("passport-local");
const upload = require("./multer");
const flash = require("connect-flash");
const crypto = require("crypto");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
passport.use(new localStrategy(userModel.authenticate()));

// Load environment variables from a .env file using the 'dotenv' library.
dotenv.config();

// Function to generate a random image name using 32 random bytes converted to a hexadecimal string.
const randomImageName = (bytes = 32) => crypto.randomBytes(16).toString("hex");

// Retrieve configuration parameters for AWS S3 from environment variables.
const bucketName = process.env.BUCKET_NAME; // Bucket Name
const bucketRegion = process.env.BUCKET_REGION; // Bucket Region
const accessKey = process.env.ACCESS_KEY; // AWS access key
const secretAccessKey = process.env.SECRET_KEY; // AWS secret access key

//  Initialize an AWS S3 client using the 'S3Client' class from '@aws-sdk/client-s3'.

// The 's3' client is a crucial component for interacting with Amazon S3, playing the following roles:

// 1. **Interface to Amazon S3**: Acts as an interface, allowing the application to communicate with Amazon S3, the cloud-based object storage service provided by AWS.
// 2. **Encapsulation of S3 Operations**: Encapsulates the logic for making requests and handling responses when performing operations on S3, such as uploading, downloading, and managing objects within a bucket.
// 3. **Abstraction of AWS SDK Complexity**: Abstracts away the low-level details of interacting with the AWS SDK for JavaScript, providing a simplified and convenient API for working with S3.
// 4. **Configuration Holder**: Stores the configuration settings, including the AWS region and credentials, making it easier to manage and modify these settings in one central location.
// 5. **Reusable Across the Application**: Once instantiated, the 's3' client can be reused throughout the application to perform various S3-related tasks without the need for redundant configuration.

// Example Use:
// The 's3' client would be used in other parts of the application to perform S3 operations, such as uploading files, retrieving objects, or managing the contents of S3 buckets.
// For instance, you might use 's3' to upload a file to the configured S3 bucket as demonstrated in other parts of the code.
const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

// Route for handling the creation of a new post. Accessible through the '/createpost' endpoint, requires user authentication and file upload.
router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    // Retrieve the user information from the database based on the authenticated user's session.
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Generate a random image name for the uploaded post image.
    const imageName = randomImageName();

    // Define parameters for uploading the post image to the specified S3 bucket.
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Create an AWS S3 PutObjectCommand using the defined parameters to upload the post image.
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // Create a new post in the database with the provided information, including the generated image name.
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags,
      image: imageName,
    });

    // Update the user's posts array with the newly created post and save the changes.
    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  }
);

// Default route rendering the index view. No authentication required.
router.get("/", function (req, res, next) {
  res.render("index", { nav: false, error: req.flash("error") });
});

// Route for rendering the registration page.
router.get("/register", function (req, res, next) {
  const error = req.flash("error");
  res.render("register", { nav: false, error });
});

// Define a route for rendering user profiles, accessible through the '/profile' endpoint.
router.get("/profile", isLoggedIn, async function (req, res, next) {
  // Retrieve user information, including populated boards and posts, from the database using Passport session data.
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate({
      path: "boards",
      model: "board",
      populate: {
        path: "posts",
        model: "post",
      },
    })
    .populate("posts");

  // Iterate through each post of the user to retrieve and append a signed URL for the post's image from an S3 bucket.
  for (const post of user.posts) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: post.image,
    };

    // Create an AWS S3 GetObjectCommand using the defined parameters.
    const command = new GetObjectCommand(getObjectParams);

    // Generate a signed URL for the S3 object with a defined expiration time
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    post.imageUrl = url;
  }

  // Iterate through each board of the user and each post within the boards to retrieve and append signed URLs for the post images.
  for (const boards of user.boards) {
    for (const post of boards.posts) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: post.image,
      };

      // Create an AWS S3 GetObjectCommand using the defined parameters.
      const command = new GetObjectCommand(getObjectParams);

      // Generate a signed URL for the S3 object with a defined expiration time.
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      post.imageUrl = url;
    }
  }
  res.render("profile", { user, nav: true });
});

// Define a route for handling the display of posts.
router.get("/show/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  // Iterate through each post of the user to retrieve and append a signed URL for the post's image from an S3 bucket.
  for (const post of user.posts) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: post.image,
    };

    // Create an AWS S3 GetObjectCommand using the defined parameters.
    const command = new GetObjectCommand(getObjectParams);

    // Generate a signed URL for the S3 object with a defined expiration time.
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    post.imageUrl = url;
  }
  res.render("show", { user, nav: true });
});

//Route for rendering the feed page
router.get("/feed", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  // Find all posts in the database and populate the "user" field
  const posts = await postModel.find().populate("user");

  // Populate signed URLs for each post's image from S3
  for (const post of posts) {
    const getObjectParams = { 
      Bucket: bucketName,
      Key: post.image,
    };

    // Create a new GetObjectCommand with the specified parameters
    const command = new GetObjectCommand(getObjectParams);

    //Get a signed URL for the S3 object that expires in 3600 seconds
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    post.imageUrl = url;
  }
  res.render("feed", { user, posts, nav: true });
});

// Route for rendering the page to add a pin
router.get("/addPin", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("addPin", { user, nav: true });
});

// Route for rendering the page to add a board
router.get("/addBoard", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("addBoard", { user, nav: true });
});

// Route for creating a board
router.post("/createboard", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  // Create a new board in the database
  const board = await boardModel.create({
    title: req.body.title,
  });
  user.boards.push(board._id);
  await user.save();
  res.redirect("/profile");
});

// Route for displaying a specific board
router.get("/board/:id", async function (req, res, next) {
  const boardId = req.params.id;
  const boards = await boardModel.findOne({ _id: boardId }).populate("posts");

  // Populate signed URLs for each post's image from S3
  for (const post of boards.posts) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: post.image,
    };

    // Create a new GetObjectCommand with the specified parameters
    const command = new GetObjectCommand(getObjectParams);
    // Get a signed URL for the S3 object that expires in 3600 seconds
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    post.imageUrl = url;
  }
  res.render("showboard", { nav: true, boards });
});

// Route for rendering the page to add a pin to a board
router.get(
  "/addboardPin/:id",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    const boardId = req.params.id;
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const board = await boardModel.findOne({ _id: boardId });
    res.render("addPinToBoard", { user, board, nav: true });
  }
);

// Route for creating a board pin
router.post(
  "/createboardpin/:id",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    // Extract board ID from the request parameters
    const boardId = req.params.id;

    // Find the board in the database based on the board ID
    const board = await boardModel.findOne({ _id: boardId });

    // Find the authenticated user in the database based on the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Generate a random image name for the post image
    const imageName = randomImageName();

    // Set up parameters for uploading the post image to S3
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Upload the post image to S3
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // Create a new post in the database
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags,
      image: imageName,
    });

    // Update the user and board with the new post
    user.posts.push(post._id);
    board.posts.push(post._id);

    // Save changes to the user and board in the database
    await user.save();
    await board.save();
    res.redirect(`/board/${boardId}`);
  }
);

// Route for rendering the edit view
router.get("/edit", isLoggedIn, async function (req, res, next) {
  res.render("change", { nav: true });
});

// Route for displaying a specific Pin
router.get("/post/:id", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const postId = req.params.id;

  // Find the pin in the database based on the post ID and populate the "user" field
  const post = await postModel.findOne({ _id: postId }).populate("user");

  // Set up parameters to get a signed URL for the post image from S3
  const getObjectParams = {
    Bucket: bucketName,
    Key: post.image,
  };

  // Send a command to get a signed URL for the post image from S3
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  // Attach the signed URL to the post object
  post.imageUrl = url;

  if (!post) {
    // Handle case when post is not found
    res.status(404).send("Post not found");
    return;
  }
  res.render("showpost", { nav: true, post, user });
});

// Route for deleting a Pins
router.delete("/delete/:id", isLoggedIn, async (req, res) => { 
  const postid = req.params.id;
  const post = await postModel.findById(postid);
  // Find the user in the database based on the authenticated session
  const user = await userModel.findOne({ username: req.session.passport.user });
  // Check if the post exists
  if (!post) {
    res.status(404).send("Post Not Found");
    return;
  }

  // Set up parameters for deleting the post image from S3
  const params = {
    Bucket: bucketName,
    Key: post.image,
  };

  // Send a command to delete the post image from S3
  const command = new DeleteObjectCommand(params);
  await s3.send(command);

  // Remove the post ID from the user's posts array
  user.posts.pull(postid);
  await user.save();
  await postModel.findByIdAndDelete(postid);
  res.redirect("/feed");
});

// Route for updating user information
router.put("/changing", async (req, res) => {
  try {
    // Retrieve the authenticated user's username from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const userId = req.user.id; // Assuming you use some form of authentication

    // Retrieve the fields to be updated from the request body
    const { name, contact } = req.body;

    // Construct the update object only with provided details
    const updateObject = {};
    if (name) updateObject.name = name;
    if (contact) updateObject.contact = contact;

    // Find the user in the database and update their information
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateObject },
        { new: true } // Return the updated document
      )
      .populate("boards")
      .populate("posts");

    res.redirect("/profile"); // Redirect to the profile page after updating
  } catch (err) {
    console.error("Error updating user information:", err);
    res.status(500).send(err.message);
  }
});

// Route for handling user registration
router.post("/register", async function (req, res, next) {
  // Create a new user model instance with provided data
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
    name: req.body.fullname,
  });

  // Check if the email and username are already in use
  const { email, username } = req.body;
  const existingEmailUser = await userModel.findOne({ email });
  const existingUsernameUser = await userModel.findOne({ username });

  // Handle cases where email or username is already in use
  if (existingEmailUser && existingUsernameUser) {
    // Email and Username is already in use
    req.flash("error", "Email and username is already in use.");
    return res.redirect("/register"); // Redirect to the registration page or handle accordingly
  }
  if (existingEmailUser) {
    // Email is already in use
    req.flash("error", "Email is already in use.");
    return res.redirect("/register"); // Redirect to the registration page or handle accordingly
  }
  if (existingUsernameUser) {
    // Username is already in use
    req.flash("error", "Username is already in use.");
    return res.redirect("/register"); // Redirect to the registration page or handle accordingly
  }
  userModel.register(data, req.body.password).then(function () {
    // Authenticate the user after registration
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

// Route for handling login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    successRedirect: "/profile",
    failureFlash: "true",
  }),
  function (req, res, next) {}
);

// Route for handling logout
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

/**
 * Middleware to check if the user is authenticated.
 * If the user is authenticated, the next middleware or route handler is called.
 * If not authenticated, the user is redirected to the home page ("/").
 **/
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Route for handling file upload (profile pic)
router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    // Get the authenticated user from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Generating a random image name
    const imageName = randomImageName();

    // Set up parameters for uploading the file to S3
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    // console.log(params);
    let command = new PutObjectCommand(params);
    await s3.send(command);

    // Set up parameters to get a signed URL for the uploaded file
    const getObjectParams = {
      Bucket: bucketName,
      Key: imageName,
    };

    // Get a signed URL for the uploaded file
    command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    user.profileImage = url;
    await user.save();
    res.redirect("/profile");
  }
);

module.exports = router;
