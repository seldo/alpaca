import { createPost } from "~/shared/library/mastodon.client"

export const ComposeBox = ({user,isComposing,setIsComposing,replyHandle,inReplyTo=null,doneUrl=false,navigate}) => {

    const showCompose = (e) => {
        if(setIsComposing) setIsComposing(true)
    }
    const hideCompose = (e) => {
        // if they didn't type anything, hide the compose box again
        if(!e.currentTarget.value && setIsComposing) setIsComposing(false)
    }
    const checkSubmit = (e) => {
        if(e.key === 'Enter' && e.metaKey) {
            sendPost({text:e.currentTarget.value})
        }
    }
    const buttonSubmit = (e) => {
        let text = e.currentTarget.parentNode.parentNode.getElementsByTagName('textarea')[0].value
        sendPost({text})
    }

    const sendPost = async (post) => {
        console.log("Trying to post",post)
        console.log('navigate',navigate)
        console.log("doneUrl is",doneUrl)
        createPost(user,post)
        if(doneUrl) {
            navigate(doneUrl)
        }
    }

    return <div className={`composeBox` + (isComposing ? " active" : "")}>
        {
            (inReplyTo) ? <input type="hidden" name="inReplyTo" value={inReplyTo} /> : <div />
        }
        <div>
            <div onClick={(e) => {e.preventDefault(); e.stopPropagation()}}>
                <textarea name="post" placeholder={(replyHandle)?"":"What's up?"} onFocus={showCompose} onBlur={hideCompose} onKeyDown={checkSubmit} defaultValue={replyHandle ? `@`+replyHandle + " " : ""}></textarea>
            </div>
        </div>
        <div className="buttonHolder ">
            <button onClick={buttonSubmit}>Post</button>
        </div>
    </div>
}

export default ComposeBox
