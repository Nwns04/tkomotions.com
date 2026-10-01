export function notFound(_req, res) {
  res.status(404).json({ message: 'The requested resource was not found.' });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'A record with that identifier already exists.' });
  }

  if (error?.name === 'ValidationError') {
    return res.status(422).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
  }

  console.error(error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'Something went wrong. Please try again.',
  });
}
