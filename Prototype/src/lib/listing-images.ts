import path from "path";
export const LISTING_IMAGE_DIRECTORY = process.env.PUBLIC_IMAGE_DIRECTORY || path.join(process.cwd(), ".private", "listing-images");
