import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies:{
        getAll(){return cookieStore.getAll();},
        setAll(cookiesToSet){
          try{
            for(const {name,value,options} of cookiesToSet){
              cookieStore.set(name,value,options);
            }
          }catch{
            // Route handlers and server components may not always be able to mutate cookies.
          }
        }
      }
    }
  );
}

export async function requireAdmin(){
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error || !user) return {supabase,user:null,authorized:false as const};

  const allowed=(process.env.SUPABASE_ADMIN_EMAILS??"")
    .split(",")
    .map(email=>email.trim().toLowerCase())
    .filter(Boolean);

  const email=user.email?.toLowerCase();
  return {supabase,user,authorized:Boolean(email && allowed.includes(email))};
}
