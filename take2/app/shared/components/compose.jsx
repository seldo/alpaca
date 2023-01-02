import { createPost } from "~/shared/library/mastodon.client"

export const ComposeBox = ({user,isComposing,setIsComposing,replyHandle,setRepliesOpen=null,inReplyTo=null,doneUrl=false,navigate}) => {

    const defaultReply = replyHandle ? `@`+replyHandle + " " : ""

    const showCompose = (e) => {
        if(setIsComposing) setIsComposing(true)
    }
    const hideCompose = (e) => {
        // if they didn't type anything, hide the compose box again
        if(!e.currentTarget.value) {
            if (setIsComposing) setIsComposing(false)
        }
        // if it's a reply and only the handle is present, also hide it again
        if (e.currentTarget.value == defaultReply) {
            if (setRepliesOpen) setRepliesOpen(false)
        }
    }
    const checkSubmit = (e) => {
        if(e.key === 'Enter' && e.metaKey) {
            sendPost(e.currentTarget,{text:e.currentTarget.value})
        }
    }
    const buttonSubmit = (e) => {
        e.preventDefault()
        e.stopPropagation()
        let textarea = e.currentTarget.parentNode.parentNode.getElementsByTagName('textarea')[0]
        sendPost(textarea,{text:textarea.value})
    }

    const sendPost = async (target,post) => {
        console.log("Trying to post",post)
        console.log('navigate',navigate)
        console.log("doneUrl is",doneUrl)
        if (inReplyTo) post.inReplyTo = inReplyTo
        // actually post (async)
        createPost(user,post)
        // clean up (since we likely stay on this page)
        // send them on their way
        if(doneUrl) {
            navigate(doneUrl)
        }
        target.value = ""
        if (setIsComposing) setIsComposing(false)
        if (setRepliesOpen) setRepliesOpen(false)
    }

    return <div className={`composeBox` + (isComposing ? " active" : "")}>
        <div>
            <div onClick={(e) => {e.preventDefault(); e.stopPropagation()}}>
                <textarea name="post" placeholder={(replyHandle)?"":"What's up?"} onFocus={showCompose} onBlur={hideCompose} onKeyDown={checkSubmit} defaultValue={defaultReply}></textarea>
            </div>
        </div>
        <div className="buttonHolder ">
            <button onClick={buttonSubmit}>Post</button>
        </div>
    </div>
}

export default ComposeBox
