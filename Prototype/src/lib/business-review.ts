export function businessReviewSnapshot(business: {name: string; registrationNumber: string | null; address: string | null; city: string | null; country: string; description: string | null; contactName: string | null; contactRole: string | null; contactEmail: string | null; contactPhone: string | null}) {
  const {name, registrationNumber, address, city, country, description, contactName, contactRole, contactEmail, contactPhone} = business;
  return {name, registrationNumber, address, city, country, description, contactName, contactRole, contactEmail, contactPhone};
}
