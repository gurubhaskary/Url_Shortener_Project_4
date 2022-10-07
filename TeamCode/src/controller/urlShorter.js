//importing redis,util,shortId

const redis = require("redis");
const util = require("util");
const shortid = require("shortid");
const valiUrl = require("valid-url");

//reuiring model
const urlModel = require("../model/Urlmodel");

//Creating client using redis
const client = redis.createClient(
  17006,
  "redis-17006.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

//Checking Password
client.auth("h9vnoYfww1GKf1ny6UKRtko3YtTxMsju", (err) => {
  if (err) {
    throw err;
  }
});

//Connecting to the redis

client.on("connect", async function () {
  console.log("Connected to the redis");
});

//Using the redis Commands /Function/Queries

const SET_ASYNC = util.promisify(client.SET).bind(client);
const GET_ASYNC = util.promisify(client.GET).bind(client);

// URL Shortner
exports.urlShort = async function (req, res) {
  try {
    //Not Accepting Empty req

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "Request Cant be empty" });
    }

    //
    if (!req.body.longUrl) {
      return res.status(400).send({
        status: false,
        msg: "Key Should be longUrl!",
      });
    }

    //Accepting link in String Format
    if (typeof req.body.longUrl != "string") {
      return res.status(400).send({
        status: false,
        msg: "LongURL can be in a String only!",
      });
    }

    //Orignal Link

    //regex for links
    let checkUrl =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%\+.~#?&\/\/=]*)/.test(
        req.body.longUrl
      );

    //Checking Url (valid?/Not)

    if (checkUrl == false) {
      return res
        .status(400)
        .send({ status: false, msg: "Link is not in valid formate" });
    }

    //Checking baseUrl (Valid?/Not)
    if (!valiUrl.isUri(req.body.longUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "Url is Not Valid URL " });
    }

    //handling Dublication(bcz if this link is already present in Our Db We have to send him/her Same Shorterner)
    let duplicateUrl = await urlModel
      .findOne({ longUrl: req.body.longUrl })
      .select({ _id: 0, __v: 0 });

    //if not Found then Create that url in Collection
    if (duplicateUrl == null) {
      //genrating shortUrl
      let shortUrl = shortid.generate(req.body).toLowerCase();

      //       // let domain = new URL(urlStore.longUrl);
      //       //let baseUrl = "https://" + domain.hostname + "/" + shortUrll;

      let baseUrl = "http://localhost:3000/" + shortUrl;

      //Creating
      let urlStore = await urlModel.create({
        longUrl: req.body.longUrl,
        urlCode: shortUrl,
        shortUrl: baseUrl,
      });

      return res.status(201).send({
        status: true,
        data: {
          longUrl: urlStore.longUrl,
          shortUrl: urlStore.shortUrl,
          urlCode: urlStore.urlCode,
        },
      });
    }

    //Finding in Cache
    let cacheUrlInMemory = await GET_ASYNC(duplicateUrl.urlCode);

    //If(Not Found in Cache Memory)
    if (cacheUrlInMemory == null) {
      // Seting in Cash Storage
      await SET_ASYNC(duplicateUrl.urlCode, JSON.stringify(duplicateUrl));

      return res.status(200).send({
        status: true,
        msg: " this Url is already Present In Db ",
        data: duplicateUrl,
      });
    } else {
      return res.status(200).send({
        status: true,
        msg: "this Url is already Present( Comming From Cache Memory) ",
        data: JSON.parse(cacheUrlInMemory),
      });
    }
    // //checking alreqady (Present?/Not)
    // if (duplicateUrl.longUrl == req.body.longUrl) {
    //   return res.status(201).send({
    //     status: true,
    //     msg: " this Url is already present",
    //     data: duplicateUrl,
    //   });
    // }
  } catch (err) {
    res
      .status(500)
      .send({ status: false, msg: "Server Error!!", err: err.message });
  }
};

//get API
exports.getUrlByParam = async function (req, res) {
  try {
    //================Get URLCODE=========================
    let urlCode = req.params.urlCode;

    //================Short Id Verification// npm i shortid=========================
    if (!shortid.isValid(urlCode))
      return res.status(400).send({ status: false, message: "Invalid Code" });
    if (!/^[a-zA-Z0-9_-]{7,14}$/.test(urlCode))
      return res.status(400).send({
        status: false,
        message:
          "Enter UrlCode with a-z A-Z 0-9 -_ and of length 7-14 characters",
      });

    // ======================= Get Data From cache====
    let cahcedUrl = await GET_ASYNC(urlCode.toLowerCase()); //---get the urlCode from cache

    if (cahcedUrl) {
      return res.status(302).redirect(cahcedUrl);
    } else {
      let findUrl = await urlModel.findOne({ urlCode: urlCode });
      if (!findUrl)
        return res.status(404).send({ status: false, message: "No URL found" });

      //=============Set data in cache===============================
      await SET_ASYNC(urlCode, findUrl.longUrl);
      //================Rediecting To Original URL=========================
      return res.status(302).redirect(findUrl.longUrl);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
