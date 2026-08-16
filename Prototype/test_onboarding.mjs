import { FormData } from 'node-fetch'; // or global FormData

const form = new FormData();
form.append("businessName", "Test Biz");
form.append("contactEmail", "test@example.com");
form.append("contactPhone", "123456");
form.append("city", "Kampala");
form.append("doc_incorporation", new Blob(["test"]), "test.pdf");

console.log("Form created");
