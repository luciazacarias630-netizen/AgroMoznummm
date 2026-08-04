import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  databaseId
);

// Validate connection gracefully
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("offline") ||
        error.message.includes("could not be completed") ||
        (error as { code?: string }).code === "unavailable"
      ) {
        console.warn("Firestore backend is currently unreachable or operating in offline mode.");
        return;
      }
    }
    console.warn("Firestore connection check warning:", error);
  }
}
testConnection();
