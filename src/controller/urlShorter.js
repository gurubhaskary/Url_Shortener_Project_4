const urlModel = require("../model/Urlmodel")
const shortid = require("shortid")
// const validUrl = require('valid-url');


const getUrlByParam = async function (req, res) {
    try {
        //================Get URLCODE=========================
        let urlCode = req.params.urlCode;


        //================Short Id Verification// npm i shortid=========================
        if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: "Invalid Code" })
        if (!(/^[a-zA-Z0-9_-]{7,14}$/).test(urlCode)) return res.status(400).send({ status: false, message: "Enter UrlCode with a-z A-Z 0-9 -_ and of length 7-14 characters" })
        
        //================Nano Id Verification// npm i nano-id=========================
        // if (!nanoId.verify(urlCode)) return res.status(400).send({ status: false, message: "Invalid Code" })

        //================Checking URLCode exsistence in DB=========================
        let findUrl = await urlModel.findOne({ urlCode: urlCode })
        if (!findUrl) return res.status(404).send({ status: false, message: "No URL found" })
        longUrl = findUrl.longUrl
        //================Rediecting To Original URL=========================
        return res.status(302).redirect(findUrl.longUrl)
    }
    catch (error) {
        res.status(500).send({ error: error.message })
    }
}

module.exports = { getUrlByParam }

