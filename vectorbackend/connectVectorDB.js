import { QdrantClient } from "@qdrant/js-client-rest";
let quad;
const connectVectorDB = async () => {
  try {
    quad = new QdrantClient({
      url: process.env.QDRANT_URI,
      apiKey: process.env.QDRANT_API_KEY,
    });
    console.log("vector db connected!!!!!");
  } catch (error) {
    console.log(error);
    console.error("vector db connection failed");
    process.exit(0);
  }
};
export const VECTOR_SIZE = 1024;
export const COLLECTION_NAME = "vector-search";
const initializeCollection = async () => {
  try {
    const collections = await quad.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      await quad.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        hnsw_config: {
          payload_m: 16,
          m: 0,
        },
      });
      console.log(`Collection ${COLLECTION_NAME} created successfully`);
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }
  } catch (error) {
    console.error("Error initializing collection:", error);
    throw error;
  }
};

export { connectVectorDB, quad, initializeCollection };
