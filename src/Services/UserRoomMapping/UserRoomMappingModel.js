const { Types, model, Schema } = require("mongoose");
const { ObjectId } = Types;

const userRoomMapping = Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  roomId: {
    type: ObjectId,
    required: true,
  },
  bhavanId: {
    type: ObjectId,
    required: true,
  },
});

const UserRoomMappingModel = model("userRoomMapping", userRoomMapping);
module.exports = UserRoomMappingModel;
