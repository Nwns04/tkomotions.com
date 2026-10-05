/**
 * Shared serialisation rules for every Sales Engine document.
 *
 * `businessId` is deliberately stripped from JSON output. The tenant identifier
 * is resolved server-side on every request and must never be echoed to a client,
 * because an echoed tenant id invites clients to replay it on another request.
 *
 * These objects are intentionally left un-annotated. Annotating them as
 * `SchemaOptions` pins the generic parameters to `unknown`, which then fails to
 * be assignable to the per-model `SchemaOptions<FlatRecord<T>>` that
 * `new Schema<T>()` expects. Letting TypeScript infer the literal type keeps
 * them structurally compatible with every model.
 */
export const publicJson = {
  virtuals: true,
  versionKey: false,
  transform: (_document: unknown, value: Record<string, unknown>) => {
    value.id = String(value._id);
    delete value._id;
    delete value.businessId;
    delete value.passwordHash;
    delete value.embedding;
    return value;
  },
};

export const baseSchemaOptions = {
  timestamps: true,
  toJSON: publicJson,
};
