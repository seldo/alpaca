import localforage from "localforage";
import { DateTime } from "luxon"

localforage.config({
    name: 'Alpaca Blue DB'
})

const DEFAULT_LIMIT = 3600 // 1 hour

const KEY_AUTH_USER = "authUser"
const KEY_ALL_POSTS = "allPosts"

export const isAvailable = true

/**
 * Get the key.
 * If you can't find the key throw error
 * If it's expired return null
 * @param {} key 
 * @param {*} limit How old the key is allowed to be in seconds
 */
const getFresh = async (key,limit = DEFAULT_LIMIT) => {
    let data = await localforage.getItem(key)
    if (!data) {
        throw new Error(`key ${key} not found`,1)
    }
    let oldestAllowed = DateTime.now().minus({seconds:limit})
    if (new DateTime(data.setTime) > oldestAllowed) {
        return data.data
    } else {
        return null
    }
}

/**
 * Set the key with the current time
 * @param {} key 
 * @param {*} data 
 * @returns 
 */
const setFresh = async (key,data) => {
    let setTime = DateTime.now()
    let cache = {
        setTime,
        data
    }
    return localforage.setItem(key,cache)
}

export const getUserAndTimeline = async () => {
    const endpoint = "/api/v1/user?timeline=true"
    // fast case
    try {
        let storedUser = await getFresh(KEY_AUTH_USER)
        let storedPosts = await getFresh(KEY_ALL_POSTS)
        if (storedUser && storedPosts) {
            console.log("Found user+posts fresh")
            return { user: storedUser, localPosts: storedPosts}
        }
    } catch (e) {
        if(e.cause == 1) { // key did not exist
            // that's fine, carry on
        } else {
            throw e
        }
    }

    // slow case
    let res = await fetch(endpoint,{
        method: "GET"
    })
    let data = await res.json()
    console.log("Did not find user+posts, storing")
    // store it (async) for fast case next time
    setFresh(KEY_AUTH_USER,data.user)
    setFresh(KEY_ALL_POSTS,data.localPosts)
    
    return data
}

export const updatePosts = async (posts) => {
    setFresh(KEY_ALL_POSTS,posts)
}
