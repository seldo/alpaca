import * as localforage from "localforage";
import { DateTime } from "luxon"

const DEFAULT_LIMIT = 3600 // 1 hour

const KEY_AUTH_USER = "authUser"
const KEY_ALL_POSTS = "allPosts"
const KEY_ALL_NOTIFICATIONS = "allNotifications"

export const initialize = async (user) => {
    let cacheKey = `${user.username}@${user.instance}`
    console.log("initializing cache",cacheKey)
    await localforage.config({
        name: `Alpaca Blue DB: ${cacheKey}`
    })    
}

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
        throw new Error(`key ${key} not found`,{cause:1})
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

export const getUserAndTimeline = async (user) => {
    await initialize(user)
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
    console.log("Saving posts")
    setFresh(KEY_ALL_POSTS,posts)
}

export const getNotifications = async (user) => {
    await initialize(user)
    const endpoint = "/api/v1/notifications"
    // fast case
    try {
        let storedNotifications = await getFresh(KEY_ALL_NOTIFICATIONS)
        if (storedNotifications) {
            console.log("Found notifications fresh",storedNotifications)
            return storedNotifications
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
    // store it (async) for fast case next time
    setFresh(KEY_ALL_NOTIFICATIONS,data)
    console.log("Did not get notifications from cache; now fetched and stored",data)
    
    return data
}

export const updateNotifications = async (notifications) => {
    console.log("Saving notifications")
    setFresh(KEY_ALL_NOTIFICATIONS,notifications)
}
