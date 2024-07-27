const LabourPostModal = require("./LabourPostModal");

const addLabourPost = async (req, res) => {
  try {
    if (req.body.labourPost === "") {
      throw "labour post is required";
    }
    await LabourPostModal.insertMany({ labourPost: req.body.labourPost })
      .then((insertRes) => {
        res.status(201).send(insertRes);
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getLabourPost = async (req, res) => {
  try {
    await LabourPostModal.find({})
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

const deletePost = async (req, res) => {
  try {
    if (!req.params.deleteId) {
      throw "Id is required for deletion";
    }
    await LabourPostModal.findOneAndDelete({ _id: req.params.deleteId })
      .then((deleteRes) => {
        res.status(200).send(req.params.deleteId);
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
  addLabourPost,
  deletePost,
  getLabourPost,
};
