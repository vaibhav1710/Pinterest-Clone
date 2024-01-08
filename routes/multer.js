const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const {v4: uuidv4} = require("uuid");
const path = require("path");


// aws.config.update({
//   region:"ap-south-1",
//   credentials: {
//     accessKeyId : "AKIA2N2EB3N7OSJTVVG5",
//     secretAccessKey : "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",
//   },
// });

// const s3 = new aws.S3();

  
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: 'pinterestclone27',
//     acl: 'public-read', // or 'private' if you want to restrict access
//     key: function (req, file, cb) {
//       // Specify the path and filename in the S3 bucket
//       cb(null, 'uploads/' + Date.now().toString() + '-' + file.originalname);
//     },
//   }),
// });


 const storage = multer.memoryStorage();
 const upload = multer({storage:storage})
  module.exports = upload;