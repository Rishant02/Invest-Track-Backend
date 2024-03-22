const ErrorHandler = (err, req, res, next) => {
  const errStatus = err.statusCode || 500;
  const errMessage = err.message || "Internal Server Error";
  let errors, fields, code;

  switch (err.name) {
    case "ValidationError":
      errors = Object.values(err.errors).map((el) => el.message);
      fields = Object.values(err.errors).map((el) => el.path);
      code = 400;

      const formattedErrors = errors.join(", ");
      return res.status(code).json({
        success: false,
        message: formattedErrors,
        fields,
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });

    case "DuplicateKey":
      fields = Object.keys(err.keyValue);
      code = 409;
      return res.status(code).json({
        success: false,
        message: `An account with that ${field} already exists`,
        field,
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });

    case "CastError":
      code = 400;
      return res.status(code).json({
        success: false,
        message: `Invalid ${err.path}`,
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });

    case "VersionError":
      code = 409;
      return res.status(code).json({
        success: false,
        message: "Document has been modified. Please try again.",
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });

    case "OverwriteModelError":
      code = 500;
      return res.status(code).json({
        success: false,
        message: "Cannot overwrite model once compiled.",
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });

    default:
      return res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errMessage,
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
      });
  }
};

module.exports = ErrorHandler;
