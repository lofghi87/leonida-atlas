export type Category = { id:string; name:string; slug:string; icon:string; color:string };
export type Discovery = {
  id:string; title:string; description:string; x:number; y:number; category_id:string; user_id:string;
  created_at:string; verification_status:string; image_url:string|null; external_url:string|null; tags:string[]|null;
  profiles?:{username:string|null;avatar_url:string|null}|null; categories?:Category|null; likes?:{user_id:string}[];
};