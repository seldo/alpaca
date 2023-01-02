import { ComposeBox } from "~/shared/components/compose"
import { useOutletContext } from "react-router-dom"

export default function Index() {

    const {authUser} = useOutletContext();

    return <div className="composePage">
        <div className="composeHeader pageHeader">
            <h2>Make a post</h2>
        </div>
        <ComposeBox isComposing={true} user={authUser} />
    </div>
  
}  
