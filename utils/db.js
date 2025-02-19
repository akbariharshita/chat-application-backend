import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables");
}

try {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log("DataBase connected");
} catch (error) {
  console.log("DataBase connection failed");
}
const db = mongoose.connection;

db.on("open", () => {
  console.log("MongoDB Connected");
});

db.on("close", () => {
  console.log("MongoDB Disconnected");
});

const syncAdminModel = async () => {
  try {
    await clientModel.syncIndexes();
  } catch (e) {
    console.log(e);
  }
};

export default db;
