const mongoose = require("mongoose");


const boardSchema = mongoose.Schema({

 title: String,
 posts: [
  { type : mongoose.Schema.Types.ObjectId,
  ref : "post"
 }
]
});

module.exports = mongoose.model("board" , boardSchema);