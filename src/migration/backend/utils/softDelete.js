const softDeletePlugin = (schema) => {
  schema.add({
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: String, default: null },
  });

  const shouldIncludeDeleted = (query) => query.getOptions()?.withDeleted === true;

  const excludeDeleted = function (next) {
    if (shouldIncludeDeleted(this)) return next();

    const filter = this.getFilter();
    if (filter.is_deleted === undefined) {
      this.where({ is_deleted: { $ne: true } });
    }
    next();
  };

  schema.pre(/^find/, excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);
  schema.pre('updateOne', excludeDeleted);
  schema.pre('updateMany', excludeDeleted);

  schema.methods.softDelete = function (deletedBy) {
    this.is_deleted = true;
    this.deleted_at = new Date();
    this.deleted_by = deletedBy || null;
    return this.save();
  };

  schema.methods.restore = function () {
    this.is_deleted = false;
    this.deleted_at = null;
    this.deleted_by = null;
    return this.save();
  };

  schema.statics.softDeleteById = function (id, deletedBy) {
    return this.findOneAndUpdate(
      { _id: id, is_deleted: { $ne: true } },
      { is_deleted: true, deleted_at: new Date(), deleted_by: deletedBy || null },
      { new: true }
    ).setOptions({ withDeleted: true });
  };

  schema.statics.restoreById = function (id) {
    return this.findOneAndUpdate(
      { _id: id, is_deleted: true },
      { is_deleted: false, deleted_at: null, deleted_by: null },
      { new: true }
    ).setOptions({ withDeleted: true });
  };
};

module.exports = softDeletePlugin;
