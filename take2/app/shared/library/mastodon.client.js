import { getInstanceUrl, callAPIdebounced } from "./auth.client"
import * as localforage from "localforage";

export const mergeWithoutDupes = async (oldPosts, newPosts) => {
    if(!newPosts) return oldPosts
    console.log(`merging: ${oldPosts.length} old, ${newPosts.length} new`)
    let merged = []
    let seenIds = []
    for (let i = 0; i < oldPosts.length; i++) {
        let post = oldPosts[i]
        seenIds.push(post.id)
        merged.push(post)
    }

    // merge in any we haven't seen
    for (let i = 0; i < newPosts.length; i++) {
        let post = newPosts[i]
        if (!seenIds.includes(post.id)) {
            merged.push(post)
        }
    }
    // sort by date
    merged.sort((a, b) => {
        if (b.created_at > a.created_at) return 1
        else return -1
    })
    console.log(`Merged: ${merged.length} total`,merged)
    return merged
}

export const getTimeline = async (authUser,options = {
        minId: null,
        maxId: null
    }) => {
    let callOptions = {}
    if (options.maxId) {
        callOptions.queryParams = {
            max_id: options.maxId
        }
    }
    return await callAPIdebounced(authUser, "/api/v1/timelines/home",callOptions)
}

export const pollEvents = async(authUser,allPosts,setPosts) => {
    // TODO
}

const makeTimelineKey = (authUser) => {
    return `timeline:${authUser.user.username}@${authUser.user.instance}`
}

export const saveLocalTimeline = async (authUser,allPosts) => {
    console.log("Allposts to saveLocalTimeline is",allPosts)
    // get the most recent 200 so we don't just keep saving forever
    let postsToSave = allPosts.slice(0,200)
    localforage.setItem(makeTimelineKey(authUser),postsToSave)
}

export const loadLocalTimeline = async (authUser,allPosts) => {
    // load everything
    let posts = localforage.getItem(makeTimelineKey(authUser))
    return posts
}

export const streamEvents = async (authUser, postBuffer, setPostBuffer, postBufferCount, setPostBufferCount) => {

    // check that this server supports streaming
    let health = await callAPIdebounced(authUser,"/api/v1/streaming/health",{expectJson:false})
    // if it doesn't we poll
    if (health !== "OK") return pollEvents(authUser,postBuffer,setPostBuffer)

    console.log("Streaming events for user", authUser)

    fetch(getInstanceUrl(
        authUser.user.instance) + "/api/v1/streaming/user",
        {
            headers: {
                "Authorization": `Bearer ${authUser.auth.access_token}`
            }
        })
        .then((response) => response.body)
        .then((body) => {
            const reader = body.getReader();
            reader.read().then(async function processText({ done, value }) {
                let event = new TextDecoder().decode(value);
                console.log("Chunk read, value is", event)
                if (event.indexOf(':') === 0) {
                    // this is a keepalive, do nothing
                } else {
                    let [typeLine,dataLine] = event.split("\n")
                    let type = typeLine.split(":")[1].trim()
                    let dataString = dataLine.substring(5)
                    let data = JSON.parse(dataString)
                    switch(type) {
                        case "update":
                            // add it to the buffer
                            let mergedBuffer = await mergeWithoutDupes(postBuffer,[data])
                            postBuffer = mergedBuffer
                            setPostBuffer(postBuffer)
                            postBufferCount = postBufferCount+1
                            setPostBufferCount(postBufferCount)
                            break
                        default:
                            console.log("Don't know what to do with event type",type)
                    }
                }
                // if done then stop but posts don't stop
                if (done) {
                    console.log("Stream complete");
                    return;
                }
                // recurse and keep reading
                return reader.read().then( processText)
            })
        })

}
