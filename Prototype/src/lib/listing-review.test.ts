import { listingSnapshot, snapshotDigest, submissionErrors } from "./listing-review";

const complete = {title:"Test lodge", description:"A complete description of this locally operated lodge.", city:"Jinja",address:"Main road",coverImageUrl:"/api/images/test.jpg",basePriceMinor:100000,type:"ACCOMMODATION",accommodation:{roomTypes:[{name:"Double"}]}};
test("submission requires location, description, cover, price and accommodation rooms", () => {
  expect(submissionErrors(complete)).toEqual([]);
  expect(submissionErrors({...complete,city:null,address:null,description:"Short",coverImageUrl:null,basePriceMinor:0,accommodation:{roomTypes:[]}})).toHaveLength(5);
});
test("snapshots retain room images, gallery and category data but exclude publication state", () => {
  const snapshot=listingSnapshot({...complete,status:"DRAFT",publishedAt:null,createdAt:new Date(),updatedAt:new Date(),images:["gallery.jpg"],accommodation:{roomTypes:[{images:["room.jpg"]}]}});
  expect(snapshot).not.toHaveProperty("status");
  expect(snapshot).not.toHaveProperty("updatedAt");
  expect(snapshot.images).toEqual(["gallery.jpg"]);
  expect(snapshot.accommodation).toEqual({roomTypes:[{images:["room.jpg"]}]});
});
test("content fingerprints are key-order independent and detect replaced photos", () => {
  expect(snapshotDigest({a:1,b:2})).toEqual(snapshotDigest({b:2,a:1}));
  expect(snapshotDigest({images:["approved.jpg"]})).not.toEqual(snapshotDigest({images:["changed.jpg"]}));
});
