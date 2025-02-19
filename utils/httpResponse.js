export function createMeta(
  req,
  res,
  responseStatusCode,
  responseMessage,
  data = null
) {
  const metaData = {
    statusCode: responseStatusCode,
    request: {
      ip: req.ip ?? null,
      method: req.method,
      url: req.originalUrl,
    },
    message: responseMessage,
    data: data,
  };
  return metaData;
}
