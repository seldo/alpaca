import { getThings } from "~/models/data.server"
import { useLoaderData } from "@remix-run/react";

export const loader = async () => {
    return await getThings()
  };

export default function Query() {
    const things = useLoaderData()
    console.log(things)
    return (
      <div>
        Woo.
      </div>
    );
  }
