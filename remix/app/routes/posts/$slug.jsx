import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getPost } from "../../models/posts.server";

export const loader = async ({ params }) => {
  const post = await getPost(params.slug);
  return { post };
};


export default function PostSlug() {
    const { post } = useLoaderData();

    return (
      <div>
        <h1>{post.title}</h1>
        <div>{post.body}</div>
      </div>
    );
  }
  