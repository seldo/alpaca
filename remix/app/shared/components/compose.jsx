import { Form } from "@remix-run/react";
import Avatar from "~/shared/components/avatar"

export const ComposeBox = ({user}) => {
    return <div className="composeBox">
        <Form method="post" action="/post/create" reloadDocument>
            <div className="pr-4 flex flex-row">
                <div className="w-full">
                    <textarea name="post" placeholder="What's up?"></textarea>
                </div>
            </div>
            <div className="buttonHolder">
                <button type="submit">Post</button>
            </div>
        </Form>
    </div>
}

export default ComposeBox
