import { Link } from "@remix-run/react";

export const Lightbox = ({options}) => {
    let id = options.id
    let post = options.post
    let allMedia = post.media_attachments
    let currentMedia = options.currentMedia
    let setShowLightbox = options.setShowLightbox

    let lastMediaIndex = allMedia.length - 1
    let currentIndex = allMedia.findIndex( element => {
        return (element.url == currentMedia.url)
    })

    return <div 
        className="lightbox" 
        onClick={(e) => {
            e.stopPropagation()
            setShowLightbox(false)
        }}  
    >
        <button 
            className="close" 
            onClick={(e) => {
            e.stopPropagation()
            setShowLightbox(false)
        }}></button>
        <div className="mediaHolder">
            <div className="controls">
            { (currentIndex > 0) ? <button
                onClick={(e) => {
                    e.stopPropagation()
                    setShowLightbox({
                        id: post.id,
                        post,
                        currentMedia: allMedia[currentIndex-1],
                        setShowLightbox                        
                    })
                }}
                className="back">&lt;</button> : <></>
            }
            { (currentMedia.type == "image") ? <img 
                src={currentMedia.url} 
                width="100%" 
                alt={currentMedia.description} 
            /> : (currentMedia.type == "video") ? <div>
                <video width="100%" controls>
                    <source src={currentMedia.url} type="video/mp4"/>
                </video></div> : <div>{currentMedia.type}</div>
            }
            { (currentIndex < lastMediaIndex) ? <button
                onClick={(e) => {
                    e.stopPropagation()
                    setShowLightbox({
                        id: post.id,
                        post,
                        currentMedia: allMedia[currentIndex+1],
                        setShowLightbox                        
                    })
                }} 
                className="forward">&gt;</button> : <></> }
            </div>
        </div>
    </div>
}
