/**
 * Checkout field rules shared by the checkout form and the /api/checkout route,
 * so the browser and the server always agree. No dependencies, safe to import anywhere.
 */

export const PROVINCES=[
  "Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo",
  "Mpumalanga","North West","Northern Cape","Western Cape"
] as const;

export type CheckoutFormValues={
  name:string;
  phone:string;
  email:string;
  address:string;
  city:string;
  province:string;
  zip:string;
};

export type CheckoutFormErrors=Partial<Record<keyof CheckoutFormValues,string>>;

export type CleanCheckoutForm={
  name:string;
  phone:string;
  email?:string;
  address:string;
  city:string;
  province?:string;
  zip:string;
};

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Removes spaces, dashes, dots and brackets, so "082 555-1234" becomes "0825551234". */
export function normalizePhone(value:string):string{
  return value.trim().replace(/[\s().-]/g,"");
}

export function validateCheckoutForm(input:Partial<CheckoutFormValues>):{ok:true;value:CleanCheckoutForm}|{ok:false;errors:CheckoutFormErrors}{
  const errors:CheckoutFormErrors={};
  const name=String(input.name??"").trim().replace(/\s+/g," ");
  const phone=normalizePhone(String(input.phone??""));
  const email=String(input.email??"").trim();
  const address=String(input.address??"").trim();
  const city=String(input.city??"").trim();
  const province=String(input.province??"").trim();
  const zip=String(input.zip??"").trim();

  if(name.length<2) errors.name="Enter your full name.";
  else if(name.length>100) errors.name="Name is too long.";

  if(!/^\+?\d{9,15}$/.test(phone)) errors.phone="Enter a valid phone number, for example 082 555 1234.";

  if(email&&(email.length>254||!EMAIL.test(email))) errors.email="Enter a valid email address, or leave it blank.";

  if(address.length<5) errors.address="Enter your street address.";
  else if(address.length>200) errors.address="Address is too long.";

  if(city.length<2) errors.city="Enter your city or town.";
  else if(city.length>80) errors.city="City is too long.";

  if(province&&!(PROVINCES as readonly string[]).includes(province)) errors.province="Choose a province from the list.";

  if(!/^\d{4}$/.test(zip)) errors.zip="Enter your 4-digit postal code.";

  if(Object.keys(errors).length>0) return {ok:false,errors};
  return {ok:true,value:{name,phone,email:email||undefined,address,city,province:province||undefined,zip}};
}
