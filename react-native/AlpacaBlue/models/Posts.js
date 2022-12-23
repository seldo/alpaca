import AsyncStorage from '@react-native-async-storage/async-storage';

export const getOwnProfile = async () => {
    let auth = JSON.parse(await AsyncStorage.getItem('auth'))
    let profileUrl = new URL(auth.instanceBasePath + `/api/v1/accounts/verify_credentials`)
    try {
        let res = await fetch(profileUrl,{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        })
        let account = await res.json()   
        console.log("Fetched user's profile:",account)
        return account
    } catch (e) {
        console.log("Failed to fetch user's own profile",e)
        return []
    }
}

export const fetchPosts = async (account, options = {minId: null,maxId: null}) => {
    let auth = JSON.parse(await AsyncStorage.getItem('auth'))
    let profilePostsUrl = new URL(auth.instanceBasePath + `/api/v1/accounts/${account.id}/statuses`)
    profilePostsUrl.searchParams.append('limit',40)
    try {
        if(options.maxId) {
            console.log("Max ID was",options.maxId)
            profilePostsUrl.searchParams.append('max_id',options.maxId)
        }
    } catch (e) {
        console.log("Looking for max ID triggered exception")
        console.log(e)
    }
    try {
        if(options.minId) {
            console.log("Min ID was",options.minId)
            profilePostsUrl.searchParams.append('min_id',options.minId)
        }
    } catch(e) {
        console.log("Looking for minID triggered exception")
        console.log(e)
    }
    console.log("profilePostsUrl",profilePostsUrl)
    try {
        let res = await fetch(profilePostsUrl,{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }            
        })
        let posts = await res.json()   
        console.log("Fetched user's posts:",posts.length)
        return posts        
    } catch (e) {
        console.log("Failed to fetch user's posts",e)
        return []
    }
}
