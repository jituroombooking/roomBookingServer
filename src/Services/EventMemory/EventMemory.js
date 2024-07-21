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

const editEventMemory = async (req, res) => {
  try {
    console.log(req.body);
    let newImageName = "";
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      newImageName = imageName;
      const deleteParams = {
        Bucket,
        Key: `event/${req.body.oldImg}`,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      const deleteObject = await client.send(deleteCommand);
      if (!deleteObject) {
        return res
          .status(500)
          .json({ message: "Delete image operation failed" });
      }
      const updateParams = {
        Bucket: process.env.BUCKET,
        Key: `event/${newImageName}`,
        Body: req.file.buffer,
        ACL: "public-read-write",
      };
      const updateCommand = new PutObjectCommand(updateParams);
      const updateResponse = await client.send(updateCommand);
      if (!updateResponse) {
        return res
          .status(500)
          .json({ message: "Update image operation failed" });
      }
      req.body.eventImg = newImageName;
    }
    await EventMemoryModal.findByIdAndUpdate(
      { _id: req.body._id },
      { ...req.body }
    )
      .then((updateRes) => {
        res.status(200).send(req.body);
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const deleteEventMemory = async (req, res) => {
  try {
    const { objId, imgId } = req.params;
    if (!objId || !imgId) {
      return res.status(500).json({ message: "Id is required for deletion" });
    }
    const deleteParams = {
      Bucket,
      Key: `event/${imgId}`,
    };
    const deleteCommand = new DeleteObjectCommand(deleteParams);
    const deleteObject = await client.send(deleteCommand);
    if (!deleteObject) {
      return res.status(500).json({ message: "Delete image operation failed" });
    }
    const deletedRecord = await EventMemoryModal.findOneAndDelete({
      _id: objId,
    });
    if (!deletedRecord) {
      return res.status(404).send({ error: "Record not found" });
    }
    res.status(200).send(objId);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

module.exports = {
  addEventMemory,
  deleteEventMemory,
  editEventMemory,
  getEventMemory,
};
