import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
