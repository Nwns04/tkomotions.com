export const publicJson = {
  virtuals: true,
  versionKey: false,
  transform: (_document, value) => {
    delete value._id;
    delete value.id;
    delete value.owner;
    delete value.passwordHash;
    return value;
  },
};
