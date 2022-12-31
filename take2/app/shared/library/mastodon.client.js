import { getInstanceUrl, callAPIdebounced } from "./auth.client"

export const mergeWithoutDupes = async (oldPosts, newPosts) => {

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
    return merged
}

export const getTimeline = async (authUser) => {

    return await callAPIdebounced(authUser, "/api/v1/timelines/home")

}

export const streamEvents = async (authUser, allPosts) => {

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
            reader.read().then(function processText({ done, value }) {
                var string = new TextDecoder().decode(value);
                console.log("Chunk read, value is", string)
                // if done then stop but posts don't stop
                if (done) {
                    console.log("Stream complete");
                    return;
                }
                // recurse and keep reading
                return reader.read().then(processText)
            })
        })

}
