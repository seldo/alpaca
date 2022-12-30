import * as localforage from "localforage";

export const authenticate = async (navigate,options) => {
    console.log("authenticating")
    let authUser = await getUser()
    if (!authUser) {
        console.log("I ran, but no auth")
        if (options.failure) navigate(options.failure);
        // this is an attempt to log in
        if (options.instance) {
            let app = await getOrCreateApp(options.instance)
            console.log(app)
            let authorizeUrl = new URL(getInstanceUrl(options.instance)+"/oauth/authorize")
            authorizeUrl.searchParams.append("response_type","code")
            authorizeUrl.searchParams.append("client_id",app.client_id)
            authorizeUrl.searchParams.append("redirect_uri","http://localhost:3000/auth/verify")
            authorizeUrl.searchParams.append("scope","read write")
            console.log(`redirect to ${authorizeUrl}`)
            await localforage.setItem("currentInstance",options.instance)
            window.location.href = authorizeUrl
        }
    } else {
        if (options.success) navigate(options.success);
    }
    // if not told to go anywhere we just return
    return authUser
}

/**
 * We will not repeat the same call more than once per X seconds
 */
const createTransactionKey = (call) => {
    return "transaction_lock_" + call

}
export const transactionLocked = async (call) => {
    let now = new Date()
    let key = createTransactionKey(call)
    let lock = await localforage.getItem(key)
    console.log(`Transaction lock ${key}`,lock)
    if (!lock) {
        localforage.setItem(key,{
            time: now
        })
        return false // not locked at all
    } else {
        if( (now - lock.time) > 5000 ) { // 5 seconds
            localforage.setItem(key,null)
            return false // lock expired
        } else {
            return true // lock still effective
        }
    }
}
export const unlock = async(call) => {
    let key = createTransactionKey(call)
    localforage.setItem(key,null)
}

const getInstanceUrl = (instance) => {
    return "https://"+instance
}

export const getOrCreateApp = async (instance) => {

    if(await transactionLocked("getOrCreateApp")) return

    let appKey = "oauthApp:"+instance
    let oauthApp = await localforage.getItem(appKey)
    
    if(!oauthApp) {
        console.log("Creating app")
    
        let createUrl = new URL(getInstanceUrl(instance)+"/api/v1/apps")
        let formData = new FormData();
        formData.append("client_name","Alpaca.Blue dev 3")
        formData.append("redirect_uris","http://localhost:3000/auth/verify")
        formData.append("scopes","read write push")
        formData.append("website","https://alpaca.blue")
        let res = await fetch(
            createUrl,
            {
                method: "POST",
                body: formData
            }
        )
        oauthApp = await res.json()
        // save instance for later
        oauthApp.instance = instance
        // store the app
        await localforage.setItem(appKey,oauthApp)
    } else {
        console.log("App already exists")        
    }
    console.log(`Found ${appKey}`,oauthApp)

    unlock("getOrCreateApp")
    return oauthApp
}

const getUserKey = () => {
    return "userAuth"
}

export const getUser = async () => {
    let authUser = await localforage.getItem(getUserKey())
    return authUser
}

export const validate = async (navigate,code) => {

    let instance = await localforage.getItem("currentInstance")
    let app = await getOrCreateApp(instance)
    let tokenUrl = new URL(getInstanceUrl(instance)+"/oauth/token")
    let formData = new FormData();
    formData.append("grant_type","authorization_code")
    formData.append("code",code)
    formData.append("client_id",app.client_id)
    formData.append("client_secret",app.client_secret)
    formData.append("redirect_uri","http://localhost:3000/auth/verify")
    formData.append("scope","read write push")
    let res = await fetch(
        tokenUrl,
        {
            method: "POST",
            body: formData
        }
    )
    let authCredentials = await res.json()
    if (!authCredentials.access_token) {
        console.log("Validation step failed",authCredentials)
        navigate("/?invalid")
        return
    }
    // cool, got the user, now get their credentials
    let userUrl = new URL(getInstanceUrl(instance)+"/api/v1/accounts/verify_credentials")
    let res2 = await fetch(
        userUrl,
        {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${authCredentials.access_token}`
            }
        }
    )
    let user = {
        auth: authCredentials,
        user: await res2.json()
    }
    await localforage.setItem(getUserKey(),user)
    await navigate("/home")
}
