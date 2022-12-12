import { authenticateAnyInstance } from "~/services/auth.server";

export const loader = async ({ request, params }) => {
  const url = new URL(request.url);
  let instanceName = url.searchParams.get("instance");

  console.log("/auth/mastodon called with instance",instanceName)
  return await authenticateAnyInstance(instanceName,request,{
    successRedirect: "/home",
    failureRedirect: "/?failedauth"
  })

};
