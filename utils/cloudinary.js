import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "products",
    });

    console.log("file is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export const uploadImage = async (fileName, fileBuffer) => {
  try {
    if (!fileBuffer) {
      console.error("No file buffer provided");
      return null;
    }

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "chats",
          public_id: fileName,
        },
        (error, result) => {
          if (error) {
            console.error("Error uploading to Cloudinary:", error);
            reject(error);
          } else if (!result || !result.url) {
            console.error("No URL in the Cloudinary response");
            reject("No URL in Cloudinary response");
          } else {
            console.log(
              "File uploaded successfully to Cloudinary:",
              result.url
            );
            resolve(result);
          }
        }
      );

      bufferStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error in uploadImage:", error);
    return null;
  }
};
