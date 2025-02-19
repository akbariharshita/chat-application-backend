import jwt from "jsonwebtoken";

export const generateAccessToken = (email, userId) => {
  return jwt.sign(
    { userId: userId, email: email },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );
};

export const generateRefreshToken = (email, userId) => {
  return jwt.sign(
    { userId: userId, email: email },
    process.env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: "10d" }
  );
};

export const generatenewResetToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET_KEY, {
    expiresIn: "1h",
  });
};
