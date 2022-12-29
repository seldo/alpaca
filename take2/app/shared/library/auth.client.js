export const authenticate = (navigate,options) => {
    let auth = localStorage.getItem("auth")
    if (!auth) {
        console.log("I ran, but no auth")
        if (options.failure) navigate(options.failure);
    } else {
        if (options.success) navigate(options.success);
    }
    // if not told to go anywhere we just return
    return auth
}
