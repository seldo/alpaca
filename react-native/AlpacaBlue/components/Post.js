import RenderHtml from 'react-native-render-html'
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { UserLink } from './UserLink'
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from './Avatar'

// actual call to like post
const likePost = async (post) => {
    let auth = JSON.parse(await AsyncStorage.getItem('auth'))
    let likeUrl = new URL(auth.instanceBasePath + `/api/v1/statuses/${post.id}/favourite`)
    console.log("likeUrl", likeUrl)
    try {
        let res = await fetch(likeUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        })
        let like = await res.json()
        console.log(`Liked post`, like)
        return like
    } catch (e) {
        console.log("Failed to like post", e)
        return []
    }
}

// make it look like we liked the post
export const showLikePost = async (post,cb) => {
    // asynchronously actually like the post
    likePost(post)
    // animate the icon and increment the count
    post.favourites_count = post.favourites_count + 1
    post.favourited = true
    // call back to trigger changes
    cb(post)
}

const rePost = async (post) => {
    let auth = JSON.parse(await AsyncStorage.getItem('auth'))
    let repostUrl = new URL(auth.instanceBasePath + `/api/v1/statuses/${post.id}/reblog`)
    console.log("repostUrl", repostUrl)
    try {
        let res = await fetch(repostUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        })
        let repost = await res.json()
        console.log(`reposted`, repost)
        return repost
    } catch (e) {
        console.log("Failed to repost", e)
        return []
    }
}

// make it look like we liked the post
export const showRePost = async (post,cb) => {
    // asynchronously reblog
    rePost(post)
    // animate the icon and increment the count
    post.reblogs_count = post.reblogs_count + 1
    post.reblogged = true
    // call back to trigger changes
    cb(post)
}

export const showReply = async (post,navigation) => {
    navigation.navigate('Compose',{inReplyTo:post})
}

const showImage = async (post,ma,cb) => {
    for(let i = 0; i < post.media_attachments.length; i++) {
        let a = post.media_attachments[i]
        if(a.id == ma.id) {
            post.media_attachments[i].show_full = true
        }
        post.show_image = true
    }
    cb(post)
}
const hideImage = async (post,ma,cb) => {
    for(let i = 0; i < post.media_attachments.length; i++) {
        let a = post.media_attachments[i]
        if(a.id == ma.id) {
            post.media_attachments[i].show_full = false
        }
        post.show_image = false
    }
    cb(post)
}

export default Post = ({ post, contentWidth, navigation, showAvatar = true, cb = null, reactionsEnabled = true }) => {

    const ReplyButton = () => <View style={styles.reactionsCount}>
        <Image
            source={require("../assets/icon-reply.png")}
            style={styles.reactionIcon} />
        <Text style={styles.reactionsCountNumber}>{post.replies_count}</Text>
    </View>

    const RepostButton = () => <View style={styles.reactionsCount}>
        <Image
            source={post.reblogged ? require("../assets/icon-repost-active.png") : require("../assets/icon-repost.png")}
            style={styles.reactionIcon} />
        <Text style={styles.reactionsCountNumber}>{post.reblogs_count}</Text>
    </View>

    const LikeButton = () => <View style={styles.reactionsCount}>
        <Image
            source={post.favourited ? require("../assets/icon-heart-active.png") : require("../assets/icon-heart.png")}
            style={styles.reactionIcon} />
        <Text style={styles.reactionsCountNumber}>{post.favourites_count}</Text>
    </View>
    
    try {
        const isReblog = post.reblog && post.reblog.account
        let account = post.account
        if (isReblog) account = post.reblog.account
        return <View>
            {isReblog ? <View style={styles.reblogNotice}>
                <UserLink account={post.account} navigation={navigation} small={true} /><Text style={styles.reblogNoticeText}> reblogged</Text>
            </View> : <></>
            }
            <View style={styles.post}>
                {
                    showAvatar ? <Avatar post={post} account={account} navigation={navigation} /> : <></>
                }
                <View style={styles.htmlContainer}>
                    <RenderHtml
                        contentWidth={contentWidth}
                        source={{ html: isReblog ? post.reblog.content : post.content }}
                    />
                </View>
                {
                    post.media_attachments.length > 0 ? <View style={styles.imageContainer}>
                        {
                            post.show_image ? post.media_attachments.map( (ma) => {
                                // show one big picture (have to find it)
                                if(ma.show_full) {                           
                                    let proportionalHeight = (contentWidth/ma.meta.original.width)*ma.meta.original.height
                                    return <View>
                                            <Pressable 
                                                onPress={() => hideImage(post,ma,cb)}
                                                style={[styles.fullImageContainer,{
                                                    width:contentWidth,
                                                    height:proportionalHeight
                                                }]}>
                                                <Image 
                                                    style={styles.fullImage}
                                                    source={{uri: ma.url}}/>
                                            </Pressable>
                                        </View>
                                } else { return <></> }
                            }) : post.media_attachments.map( (ma) => {
                                // show thumbnails of all pictures
                                return <View>
                                    <Pressable 
                                        onPress={() => showImage(post,ma,cb)}
                                        style={styles.previewContainer}>
                                        <Image 
                                            style={styles.previewImage}
                                            source={{uri: ma.url}}/>
                                    </Pressable>
                                </View>
                            })
                        }
                    </View> : <></>
                }
                { reactionsEnabled ? <View 
                    style={styles.reactionsContainer}>
                        <Pressable onPress={() => showReply(post,navigation)}>
                            <ReplyButton />
                        </Pressable>
                        <Pressable onPress={() => showRePost(post,cb)}>
                            <RepostButton />
                        </Pressable>
                        <Pressable onPress={() => showLikePost(post,cb)}>
                            <LikeButton />
                        </Pressable>
                    </View> : <View 
                        style={styles.reactionsContainer}>
                        <Pressable><ReplyButton /></Pressable>
                        <Pressable><RepostButton /></Pressable>
                        <Pressable><LikeButton /></Pressable>
                    </View>
                }
            </View>
        </View>

    } catch (e) {
        console.log("Error rendering post", e)
        console.log("Post was", post)
        return <View><Text>Oops</Text></View>
    }
}

const styles = StyleSheet.create({
    post: {
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 0.2,
        borderBottomColor: '#ccc',
        minHeight: 10,
    },
    reblogNotice: {
        flex: true,
        flexDirection: 'row',
        paddingLeft: 10,
        paddingTop: 10,
        paddingRight: 10
    },
    reblogNoticeText: {
        paddingTop: 3,
        fontSize: 10
    },
    htmlContainer: {
        paddingLeft: 40,
        paddingRight: 5
    },  
    reactionsContainer: {
        flex: true,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 5,
    },
    reactionIcon: {
        width: 20,
        height: 20
    },
    reactionsCount: {
        flex: true,
        flexDirection: 'row'
    },
    reactionsCountNumber: {
        paddingTop: 2.5,
        paddingLeft: 2,
        fontSize: 12
    },
    imageContainer: {
        flex: true,
        flexWrap: 'wrap',
        flexDirection: 'row',
        marginLeft: 40,
        marginBottom: 10,
        paddingRight: 10
    },
    previewContainer: {
        width: 150,
        height: 150,
    },
    previewImage: {
        width: 150,
        height: 150,
        flex: true,
    },
    fullImageContainer: {
        flex: true,
        marginLeft: -50
    },
    fullImage: {
        width: '100%',
        height: '100%'
    }
})
