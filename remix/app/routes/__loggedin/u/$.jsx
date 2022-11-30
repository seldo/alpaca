import { useState, useEffect } from "react";
import { MetaFunction } from "@remix-run/node"
import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "../../../services/auth.server";
import * as mastodon from "../../../models/tweets.server";
import stylesRoot from "~/../styles/root.css";
import { Tweet } from "../../../shared/components/tweet"

export const meta = () => ({
    title: "User Profile | Alpaca Blue: a Mastodon client",
});  

export default function Index() {
    return <div>
        Yo?
    </div>
}
