import { Link } from "@remix-run/react";

export const Lightbox = ({options}) => {
    let id = options.id
    let post = options.post
    let currentMedia = options.currentMedia
    let setShowLightbox = options.setShowLightbox

    return <div className="lightbox">
        <button onClick={(e) => {
                            e.stopPropagation()
                            setShowLightbox(false)
                        }}></button>
        {JSON.stringify(currentMedia)}
    </div>
}
