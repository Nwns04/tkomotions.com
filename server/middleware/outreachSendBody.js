import express from 'express';
// This parser is mounted only on chat sends; all other JSON keeps its existing limit.
export const outreachSendBody = [express.json({ limit: '8mb' }), (error, _req, res, next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Attachments must total 5 MB or less.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'The reply could not be read. Select the files again.' });
  return next(error);
}];
