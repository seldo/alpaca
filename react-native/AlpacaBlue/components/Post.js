import RenderHtml from 'react-native-render-html'
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { viewProfile, UserLink } from './UserLink'
import TimeAgo from 'javascript-time-ago'
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const timeAgo = new TimeAgo('en-US')

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

export default Post = ({ post, contentWidth, navigation, showAvatar = true, cb = null }) => {
    
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
                    showAvatar ? <View style={styles.author}>
                        <Pressable onPress={() => viewProfile(account, navigation)}>
                            <Image
                                style={styles.avatar} source={{
                                    uri: account.avatar,
                                }}
                            />
                        </Pressable>
                        <View style={styles.authorName}>
                            <View style={styles.nameAndTime}>
                                <Text onPress={() => viewProfile(account, navigation)}
                                    style={styles.displayName}>{account.display_name || account.username}</Text>
                                <Text style={styles.timeAgo}> • {timeAgo.format(new Date(post.created_at))}</Text>
                            </View>
                            <Text style={styles.username}>@{account.username}</Text>
                        </View>
                    </View> : <View></View>
                }
                <RenderHtml
                    contentWidth={contentWidth}
                    source={{ html: isReblog ? post.reblog.content : post.content }}
                />
                <View style={styles.reactionsContainer}>
                    <Pressable onPress={() => showLikePost(post,cb)}>
                        <View style={styles.reactionsCount}>
                            <Image
                                source={post.favourited ? require("../assets/icon-heart-active.png") : require("../assets/icon-heart.png")}
                                style={styles.reactionIcon} />
                            <Text>{post.favourites_count}</Text>
                        </View>
                    </Pressable>
                </View>
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
        minHeight: 10
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
    author: {
        flex: true,
        flexDirection: "row"
    },
    authorName: {
        paddingLeft: 8
    },
    nameAndTime: {
        flex: true,
        flexDirection: 'row',
    },
    timeAgo: {
        paddingTop: 3.5,
        fontSize: 9
    },
    displayName: {
        fontWeight: '800',
    },
    username: {
        color: '#888'
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15
    },
    reactionContainer: {
        flex: true,
        flexDirection: 'row',
        alignContent: 'space-between'
    },
    reactionIcon: {
        width: 20,
        height: 20
    },
    reactionsCount: {
        flex: true,
        flexDirection: 'row'
    },
})
