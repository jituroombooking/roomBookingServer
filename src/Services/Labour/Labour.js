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

const client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

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
          req.body.labourIdProof = imageName;
          await LabourModal.insertMany(req.body)
            .then((dbRes) => {
              res.status(201).send(dbRes);
            })
            .catch((err) => {
              throw "labour insert Operation failed";
            });
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
    console.log(error);
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

const deleteLabour = async (req, res) => {
  try {
    const { labourDeleteId, imgId } = req.params;
    if (!labourDeleteId) {
      throw new Error("Delete id is required for deletion");
    }
    if (!imgId) {
      throw new Error("Image id is required for deletion");
    }

    const deleteparm = {
      Bucket,
      Key: `labour/${imgId}`,
    };
    const deleteImageResponse = new DeleteObjectCommand(deleteparm);
    const deleteResponse = await client.send(deleteImageResponse);
    if (deleteResponse) {
      const deletedRecord = await LabourModal.findOneAndDelete({
        _id: labourDeleteId,
      });
      if (!deletedRecord) {
        return res.status(404).send({ error: "Record not found" });
      }

      res.status(200).send({ message: "Record deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

const updateLabour = async (req, res) => {
  try {
    console.log(req.body);
    let updatedId = "";
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      updatedId = imageName;
      const updateImageKey = `labour/${imageName}`;
      const deleteParams = {
        Bucket,
        Key: `labour/${req.body.oldProofId}`,
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
        Key: updateImageKey,
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
    }
    const { _id, oldProofId, ...restProps } = req.body;
    restProps.labourIdProof = updatedId;
    await LabourModal.findByIdAndUpdate({ _id: _id }, { ...restProps })
      .then((updateRes) => {
        res.status(200).send({ message: "Record updated successfully" });
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

const markAsPaid = async (req, res) => {
  try {
    console.log(req.body);
    const { firstDay, ...restProps } = req.body;
    restProps.monthPaid.push(firstDay);
    await LabourModal.findOneAndUpdate({ _id: restProps._id }, { ...restProps })
      .then((addRes) => {
        res.status(200).send(restProps);
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getSingleLabour = async (req, res) => {
  try {
    if (!req.params.id) {
      throw "Id is required for fetching";
    }
    await LabourModal.findOne({ _id: req.params.id })
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
  addLabour,
  deleteLabour,
  getLabourList,
  getSingleLabour,
  markAttendence,
  markAsPaid,
  updateLabour,
};
