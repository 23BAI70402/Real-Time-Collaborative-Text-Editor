import mongoose from "mongoose";
const DocumentSchema = new mongoose.Schema({
  docId: { type: String, unique: true },
  content: { type: Buffer },
});
export const MongoDocument = mongoose.model("documents", DocumentSchema);
