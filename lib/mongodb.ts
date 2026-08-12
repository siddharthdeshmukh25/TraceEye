import { Db, MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "traceeye";

declare global { var _traceEyeMongo: Promise<MongoClient> | undefined; }

async function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured. Add it to frontend/.env or frontend/.env.local.");
  if (!global._traceEyeMongo) global._traceEyeMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect();
  try { return await global._traceEyeMongo; }
  catch (error) { global._traceEyeMongo = undefined; throw error; }
}

export async function db(): Promise<Db> {
  return (await client()).db(dbName);
}
