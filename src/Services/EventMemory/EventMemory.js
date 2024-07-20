const {
  S3Client,
  S3,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");

const EventMemoryModal = require("./EventMemoryModal");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.REGION;
const Bucket = process.env.BUCKET;

const client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

const addEventMemory = (req, res) => {
  try {
    console.log(req.body);
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      const Key = `event/${imageName}`;
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
          req.body.eventImg = imageName;
          await EventMemoryModal.insertMany({ ...req.body })
            .then((insertRes) => {
              res.status(201).send(req.body);
            })
            .catch((err) => {
              throw err;
            });
        });
    } else {
      return res.status(404).send({ error: "Event Image is required" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getEventMemory = async (req, res) => {
  try {
    await EventMemoryModal.find({})
      .then((getRes) => {
        res.status(200).send(getRes);
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

module.exports = {
  addEventMemory,
  getEventMemory,
};
