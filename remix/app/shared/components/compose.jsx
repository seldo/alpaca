import { Form } from "@remix-run/react";
import Avatar from "~/shared/components/avatar"

export const ComposeBox = ({user,isComposing,setIsComposing,replyHandle, inReplyTo=null}) => {

    const showCompose = (e) => {
        setIsComposing(true)
    }
    const hideCompose = (e) => {
        // if they didn't type anything, hide the compose box again
        if(!e.currentTarget.value) setIsComposing(false)
    }
    const checkSubmit = (e) => {
        console.log(e)
        if(e.key === 'Enter' && e.metaKey) {
            e.currentTarget.closest("form").submit()
        }
    }

    return <div className={`composeBox` + (isComposing ? " active" : "")}>
        <Form method="post" action="/post/create" reloadDocument>
            {
                (inReplyTo) ? <input type="hidden" name="inReplyTo" value={inReplyTo} /> : <div />
            }
            <div className="pr-4 flex flex-row">
                <div className="w-full" onClick={(e) => {e.preventDefault(); e.stopPropagation()}}>
                    <textarea name="post" placeholder={(replyHandle)?"":"What's up?"} onFocus={showCompose} onBlur={hideCompose} onKeyDown={checkSubmit}>{replyHandle ? `@`+replyHandle + " " : ""}</textarea>
                </div>
            </div>
            <div className="buttonHolder ">
                <button type="submit">Post</button>
            </div>
        </Form>
    </div>
}

export default ComposeBox
