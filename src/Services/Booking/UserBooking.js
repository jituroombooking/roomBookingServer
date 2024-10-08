const {
  S3Client,
  S3,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid");
const { default: mongoose } = require("mongoose");

const RoomModal = require("../Room/RoomModal");
const BookingModal = require("./UserBookingModal");
const ActualRoom = require("../Rooms/RoomsModal");
const UserRoomMappingModel = require("../UserRoomMapping/UserRoomMappingModel");

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.REGION;
const Bucket = process.env.BUCKET;

const updateBooking = async (req, res) => {
  try {
    const {
      _id,
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
      mobileNumber === "" ||
      _id === ""
    ) {
      return res.status(400).send("Please send the required data");
    }
    let imageName = identityProof;
    if (req.file) {
      let fileName = req.file.originalname.split(".");
      const myFileType = fileName[fileName.length - 1];
      imageName = `${uuidv4()}.${myFileType}`;
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
        .then(async (data) => {});
    }
    const userBookingModal = await BookingModal.findByIdAndUpdate(_id, {
      fullName,
      familyMember,
      bookingFrom,
      bookingTill,
      mobileNumber,
      identityProof: imageName,
    });
    if (!userBookingModal) {
      return res
        .status(500)
        .send("insert Operation failed for User room booking");
    }
    res.status(200).send("Booking Updated");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  res.end();
};

const addBooking = async (req, res, next) => {
  try {
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
            return res.status(400).send("Please send the required data");
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

          addbookingMethod(
            req,
            res,
            familyMember,
            userBookingModal[0]._id,
            bookingFrom,
            bookingTill
          );

          // const actualRooms = await ActualRoom.find({ availabel: true });
          // let finalFamilyNum = parseInt(familyMember);
          // if (parseInt(familyMember) !== 0 && actualRooms.length > 0) {
          //   actualRooms.map(async (m) => {
          //     let Obj = m.bookerIds;
          //     const bookedNumber = m.bookerIds.length;
          //     const availableBed = m.noOfBed - bookedNumber;
          //     const userRoomMappingObj = {};
          //     if (availableBed > 0) {
          //       for (let i = 0; i < availableBed; i++) {
          //         if (finalFamilyNum > 0) {
          //           if (
          //             userRoomMapping.length === 0 ||
          //             userRoomMapping.some((item) => {
          //               return item.roomId.toString() !== m._id.toString();
          //             })
          //           ) {
          //             userRoomMappingObj.bhavanId = m.bhavanId;
          //             userRoomMappingObj.roomId = m._id;
          //             userRoomMappingObj.userId = userBookingModal[0]._id;
          //             userRoomMapping.push(userRoomMappingObj);
          //           }
          //           finalFamilyNum = finalFamilyNum - 1;
          //           Obj.push({
          //             id: userBookingModal[0]._id,
          //             bookingFrom,
          //             bookingTill,
          //           });
          //         }
          //       }
          //       updatedArray.push({
          //         _id: m._id,
          //         roomNumber: m.roomNumber,
          //         noOfBed: m.noOfBed,
          //         // availabel: availableBed > 1,
          //         availabel: m.noOfBed > Obj.length,
          //         used: m.used,
          //         bookedFrom: m.bookedFrom,
          //         bookedTill: m.bookedTill,
          //         bookerIds: [...Obj],
          //         bhavanId: m.bhavanId,
          //       });
          //     }
          //   });

          //   let count = 0;
          //   updatedArray.map(async (updateM) => {
          //     await ActualRoom.findByIdAndUpdate(
          //       { _id: updateM._id },
          //       {
          //         availabel: updateM.availabel,
          //         used: updateM.used,
          //         bookedFrom: updateM.bookedFrom,
          //         bookedTill: updateM.bookedTill,
          //         bookerIds: [...updateM.bookerIds],
          //       }
          //     )
          //       .then((res) => {})
          //       .catch((err) => {
          //         res
          //           .status(500)
          //           .send("insert Operation failed for Room booking");
          //         res.end();
          //         return;
          //       });
          //   });
          //   const remaningMemberinsert = await BookingModal.findByIdAndUpdate(
          //     {
          //       _id: userBookingModal[0]._id,
          //     },
          //     {
          //       memberAllotted: familyMember - finalFamilyNum,
          //     }
          //   );
          //   if (!remaningMemberinsert) {
          //     res
          //       .status(500)
          //       .send(
          //         "insert Operation failed for User booking remaining member"
          //       );
          //     res.end();
          //     return;
          //   }
          //   await UserRoomMappingModel.insertMany(userRoomMapping)
          //     .then((insertRes) => {
          //       res.status(200).send("insert Operation Sucessfull");
          //     })
          //     .catch((err) => {
          //       throw err;
          //     });
          // } else {
          //   res.status(400).send("Getting room data failed");
          //   res.end();
          //   return;
          // }
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
        const roomMap = new Map();
        const bhavanMap = new Map();
        getRes.map((m) => {
          if (!finalData.get(m.userId.toString())) {
            const { roomData, bhavanData, ...restProps } = m;
            roomMap.set(roomData._id.toString(), roomData);
            bhavanMap.set(bhavanData._id.toString(), bhavanData);
            finalData.set(m.userId.toString(), {
              roomData: [roomData],
              bhavanData: [bhavanData],
              ...restProps,
            });
          } else {
            const { roomData, userBookingData, bhavanData, ...restProps } =
              finalData.get(m.userId.toString());

            if (!roomMap.get(m.roomData._id.toString())) {
              roomData.push(m.roomData);
              roomMap.set(m.roomData._id.toString(), m.roomData);
            }
            if (!bhavanMap.get(m.bhavanData._id.toString())) {
              bhavanData.push(m.bhavanData);
              bhavanMap.set(m.bhavanData._id.toString(), m.bhavanData);
            }
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
        // res.status(200).send({ resArray, data: getRes });
        res.status(200).send(resArray);
      })
      .catch((err) => {
        throw "get room booking operation failed";
      });
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
    const { currentPage, pageSize } = req.params;
    if (!currentPage || !pageSize) {
      return res.status(400).send("Page Number or Page size was not provided");
    }
    const parsedPageSize = parseInt(pageSize);

    const [totalCountData] = await BookingModal.aggregate([
      {
        $match: {
          $expr: {
            $ne: ["$familMember", "$memberAllotted"],
          },
        },
      },
      { $count: "totalDocument" },
    ]);

    const totalCount = totalCountData.totalDocument
      ? totalCountData.totalDocument
      : 0;
    const totalPages = Math.ceil(totalCount / parsedPageSize);

    const itemToSkip = (currentPage - 1) * pageSize;

    await BookingModal.aggregate([
      {
        $match: {
          $expr: {
            $ne: ["$familyMember", "$memberAllotted"],
          },
        },
      },
      { $sort: { familyMember: -1 } },
      { $skip: itemToSkip },
      { $limit: parsedPageSize },
    ])
      .then((getRes) => {
        res.status(200).send({
          data: getRes,
          totalDocument: totalCount,
          lastPage: totalPages,
          currentPage,
        });
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
      bhavanId,
      bookingFrom,
      _id: newUserId,
      bookingTill,
      fullName,
      removePosition,
      familyMember,
      mobileNumber,
      newFamilyMember,
    } = req.body;

    if (!roomId || !bookingFrom || !bookingTill || !bhavanId) {
      throw "roomId,  bookingFrom, bookingTill   is required ";
    }

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
          const newUserBooking = await BookingModal.insertMany({
            fullName,
            familyMember: parseInt(familyMember),
            bookingFrom,
            bookingTill,
            mobileNumber,
            memberAllotted: parseInt(familyMember),
            identityProof: imageName,
          });

          if (!newUserBooking) {
            return res.status(404).send("Inserting booking failed");
          }

          const actualRoom = await ActualRoom.findOne({ _id: req.body.roomId });
          if (!actualRoom) {
            return res.status(404).send("Room not found");
          }

          actualRoom.bookerIds[removePosition] = {
            id: new mongoose.Types.ObjectId(newUserBooking[0]._id),
            bookingFrom,
            bookingTill,
          };

          actualRoom.save();

          await UserRoomMappingModel.insertMany({
            roomId,
            userId: newUserBooking[0]._id,
            bhavanId,
          });

          await BookingModal.findOneAndUpdate(
            { _id: userId },
            { $inc: { memberAllotted: -1, familyMember: -1 } }
          );

          await UserRoomMappingModel.findOneAndDelete({ _id: userId });

          res.status(200).send("Room Edited Successfully");
        });
    } else {
      const actualRoom = await ActualRoom.findOne({ _id: req.body.roomId });
      if (!actualRoom) {
        return res.status(404).send("Room not found");
      }

      if (newFamilyMember && newFamilyMember > 0) {
        const UserRoomMappingModelArr = Array.from(
          { length: newFamilyMember },
          () => ({
            roomId,
            userId: newUserId,
            bhavanId,
          })
        );
        const actualRoomArr = Array.from({ length: newFamilyMember }, () => ({
          id: new mongoose.Types.ObjectId(newUserId),
          bookingFrom,
          bookingTill,
        }));
        if (
          UserRoomMappingModelArr.length === 0 &&
          actualRoomArr.length === 0
        ) {
          return res.status(400).send("Data is not provided!");
        }
        await UserRoomMappingModel.insertMany(UserRoomMappingModelArr);

        actualRoom.bookerIds.push(...actualRoomArr);
        await actualRoom.save();

        await BookingModal.findOneAndUpdate(
          { _id: newUserId },
          { $inc: { memberAllotted: parseInt(newFamilyMember) } }
        );
        res.status(200).send("Room updated sucessfully !");
      } else {
        if (!userId || !removePosition) {
          return res.status(400).send("userId or removePosition is Required !");
        }
        const updatedUserRoomMapping =
          await UserRoomMappingModel.findOneAndUpdate(
            { roomId: roomId, userId: userId },
            { $set: { userId: new mongoose.Types.ObjectId(newUserId) } },
            { new: true }
          );
        if (!updatedUserRoomMapping) {
          return res.status(404).send("Room not found");
        }
        actualRoom.bookerIds[removePosition] = {
          id: new mongoose.Types.ObjectId(newUserId),
          bookingFrom,
          bookingTill,
        };
        actualRoom.save();
        await BookingModal.findOneAndUpdate(
          { _id: newUserId },
          { $inc: { memberAllotted: 1 } }
        );
        await BookingModal.findOneAndUpdate(
          { _id: userId },
          { $inc: { memberAllotted: -1, familyMember: -1 } }
        );
        res.status(200).send(updatedUserRoomMapping);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const editRoomNewUser = async (req, res) => {
  try {
    const {
      roomId,
      bhavanId,
      bookingFrom,
      bookingTill,
      fullName,
      mobileNumber,
      userId,
      familyMember,
    } = req.body;
    if (
      fullName === "" ||
      familyMember === 0 ||
      !familyMember ||
      bookingFrom === "" ||
      bookingTill === "" ||
      mobileNumber === ""
    ) {
      res
        .status(400)
        .send(
          `Please send fullName, familyMember, bookingFrom, bookingTill, mobileNumber data`
        );
      res.end();
      return;
    }
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
          const userBookingModal = await BookingModal.insertMany({
            fullName,
            familyMember,
            bookingFrom,
            bookingTill,
            mobileNumber,
            memberAllotted: familyMember,
            identityProof: imageName,
          });
          if (!userBookingModal) {
            res
              .status(500)
              .send("insert Operation failed for User room booking");
            res.end();
            return;
          }
          for (let i = 0; i < familyMember; i++) {
            await UserRoomMappingModel.insertMany({
              roomId: roomId,
              bhavanId,
              userId: new mongoose.Types.ObjectId(userBookingModal[0]._id),
            });
          }
          const updateActualRoom = await ActualRoom.findOne({
            _id: roomId,
          }).then(async (getRes) => {
            for (let i = 0; i < familyMember; i++) {
              getRes.bookerIds.push({
                id: new mongoose.Types.ObjectId(userBookingModal[0]._id),
                bookingFrom,
                bookingTill,
              });
            }
            getRes.availabel = false;
            return getRes.save();
          });
          if (updateActualRoom) {
            res.status(200).send("Rooom Updated Sucessfully");
          }
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

const deleteBookedRoom = async (req, res) => {
  try {
    const { userId, roomId, bhavanId } = req.params;
    if (!userId || !roomId || !bhavanId) {
      throw new Error("UserId,RoomId and BhavanId is required");
    }

    const deleteUserMapping = await UserRoomMappingModel.findOneAndDelete({
      userId,
      roomId,
      bhavanId,
    });
    if (!deleteUserMapping) {
      throw new Error("User Mapping Delete operation failed");
    }

    await ActualRoom.findOne({
      _id: roomId,
    }).then((getRes) => {
      if (getRes.bookerIds.length > 0) {
        let remove = true;
        const filteredBookerId = getRes.bookerIds.filter((m) => {
          if (remove && m.id.toString() === userId) {
            remove = false;
            return false;
          } else {
            return true;
          }
        });
        getRes.bookerIds = filteredBookerId;
        return getRes.save();
      }
    });

    const updateUserBooking = await BookingModal.findOne({ _id: userId }).then(
      (getUserRes) => {
        getUserRes.familyMember = getUserRes.familyMember - 1;
        getUserRes.memberAllotted = getUserRes.memberAllotted - 1;
        return getUserRes.save();
      }
    );
    if (updateUserBooking) {
      return res.status(200).send(userId);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const bulkUpload = async (req, res) => {
  try {
    const { bulkUploadData } = req.body;
    if (!bulkUploadData || bulkUploadData.length === 0) {
      return res.status(400).send("Data is empty");
    }
    await BookingModal.insertMany(bulkUploadData);
    res.status(200).send(bulkUploadData);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
  res.end();
};

const autoAssignRoom = (req, res) => {
  try {
    const {
      _id,
      fullName,
      familyMember,
      bookingFrom,
      bookingTill,
      mobileNumber,
    } = req.body;
    if (
      _id === "" ||
      fullName === "" ||
      familyMember === 0 ||
      bookingFrom === "" ||
      bookingTill === "" ||
      mobileNumber === ""
    ) {
      return res.status(400).send("Please send the required data");
    }
    addbookingMethod(req, res, familyMember, _id, bookingFrom, bookingTill);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
  res.end();
};

module.exports = {
  addBooking,
  autoAssignRoom,
  bulkUpload,
  deleteBooking,
  deleteBookedRoom,
  editRoomNewUser,
  editRoom,
  getBookedRooms,
  getUnAlottedMember,
  updateBooking,
};

const addbookingMethod = async (
  req,
  res,
  familyMember,
  userId,
  bookingFrom,
  bookingTill
) => {
  try {
    const actualRooms = await ActualRoom.find({ availabel: true });
    let finalFamilyNum = parseInt(familyMember);
    if (finalFamilyNum === 0 || actualRooms.length === 0) {
      return res
        .status(400)
        .send("Invalid family member count or no Empty Room");
    }
    const userRoomMapping = [];
    const updatedArray = [];

    for (const m of actualRooms) {
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
              userRoomMappingObj.userId = userId;
              userRoomMapping.push(userRoomMappingObj);
            }
            finalFamilyNum = finalFamilyNum - 1;
            Obj.push({
              id: userId,
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
    }

    updatedArray.map(async (updateM) => {
      await ActualRoom.findByIdAndUpdate(updateM._id, {
        availabel: updateM.availabel,
        used: updateM.used,
        bookedFrom: updateM.bookedFrom,
        bookedTill: updateM.bookedTill,
        bookerIds: [...updateM.bookerIds],
      });
    });
    const remaningMemberinsert = await BookingModal.findByIdAndUpdate(userId, {
      memberAllotted: familyMember - finalFamilyNum,
    });
    if (!remaningMemberinsert) {
      return res
        .status(500)
        .send("insert Operation failed for User booking remaining member");
    }
    await UserRoomMappingModel.insertMany(userRoomMapping);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
  res.end();
};
