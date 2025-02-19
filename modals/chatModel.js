import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  roomName: String,
  messages: [
    {
      user: { type: String, required: true },
      message: { type: String, required: true, default: "" },
      file: { type: String, default: null },
      isDeleted: { type: Boolean, default: false },

      timestamp: { type: Date, default: Date.now },
    },
  ],
  timestamp: { type: Date, default: Date.now },
});

export const ChatMessage = mongoose.model("ChatMessage", chatSchema);

export const addMessageToRoom = async (roomName, user, message, file) => {
  const messageContent = message || "";
  const fileUrl = file || "";

  try {
    const result = await ChatMessage.findOneAndUpdate(
      { roomName },
      {
        $push: {
          messages: {
            user,
            message: messageContent,
            file: fileUrl,
          },
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
  } catch (error) {
    console.error("Error adding message to room:", error.message);
    // Log the full error to inspect further
    console.error(error);
  }
};
