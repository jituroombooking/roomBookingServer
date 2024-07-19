const {
  S3Client,
  S3,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");

const LabourModal = require("./LabourModal");
const LabourAttendenceModal = require("../../Services/LabourAttendence/LabourAttendenceModal");
const LabourPostModal = require("../LabourPost/LabourPostModal");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.REGION;
const Bucket = process.env.BUCKET;

const addLabour = async (req, res) => {
  try {
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      const Key = `labour/${imageName}`;
      new Upload({
        client: new S3Client({
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          region,
        }),
        params: {
          ACL: "public-read-write",
          Bucket,
          Key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        },
      })
        .done()
        .then(async (data) => {
          console.log(data);
          // req.body.labourIdProof = imageName;
          // await LabourModal.insertMany(req.body)
          //   .then((dbRes) => {
          //     res.status(201).send(dbRes);
          //   })
          //   .catch((err) => {
          //     throw "labour insert Operation failed";
          //   });
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const getLabourList = async (req, res) => {
  try {
    await LabourModal.find({})
      .then((dbRes) => {
        res.status(200).send(dbRes);
      })
      .catch((err) => {
        throw "get Operation failed";
      });
  } catch (error) {
    res.status(500).send(error);
  }
};

const markAttendence = async (req, res) => {
  try {
    console.log(req.body);
    await LabourAttendenceModal.replaceOne(
      {
        labourId: req.body.data,
        attendenceDate: req.body.date,
      },
      {
        labourId: req.body.data,
        attendenceDate: req.body.date,
        present: 1,
      },
      { upsert: true }
    ).then(async (findeOneRes) => {
      if (findeOneRes) {
        res.status(200).send({ data: "present", exist: true });
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

const addLabourPost = async (req, res) => {
  try {
    if (req.body.labourPost === "") {
      throw "labour post is required";
    }
    console.log(req.body);
    // await LabourPostModal({ ...req.body })
    //   .then((insertRes) => {
    //     res.status(201).send(insertRes);
    //   })
    //   .catch((err) => {
    //     throw err;
    //   });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

module.exports = {
  addLabour,
  getLabourList,
  markAttendence,
  addLabourPost,
};
