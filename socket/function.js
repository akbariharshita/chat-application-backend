/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import prisma from "../client/prisma";
import config from "../config/config";
import logger from "../util/logger";

// import type { DeleteObjectCommandInput } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3 = new S3Client({
  region: config.AWS_S3.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_S3.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: config.AWS_S3.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

// Function to get an image from S3
// const getImageFromS3 = async (bucketName, fileName) => {
//     const params = {
//         Bucket: bucketName,
//         Key: fileName
//     }

//     try {
//         const data = await s3.getObject(params).promise()
//         console.log('Image fetched successfully:', data.Body) // This is the image data (Buffer)
//         // You can save the image or return it as a response
//     } catch (error) {
//         console.error('Error fetching image:', error)
//     }
// }

export const getSignedImageUrl = async (key) => {
  if (!key) {
    throw new Error("Key is required");
  }

  const command = new GetObjectCommand({
    Bucket: config.AWS_S3.BUCKET_NAME,
    Key: key,
  });

  // expires in seconds
  return getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 });
};

export const removeFileFromS3 = async (key) => {
  try {
    if (!key) {
      throw new Error("Key is required");
    }

    const params = {
      Bucket: config.AWS_S3.BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    const response = await s3.send(command);
    return response.VersionId;
  } catch (e) {
    logger.info("AWS Delete Error", e);
  }
};

// get Blog Data
export const getBlogProperty = async (id) => {
  try {
    const userDetails = await prisma.blog.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        published_date: true,
        status: true,
        description: true,
        views: true,
        content: true,
        draft_slug: true,
        draft_title: true,
        draft_content: true,
        date: true,
        draft_date: true,
        cover_image_key: true,
        cover_image_url: true,
        draft_cover_image_key: true,
        draft_cover_image_url: true,
        draft_changed: true,
      },
    });

    return userDetails;
  } catch (error) {
    logger.error("Error in blogProperty:", {
      meta: {
        error,
      },
    });
  }
};

// get Blog Data
export const getBlogContent = async (id) => {
  try {
    const userDetails = await prisma.blog.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        draft_content: true,
      },
    });

    return userDetails;
  } catch (error) {
    logger.error("Error in blogContent:", {
      meta: {
        error,
      },
    });
  }
};

