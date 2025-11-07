import * as Y from "yjs";
import { MongoDocument } from "./models/Document.js";
import { WebSocketServer } from "ws";

const docs = new Map();

export function setupWSConnection(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docId = url.pathname.replace("/", "") || "defaultDoc";

  console.log(`🧩 Client connected to document: ${docId}`);

  let ydoc = docs.get(docId);
  if (!ydoc) {
    ydoc = new Y.Doc();
    docs.set(docId, ydoc);

    // Load existing content from MongoDB
    MongoDocument.findOne({ docId }).then((found) => {
      if (found && found.content) {
        const update = new Uint8Array(found.content.buffer);
        Y.applyUpdate(ydoc, update);
        console.log("📄 Document loaded from DB");
      }
    });

    // Save on every update
    ydoc.on("update", (update) => {
      MongoDocument.findOneAndUpdate(
        { docId },
        { content: Buffer.from(Y.encodeStateAsUpdate(ydoc)) },
        { upsert: true }
      ).catch((err) => console.error("DB save error:", err));
    });
  }

  // Send existing state to the new client
  const state = Y.encodeStateAsUpdate(ydoc);
  ws.send(state);

  // Listen for updates from client
  ws.on("message", (data) => {
    const update = new Uint8Array(data);
    Y.applyUpdate(ydoc, update);
    broadcastUpdate(ws, update);
  });

  ws.on("close", () => console.log(`❌ Client left ${docId}`));
}

// Broadcast function
function broadcastUpdate(sender, update) {
  sender.server.clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(update);
    }
  });
}
