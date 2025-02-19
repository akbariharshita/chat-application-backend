import {
  Published,
  autoPublished,
  coverImageUpdateS3,
  draftContentUpdate,
  draftDateUpdate,
  draftSlugUpdate,
  draftTitleUpdate,
  getBlogProperty,
  publishedDateUpdate,
  removeCoverImageFromS3,
} from "./blogPageHandlers";
import logger from "../util/logger";

export const blogPageSocketEvents = (io) => {
  io.on("connection", (socket) => {
    logger.info("User connected successfully");
    logger.info(socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);

      const room = io.sockets.adapter.rooms.get(roomId);
      const totalUsers = room ? room.size : 0;
      const userIDs = room ? Array.from(room) : [];

      socket
        .to(roomId)
        .emit("message", `A new user has joined the room: ${roomId}`);
      io.in(roomId).emit("roomUsers", { totalUsers, userIDs });
    });

    socket.on("userId", async (id) => {
      const initialDetails = await getBlogProperty(id);
      socket.emit("initialProperty", initialDetails);
    });

    socket.on("draftContentUpdate", async (data) => {
      const updateStatus = await draftContentUpdate(data);
      if (updateStatus === true) {
        const initialDetails = await getBlogProperty(data?.draftDetails?.id);
        io.to(data?.roomId).emit("initialProperty", initialDetails);
      }
    });

    socket.on("publishDate", async (data) => {
      await publishedDateUpdate(data);
      const initialDetails = await getBlogProperty(data?.userId);
      io.to(data.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("draftTitle", async (data) => {
      await draftTitleUpdate(data);
      const initialDetails = await getBlogProperty(data.draftDetails.id);
      io.to(data.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("draftSlug", async (data) => {
      await draftSlugUpdate(data);
      const initialDetails = await getBlogProperty(data.draftDetails.id);
      io.to(data.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("draftDate", async (data) => {
      await draftDateUpdate(data);
      const initialDetails = await getBlogProperty(data.draftDetails.id);
      io.to(data.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("Published", async (data) => {
      await Published(data);
      const initialDetails = await getBlogProperty(data?.blogId);
      io.to(data?.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("shedulePublish", async (id) => {
      const currantTime = new Date();
      const initialDetails = await getBlogProperty(id);

      if (initialDetails?.published_date && currantTime) {
        const currentTime = new Date(currantTime);
        const publishTime = new Date(initialDetails?.published_date);

        if (publishTime.getTime() <= currentTime.getTime()) {
          await autoPublished(id);
          const initialPublish = await getBlogProperty(id);
          io.to(id).emit("initialProperty", initialPublish);
        }
      }
    });

    socket.on("coverImages", async (data) => {
      await coverImageUpdateS3(data);
      const initialDetails = await getBlogProperty(data?.roomId);
      io.to(data?.roomId).emit("initialProperty", initialDetails);
    });

    socket.on("removeCoverImages", async (data) => {
      const remove = await removeCoverImageFromS3(data);
      if (remove === true) {
        const initialDetails = await getBlogProperty(data?.roomId);
        io.to(data?.roomId).emit("initialProperty", initialDetails);
      }
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);

      const room = io.sockets.adapter.rooms.get(roomId);
      const totalUsers = room ? room.size : 0;
      const userIDs = room ? Array.from(room) : [];

      socket.to(roomId).emit("message", `A user has left the room: ${roomId}`);
      io.in(roomId).emit("roomUsers", { totalUsers, userIDs });
    });

    socket.on("disconnect", () => {
      logger.info("User disconnected");
    });
  });
};