// Update published date update
export const publishedDateUpdate = async (data) => {
  try {
    // Fetch the blog by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
        published_date: true,
        created_at: true,
        updated_at: true,
      },
    });

    const blogDraftDate = blogDetails?.published_date
      ? new Date(blogDetails.published_date)
      : null;
    const dataDraftDate = data.published_date
      ? new Date(data.published_date)
      : null;

    let status = true;
    if (
      blogDetails &&
      dataDraftDate &&
      blogDraftDate?.getTime() !== dataDraftDate?.getTime()
    ) {
      status = false;
    } else {
      status = true;
    }

    if (blogDetails && !status) {
      // Blog exists, update it
      try {
        await prisma.blog.update({
          where: {
            id: data?.userId,
          },
          data: {
            published_date: data?.published_date,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        logger.info("Blog updated successfully.");
      } catch (error) {
        logger.error("Error in draftTitleUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftTitleUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Title
export const draftTitleUpdate = async (data) => {
  try {
    // Fetch the blog by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data.draftDetails.id,
      },
      select: {
        id: true,
        title: true,
        draft_title: true,
        created_at: true,
        updated_at: true,
      },
    });

    // If the blog does not exist, create it
    if (blogDetails && blogDetails?.draft_title !== data?.draft_title) {
      // Blog exists, update it
      try {
        await prisma.blog.update({
          where: {
            id: data?.draftDetails.id,
          },
          data: {
            draft_title: data?.draft_title,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        logger.info("Blog updated successfully.");
      } catch (error) {
        logger.error("Error in draftTitleUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftTitleUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Slue
export const draftSlugUpdate = async (data) => {
  try {
    // Fetch the blog by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data.draftDetails.id,
      },
      select: {
        id: true,
        slug: true,
        draft_slug: true,
        created_at: true,
        updated_at: true,
      },
    });

    let status = true;
    if (data?.draft_slug && blogDetails?.draft_slug !== data?.draft_slug) {
      status = false;
    } else {
      status = true;
    }

    // If the blog does not exist, create it
    if (blogDetails && !status) {
      try {
        await prisma.blog.update({
          where: {
            id: data?.draftDetails.id,
          },
          data: {
            draft_slug: data?.draft_slug,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        logger.info("Blog updated successfully.");
      } catch (error) {
        logger.error("Error in draftSlugUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftSlugUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Cover Image
const getDraftImage = async (dirName) => {
  try {
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: dirName,
      },
      select: {
        id: true,
        cover_image_key: true,
        cover_image_url: true,
        draft_cover_image_key: true,
        draft_cover_image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Return the cover_image_key if it exists, otherwise undefined
    return blogDetails?.cover_image_key ?? undefined;
  } catch (error) {
    logger.error("Error in getDraftImage:", {
      meta: {
        dirName,
        error,
      },
    });
    return undefined; // Explicitly return undefined in case of error
  }
};

// Update Cover Image
const draftImageUpdate = async (dirName, imageUrl, coverImageKey) => {
  try {
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: dirName,
      },
      select: {
        id: true,
        cover_image_key: true,
        cover_image_url: true,
        draft_cover_image_key: true,
        draft_cover_image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    const DatabaseKey = JSON.stringify(blogDetails?.draft_cover_image_key);
    const orderDataHash1 = crypto
      .createHash("sha256")
      .update(DatabaseKey)
      .digest("hex");
    const IncomingKey = JSON.stringify(coverImageKey);
    const orderDataHash2 = crypto
      .createHash("sha256")
      .update(IncomingKey)
      .digest("hex");

    let status = true;
    if (orderDataHash1 !== orderDataHash2) {
      status = false;
    } else {
      status = true;
    }

    // If the blog does not exist, create it
    if (blogDetails && !status) {
      try {
        await prisma.blog.update({
          where: {
            id: dirName,
          },
          data: {
            draft_cover_image_key: coverImageKey,
            draft_cover_image_url: imageUrl,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        logger.info("Blog updated successfully.3");
      } catch (error) {
        logger.error("Error in draftImageUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftImageUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Cover Image
const removeDraftImage = async (dirName, remove) => {
  try {
    if (remove === true) {
      try {
        await prisma.blog.update({
          where: {
            id: dirName,
          },
          data: {
            draft_cover_image_key: null,
            draft_cover_image_url: null,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        return true;
      } catch (error) {
        logger.error("Error in draftImageUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftImageUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Date
export const draftDateUpdate = async (data) => {
  try {
    // Fetch the blog by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data?.draftDetails.id,
      },
      select: {
        id: true,
        date: true,
        draft_date: true,
        created_at: true,
        updated_at: true,
      },
    });
    const blogDraftDate = blogDetails?.draft_date
      ? new Date(blogDetails.draft_date)
      : null;
    const dataDraftDate = data.draft_date ? new Date(data.draft_date) : null;

    let status = true;
    if (
      blogDetails &&
      blogDraftDate &&
      dataDraftDate &&
      blogDraftDate?.getTime() !== dataDraftDate?.getTime()
    ) {
      status = false;
    } else {
      status = true;
    }

    // If the blog does not exist, create it
    if (blogDetails && !status) {
      try {
        await prisma.blog.update({
          where: {
            id: data?.draftDetails.id,
          },
          data: {
            draft_date: data?.draft_date,
            updated_at: new Date(),
            draft_changed: true,
          },
        });
        logger.info("Blog updated successfully.");
      } catch (error) {
        logger.error("Error in draftDateUpdate:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in draftDateUpdate:", {
      meta: {
        error,
      },
    });
  }
};

// Update Content
export const draftContentUpdate = async (data) => {
  const sortObjectKeys = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys); // If array, apply sorting to each element
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.keys(obj)
        .sort() // Sort the keys
        .reduce((acc, key) => {
          acc[key] = sortObjectKeys(obj[key]); // Recursively sort the nested objects
          return acc;
        }, {});
    }
    return obj; // Return the value if it's neither array nor object
  };
  try {
    // Fetch the blog by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data?.draftDetails?.id,
      },
      select: {
        id: true,
        content: true,
        draft_content: true,
        draft_changed: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Convert and normalize arrays by sorting object keys
    const sortedArray1 = sortObjectKeys(blogDetails?.draft_content);
    const sortedArray2 = sortObjectKeys(data?.editorContent);

    // Convert the sorted arrays to JSON strings
    const arrayString1 = JSON.stringify(sortedArray1);
    const arrayString2 = JSON.stringify(sortedArray2);

    // Hash the stringified arrays
    const hash1 = crypto
      .createHash("sha256")
      .update(arrayString1)
      .digest("hex");
    const hash2 = crypto
      .createHash("sha256")
      .update(arrayString2)
      .digest("hex");

    let status = true;
    // Compare the hashes
    if (hash1 !== hash2) {
      status = false;
    } else {
      status = true;
    }

    // If the blog does not exist, create it
    if (blogDetails && !status) {
      await prisma.blog.update({
        where: {
          id: data?.draftDetails?.id,
        },
        data: {
          draft_content: data?.editorContent,
          updated_at: new Date(),
          draft_changed: true,
        },
      });
      logger.info("Blog updated successfully.");
      return true;
    }
  } catch (error) {
    logger.error("ERROR IN DRAFTCONTENT UPDATE", {
      meta: {
        error,
      },
    });
  }
};

// Update Date
export const Published = async (data) => {
  try {
    // Fetch blog details by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id: data?.blogId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        published_date: true,
        status: true,
        description: true,
        content: true,
        views: true,
        draft_content: true,
        draft_slug: true,
        draft_title: true,
        date: true,
        draft_date: true,
        cover_image_key: true,
        cover_image_url: true,
        draft_cover_image_key: true,
        draft_cover_image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    const jsonContent = JSON.stringify(blogDetails?.draft_content, null, 2);

    if (blogDetails) {
      try {
        await prisma.blog.update({
          where: {
            id: blogDetails.id,
          },
          data: {
            title: blogDetails.draft_title,
            slug: blogDetails.draft_slug,
            cover_image_key: blogDetails.draft_cover_image_key,
            cover_image_url: blogDetails.draft_cover_image_url,
            date: blogDetails.draft_date,
            content: jsonContent,
            published_date: data?.published_date
              ? new Date(data.published_date)
              : null,
            status: "PUBLISHED",
            updated_at: new Date(),
            draft_changed: false,
          },
        });
        logger.info("Blog Published successfully.");
      } catch (error) {
        logger.error("Error in Published:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in Published:", {
      meta: {
        error,
      },
    });
  }
};

// Update Date
export const autoPublished = async (id) => {
  try {
    // Fetch blog details by ID
    const blogDetails = await prisma.blog.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        published_date: true,
        status: true,
        description: true,
        content: true,
        views: true,
        draft_content: true,
        draft_slug: true,
        draft_title: true,
        date: true,
        draft_date: true,
        cover_image_key: true,
        cover_image_url: true,
        draft_cover_image_key: true,
        draft_cover_image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    const jsonContent = JSON.stringify(blogDetails?.draft_content, null, 2);

    if (blogDetails) {
      // Blog exists, update it
      try {
        await prisma.blog.update({
          where: {
            id: blogDetails.id,
          },
          data: {
            title: blogDetails.draft_title,
            slug: blogDetails.draft_slug,
            cover_image_key: blogDetails.draft_cover_image_key,
            cover_image_url: blogDetails.draft_cover_image_url,
            date: blogDetails.draft_date,
            content: jsonContent,
            status: "PUBLISHED",
            updated_at: new Date(),
            draft_changed: false,
          },
        });
        logger.info("Blog Published successfully.");
      } catch (error) {
        logger.error("Error in Published:", {
          meta: {
            error,
          },
        });
      }
    }
  } catch (error) {
    logger.error("Error in Published:", {
      meta: {
        error,
      },
    });
  }
};

// Update Cover Image
export const coverImageUpdateS3 = async (data) => {
  try {
    // const imageBuffer = await getImageFromS3('example-image.png', 'uploads')

    // if (!imageBuffer) {
    const buffer = data?.binaryData;
    const bucketName = config.AWS_S3.BUCKET_NAME;

    if (!bucketName) {
      throw new Error("S3 bucket name is not defined in the configuration");
    }
    const coverImageKey = `${data?.dirName}/${Date.now()}${data?.imageName}`;
    const params = {
      Bucket: bucketName,
      Key: coverImageKey,
      Body: buffer,
      ContentType: data?.fileType,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = await getSignedImageUrl(coverImageKey);

    const oldImageKey = await getDraftImage(data?.dirName);

    if (oldImageKey !== undefined) {
      await removeFileFromS3(oldImageKey);
    }
    await draftImageUpdate(data?.dirName, imageUrl, coverImageKey);

    // } else {
    // }
  } catch (error) {
    logger.error("Error in coverImageUpdateS3:", {
      meta: {
        error,
      },
    });
  }
};

export const removeCoverImageFromS3 = async (data) => {
  try {
    const remove = data.remove ? data.remove : false;
    const oldImageKey = await getDraftImage(data?.dirName);
    if (oldImageKey !== undefined) {
      await removeFileFromS3(oldImageKey);
    }
    const removeFromDb = await removeDraftImage(data?.dirName, remove);
    return removeFromDb;
  } catch (error) {
    logger.error("Error in coverImageUpdateS4", {
      meta: {
        error,
      },
    });
  }
};
