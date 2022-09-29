const express = require("express");
const router = express.Router();

//=========testApi=========
router.get("/test",function (req,res){
    res.send("Hello Work")
});


module.exports=router