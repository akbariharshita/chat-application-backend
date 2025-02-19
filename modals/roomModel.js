import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [
    {
      id: String,
      userName: String,
    },
  ],
});

export const Room = mongoose.model("Room", RoomSchema);
