const {
  S3Client,
  S3,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");

const RoomModal = require("../Room/RoomModal");
const BookingModal = require("./UserBookingModal");
const ActualRoom = require("../Rooms/RoomsModal");
const UserRoomMappingModel = require("../UserRoomMapping/UserRoomMappingModel");
const { default: mongoose } = require("mongoose");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.REGION;
const Bucket = process.env.BUCKET;

const addBooking = async (req, res, next) => {
  try {
    const userRoomMapping = [];
    const updatedArray = [];

    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      const Key = `userbooking/${imageName}`;
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
          const {
            fullName,
            familyMember,
            identityProof,
            bookingFrom,
            bookingTill,
            mobileNumber,
          } = req.body;
          if (
            fullName === "" ||
            familyMember === 0 ||
            bookingFrom === "" ||
            bookingTill === "" ||
            mobileNumber === ""
          ) {
            res.status(400).send("Please send the required data");
            res.end();
            return;
          }
          const userBookingModal = await BookingModal.insertMany({
            fullName,
            familyMember,
            bookingFrom,
            bookingTill,
            mobileNumber,
            identityProof: imageName,
          });
          if (!userBookingModal) {
            res
              .status(500)
              .send("insert Operation failed for User room booking");
            res.end();
            return;
          }

          const actualRooms = await ActualRoom.find({ availabel: true });
          let finalFamilyNum = parseInt(familyMember);
          if (parseInt(familyMember) !== 0 && actualRooms) {
            actualRooms.map(async (m) => {
              let Obj = m.bookerIds;
              const bookedNumber = m.bookerIds.length;
              const availableBed = m.noOfBed - bookedNumber;
              const userRoomMappingObj = {};
              if (availableBed > 0) {
                for (let i = 0; i < availableBed; i++) {
                  if (finalFamilyNum > 0) {
                    if (
                      userRoomMapping.length === 0 ||
                      userRoomMapping.some((item) => {
                        return item.roomId.toString() !== m._id.toString();
                      })
                    ) {
                      userRoomMappingObj.bhavanId = m.bhavanId;
                      userRoomMappingObj.roomId = m._id;
                      userRoomMappingObj.userId = userBookingModal[0]._id;
                      userRoomMapping.push(userRoomMappingObj);
                    }
                    finalFamilyNum = finalFamilyNum - 1;
                    Obj.push({
                      id: userBookingModal[0]._id,
                      bookingFrom,
                      bookingTill,
                    });
                  }
                }
                updatedArray.push({
                  _id: m._id,
                  roomNumber: m.roomNumber,
                  noOfBed: m.noOfBed,
                  // availabel: availableBed > 1,
                  availabel: m.noOfBed > Obj.length,
                  used: m.used,
                  bookedFrom: m.bookedFrom,
                  bookedTill: m.bookedTill,
                  bookerIds: [...Obj],
                  bhavanId: m.bhavanId,
                });
              }
            });

            let count = 0;
            updatedArray.map(async (updateM) => {
              await ActualRoom.findByIdAndUpdate(
                { _id: updateM._id },
                {
                  availabel: updateM.availabel,
                  used: updateM.used,
                  bookedFrom: updateM.bookedFrom,
                  bookedTill: updateM.bookedTill,
                  bookerIds: [...updateM.bookerIds],
                }
              )
                .then((res) => {})
                .catch((err) => {
                  res
                    .status(500)
                    .send("insert Operation failed for Room booking");
                  res.end();
                  return;
                });
            });
            const remaningMemberinsert = await BookingModal.findByIdAndUpdate(
              {
                _id: userBookingModal[0]._id,
              },
              {
                memberAllotted: familyMember - finalFamilyNum,
              }
            );
            if (!remaningMemberinsert) {
              res
                .status(500)
                .send(
                  "insert Operation failed for User booking remaining member"
                );
              res.end();
              return;
            }
            await UserRoomMappingModel.insertMany(userRoomMapping)
              .then((insertRes) => {
                res.status(200).send("insert Operation Sucessfull");
              })
              .catch((err) => {
                throw err;
              });
          } else {
            res.status(400).send("Getting room data failed");
            res.end();
            return;
          }
        });
    } else {
      throw "Image is not provided";
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getBookedRooms = async (req, res) => {
  try {
    await UserRoomMappingModel.aggregate([
      {
        $lookup: {
          from: "actualrooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomData",
        },
      },
      {
        $lookup: {
          from: "userbookings",
          localField: "userId",
          foreignField: "_id",
          as: "userBookingData",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "bhavanId",
          foreignField: "_id",
          as: "bhavanData",
        },
      },
      { $unwind: "$roomData" },
      { $unwind: "$userBookingData" },
      { $unwind: "$bhavanData" },
    ])
      .then((getRes) => {
        const finalData = new Map();
        getRes.map((m) => {
          if (!finalData.get(m.userId.toString())) {
            const { roomData, userBookingData, bhavanData, ...restProps } = m;
            finalData.set(m.userId.toString(), {
              roomData: [roomData],
              userBookingData,
              bhavanData: [bhavanData],
              ...restProps,
            });
          } else if (
            finalData.get(m.userId.toString()).userId.toString() ===
            m.userId.toString()
          ) {
            const { roomData, userBookingData, bhavanData, ...restProps } =
              finalData.get(m.userId.toString());
            roomData.push(m.roomData);
            bhavanData.push(m.bhavanData);
            finalData.set(m.userId.toString(), {
              roomData,
              userBookingData,
              bhavanData,
              ...restProps,
            });
          }
        });

        const resArray = Array.from(finalData, ([name, value]) => ({
          ...value,
        }));

        res.status(200).send(resArray);
      })
      .catch((err) => {
        throw "get room booking operation failed";
      });

    // await BookingModal.find({})
    //   .then((dbRes) => {
    //     res.status(200).send(dbRes);
    //   })
    //   .catch((err) => {
    //     throw "get room bboking operation failed";
    //   });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const deleteBooking = async (req, res) => {
  try {
    if (req.params.deleteId) {
      await ActualRoom.find({}).then((getRoomRes) => {
        getRoomRes.map((m) => {});
      });
      // await BookingModal.findById(req.params.deleteId).then((deleteDataRes) => {
      //   res.status(200).send(req.params.deleteId);
      // });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const getUnAlottedMember = async (req, res) => {
  try {
    await BookingModal.aggregate([
      {
        $match: {
          $expr: {
            $ne: ["$familyMember", "$memberAllotted"],
          },
        },
      },
    ])
      .sort({ familyMember: -1 })
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

const editRoom = async (req, res) => {
  try {
    const {
      roomId,
      userId,
      bhavanData,
      _id: newUserId,
      bookingFrom,
      bookingTill,
      removePosition,
    } = req.body;

    if (
      !roomId ||
      !userId ||
      !newUserId ||
      !bookingFrom ||
      !bookingTill ||
      typeof removePosition === "undefined"
    ) {
      throw "roomId, userId, newUserId, bookingFrom, bookingTill or removePosition  is required ";
    }
    const actualRoom = await ActualRoom.findOne({ _id: req.body.roomId });
    if (!actualRoom) {
      return res.status(404).send("Room not found");
    }

    actualRoom.bookerIds[removePosition] = {
      id: new mongoose.Types.ObjectId(newUserId),
      bookingFrom,
      bookingTill,
    };

    actualRoom.save();

    const updatedUserRoomMapping = await UserRoomMappingModel.findOneAndUpdate(
      { roomId: roomId, userId: userId },
      { $set: { userId: new mongoose.Types.ObjectId(newUserId) } },
      { new: true }
    );
    if (!updatedUserRoomMapping) {
      return res.status(404).send("Room not found");
    }
    await BookingModal.findOneAndUpdate(
      { _id: newUserId },
      { $inc: { memberAllotted: 1 } }
    );

    await BookingModal.findOneAndUpdate(
      { _id: userId },
      { $inc: { memberAllotted: -1 } }
    );

    res.status(200).send(updatedUserRoomMapping);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const editRoomNewUser = async (req, res) => {
  try {
    const {
      roomId,
      removePosition,
      bookingFrom,
      bookingTill,
      fullName,
      mobileNumber,
      userId,
      familyMember,
    } = req.body;
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      const imageName = `${uuidv4()}.${myFileType}`;
      const Key = `userbooking/${imageName}`;
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
          if (
            fullName === "" ||
            familyMember === 0 ||
            bookingFrom === "" ||
            bookingTill === "" ||
            mobileNumber === ""
          ) {
            res.status(400).send("Please send the required data");
            res.end();
            return;
          }
          const userBookingModal = await BookingModal.insertMany({
            fullName,
            familyMember,
            bookingFrom,
            bookingTill,
            mobileNumber,
            memberAllotted: 1,
            identityProof: imageName,
          });
          if (!userBookingModal) {
            res
              .status(500)
              .send("insert Operation failed for User room booking");
            res.end();
            return;
          }
          await ActualRoom.findOne({ _id: roomId })
            .then(async (getRes) => {
              getRes.bookerIds[parseInt(removePosition)] = {
                id: new mongoose.Types.ObjectId(userBookingModal[0]._id),
                bookingFrom,
                bookingTill,
              };

              return getRes.save();
            })
            .then(async (updatedDoc) => {
              await UserRoomMappingModel.findOneAndUpdate(
                { roomId: roomId, userId: userId },
                {
                  $set: {
                    userId: new mongoose.Types.ObjectId(
                      userBookingModal[0]._id
                    ),
                  },
                },
                { new: true }
              )
                .then(async (insertRes) => {
                  res.status(200).send("Rooom Updated Sucessfully");
                })
                .catch((err) => {
                  throw err;
                });
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          throw err;
        });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

module.exports = {
  addBooking,
  deleteBooking,
  editRoomNewUser,
  editRoom,
  getBookedRooms,
  getUnAlottedMember,
};
