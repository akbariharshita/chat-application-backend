import express from "express";
import "./utils/db.js";
import cors from "cors";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import "./schedular.js";
import { logger } from "./logger.js";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { addMessageToRoom, ChatMessage } from "./modals/chatModel.js";
import { uploadImage } from "./utils/cloudinary.js";
import { Readable } from "stream";
import { Room } from "./modals/roomModel.js";

dotenv.config();

const app = express();
const port = 4000;

const server = http.createServer(app);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).send("Internal Server Error");
});

const rooms = {};

const loadRoomsIntoMemory = async () => {
  const allRooms = await Room.find();
  allRooms.forEach((room) => {
    rooms[room.name] = room.users;
  });
};

loadRoomsIntoMemory();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("createOrJoinRoom", async ({ roomName, userName }, callback) => {
    try {
      let room = await Room.findOne({ name: roomName });

      if (!room) {
        room = new Room({
          name: roomName,
          users: [{ id: socket.id, userName }],
        });
        await room.save();
      } else {
        room.users = room.users.filter((user) => user.userName !== userName);
        room.users.push({ id: socket.id, userName });

        await Room.findOneAndUpdate({ name: roomName }, { users: room.users });
      }

      socket.join(roomName);

      const chatRoom = await ChatMessage.findOne({ roomName });

      io.to(roomName).emit("roomMessage", {
        message: `${userName} has joined the room.`,
        users: room.users,
        chatMessage: chatRoom?.messages || [],
      });

      callback({ status: "success", messages: chatRoom?.messages || [] });
    } catch (error) {
      console.error("Error creating/joining room:", error);
      callback({ status: "error", message: "Failed to join room." });
    }
  });

  socket.on(
    "sendMessageToRoom",
    async ({ roomName, userName, message, file }) => {
      let fileUrl = "";
      console.log({ file });

      if (file) {
        const { fileName, fileBuffer, fileType } = file;

        const binaryBuffer = Buffer.from(fileBuffer);

        const bufferStream = new Readable();
        bufferStream.push(binaryBuffer);
        bufferStream.push(null);

        const result = await uploadImage(fileName, binaryBuffer);
        if (result && result.url) {
          fileUrl = result.url;
          console.log("File uploaded to Cloudinary:", fileUrl);
        } else {
          console.log("File upload failed or no URL returned");
        }
      }

      await addMessageToRoom(roomName, userName, message || "", fileUrl || "");

      const room = await Room.findOne({ name: roomName });

      if (!room) {
        console.error("Room not found.");
        return;
      }

      const chatRoom = await ChatMessage.findOne({ roomName });

      if (chatRoom && chatRoom.messages.length > 0) {
        const lastMessage = chatRoom.messages.slice(-1)[0];
        const activeUsers = [...(io.sockets.adapter.rooms.get(roomName) || [])];

        if (activeUsers.length > 0) {
          io.to(roomName).emit("newMessage", {
            users: room.users,
            chatMessage: lastMessage,
          });
          console.log(`✅ Sent newMessage event to ${roomName}`);
        } else {
          console.log(`⚠️ No active users in ${roomName}`);
        }
      }
    }
  );

  socket.on("deleteMessage", async ({ roomName, messageId }) => {
    try {
      const chatRoom = await ChatMessage.findOne({ roomName });
      if (chatRoom) {
        const messageIndex = chatRoom.messages.findIndex(
          (msg) => msg._id.toString() === messageId
        );

        if (messageIndex !== -1) {
          chatRoom.messages[messageIndex].isDeleted = true;
          await chatRoom.save();
          io.to(roomName).emit("messageDeleted", {
            MessageId: chatRoom.messages[messageIndex]._id,
          });
        } else {
          console.log("Message not found.");
        }
      } else {
        console.log("Room not found.");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      console.log("Failed to delete message.");
    }
  });

  socket.on("leaveRoom", async ({ roomName }, callback) => {
    const room = await Room.findOne({ name: roomName });

    if (room) {
      room.users = room.users.filter((user) => user.id !== socket.id);
      await room.save();

      if (room.users.length === 0) {
        await Room.deleteOne({ name: roomName });
      } else {
        io.to(roomName).emit("roomMessage", {
          message: `${socket.id} has left the room.`,
          users: room.users,
        });
      }

      callback({ status: "success", message: "You have left the room." });
    } else {
      callback({ status: "error", message: "Room does not exist." });
    }
  });

  socket.on("disconnect", async () => {
    try {
      for (const roomName in rooms) {
        const room = await Room.findOne({ name: roomName });
        if (room) {
          room.users = room.users.filter((user) => user.id !== socket.id);
          if (room.users.length === 0) {
            await Room.deleteOne({ name: roomName });
          } else {
            await room.save();
            io.to(roomName).emit("roomMessage", {
              message: `${socket.id} has disconnected.`,
              users: room.users,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

server.listen(port, () => {
  logger.info(`app listening on port ${port}`);
});
