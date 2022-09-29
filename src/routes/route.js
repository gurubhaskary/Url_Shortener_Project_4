const express = require("express");
const router = express.Router();
const urlController=require("../controller/urlShorter")
//=========testApi=========
router.get("/test",function (req,res){
    res.send("Hello Work")
});


router.post("/url/shorten",urlController.urlshorten)

router.get("/:urlCode",urlController.getUrlByParam)


module.exports=router