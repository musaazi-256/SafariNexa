/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "./route";
import { auth } from "@/auth";
jest.mock("@/auth", () => ({auth:jest.fn()}));
const mockedAuth = auth as jest.Mock;
const request = (q: string) => new NextRequest(`http://localhost/api/locations?q=${encodeURIComponent(q)}`);
beforeEach(() => { mockedAuth.mockResolvedValue({user:{businessIds:["business-1"]}}); global.fetch=jest.fn(); });
test("requires a business account",async()=>{
 mockedAuth.mockResolvedValue({user:{businessIds:[]}});
 expect((await GET(request("Kampala"))).status).toBe(401);
 expect(global.fetch).not.toHaveBeenCalled();
});
test("rejects arbitrary URLs before fetching",async()=>{
 expect((await GET(request("https://127.0.0.1/private"))).status).toBe(502);
 expect(global.fetch).not.toHaveBeenCalled();
});
test("rejects a shortened map link redirecting outside map providers",async()=>{
 (global.fetch as jest.Mock).mockResolvedValue(new Response(null,{status:302,headers:{location:"http://127.0.0.1/private"}}));
 expect((await GET(request("https://maps.app.goo.gl/example"))).status).toBe(502);
 expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("keeps precise pin coordinates when reverse lookup fails",async()=>{
 (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
 const response=await GET(request("0, 32"));
 expect(response.status).toBe(200);
 expect((await response.json()).results[0]).toEqual({address:"0, 32",latitude:0,longitude:32});
});
test("search results convert GeoJSON longitude-latitude order",async()=>{
 (global.fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({features:[{geometry:{coordinates:[32.6,0.35]},properties:{name:"KFC",city:"Kampala",country:"Uganda"}}]}),{status:200}));
 const response=await GET(request("KFC Kampala"));
 expect((await response.json()).results[0]).toEqual({address:"KFC, Kampala, Uganda",city:"Kampala",latitude:0.35,longitude:32.6});
});
