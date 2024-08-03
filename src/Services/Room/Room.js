const mongoose = require("mongoose");

const { APIError, STATUS_CODES } = require("../../util/app-errors");
const RoomModal = require("../Room/RoomModal");
const ActualRoomsModal = require("../Rooms/RoomsModal");
const UserBooking = require("../Booking/UserBookingModal");

const addRoom = async (req, res) => {
  try {
    const { bhavanName, noOfBedperRoom, landmark, noOfRooms } = req.body;
    const { rooms, ...restProps } = req.body;
    if (
      bhavanName === "" &&
      noOfBedperRoom === 0 &&
      landmark === "" &&
      noOfRooms === 0
    ) {
      throw "all the data is required";
    } else {
      const roomData = await RoomModal.insertMany(restProps);
      if (!roomData) {
        throw "insert operation failed";
      }
      const roomsWithBhavanId = rooms.map((m) => ({
        bhavanId: roomData[0]._id,
        ...m,
      }));
      const actualRoomModalData = await ActualRoomsModal.insertMany(
        roomsWithBhavanId
      );
      if (!actualRoomModalData) {
        throw "insert operation failed";
      }
      res.status(200).send(actualRoomModalData);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  res.end();
};

const getRoom = async (req, res) => {
  try {
    await RoomModal.aggregate([
      {
        $lookup: {
          from: "actualrooms",
          localField: "_id",
          foreignField: "bhavanId",
          as: "rooms",
        },
      },
    ])
      .then((getRoomRes) => {
        res.status(200).send(getRoomRes);
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  res.end();
};

const getRoomCount = async (req, res) => {
  try {
    const roomData = {
      totalNoRoom: 0,
      allotedRoom: 0,
      emptyRoom: 0,
    };
    const allRoom = await RoomModal.aggregate([
      {
        $lookup: {
          from: "actualrooms",
          localField: "_id",
          foreignField: "bhavanId",
          as: "rooms",
        },
      },
    ]);
    if (!allRoom) {
      throw "fetching room operation failed";
    }
    allRoom.map((m) => {
      roomData.totalNoRoom = roomData.totalNoRoom + m.rooms.length;
      m.rooms.map((rm) => {
        console.log(rm);
        if (rm.bookerIds.length === rm.noOfBed) {
          roomData.allotedRoom = roomData.allotedRoom + 1;
        }
        if (rm.noOfBed > rm.bookerIds.length) {
          roomData.emptyRoom = roomData.emptyRoom + 1;
        }
      });
    });
    res.status(200).send(roomData);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  res.end();
};

const updateRoom = async (req, res) => {
  try {
    if (!req.body._id) {
      throw "Id is required for updating";
    }
    const { rooms, _id, ...restProps } = req.body;
    const updateDoc = await RoomModal.findByIdAndUpdate(
      { _id: _id },
      { ...restProps }
    );
    if (!updateDoc) {
      throw "Update operation failed";
    }
    rooms.map(async (m) => {
      const updateNumber = await ActualRoomsModal.findByIdAndUpdate(
        { _id: m._id },
        { ...m }
      );
      if (!updateNumber) {
        throw "Update operation failed";
        return;
      }
    });
    res.status(201).send(updateDoc);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  res.end();
};

const deleteRoom = async (req, res) => {
  try {
    if (!req.params.deleteId) {
      throw "Id is required for updating";
    }
    await RoomModal.findOneAndDelete({
      _id: req.params.deleteId,
    })
      .then(async (deleteRes) => {
        await ActualRoomsModal.deleteMany({
          bhavanId: req.params.deleteId,
        })
          .then((deleteActualRoomRes) => {
            res.status(200).send(req.params.deleteId);
          })
          .catch((error) => {
            throw error;
          });
      })
      .catch((error) => {
        throw "Delete operation failed";
      });
  } catch (error) {
    res.status(500).send(error);
  }
  res.end();
};

const viewSingleRoom = async (req, res, next) => {
  try {
    const bookerData = [];
    const { roomId } = req.params;
    console.log(
      roomId,
      " <>????????????????????????????????????????????????????????"
    );
    const roomData = await ActualRoomsModal.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(roomId),
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
    ]);

    if (roomData[0].bookerIds.length > 0) {
      roomData[0].bookerIds.map(async (m) => {
        await UserBooking.findById({ _id: m.id })
          .then((findByIdRes) => {
            bookerData.push(findByIdRes);
            if (roomData[0].bookerIds.length === bookerData.length) {
              roomData[0].userBooking = bookerData;
              res.status(200).send({ roomData });
            }
          })
          .catch((err) => {
            throw err;
          });
      });
    } else {
      res.status(200).send({ roomData });
    }
  } catch (error) {
    console.log(error, " MAIN");
    res.status(500).send(error);
  }
};

module.exports = {
  addRoom,
  getRoom,
  getRoomCount,
  updateRoom,
  deleteRoom,
  viewSingleRoom,
};
