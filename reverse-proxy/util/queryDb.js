import mongoose from "mongoose";
import { redis } from "../db/connectRedis.js";
import { REDIS_EXP } from "../constants.js";
import { SubDomain } from "../subdomain.model.js";

const formatSubdomainKey = (subdomain) => `user_${subdomain}`;
const cacheSubDomain = async (subdomain, projectID, owner, Ispublic) => {
  const key = formatSubdomainKey(subdomain);
  const subdomainData = { owner, projectID, Ispublic };
  if (redis.get(key)) {
    await redis.del(key);
  }
  await redis.set(key, JSON.stringify(subdomainData), "PX", REDIS_EXP);
};
const getSubDomain = async (subdomain) => {
  const subdomainString = `user_${subdomain}`;
  try {
    const subdomainData = await redis.get(subdomainString);
    if (subdomainData) {
      const subdomainObj = await JSON.parse(subdomainData);
      return subdomainObj;
    } else {
      const subD = await SubDomain.findOne({ subDomain: subdomain });
      await cacheSubDomain(
        subD.subDomain,
        subD.projectID,
        subD.owner._id,
        subD.public
      );
      const subUpdated = { ...subD.toObject(), Ispublic: subD.public };
      return subUpdated;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { getSubDomain };
