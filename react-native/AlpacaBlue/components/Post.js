import RenderHtml from 'react-native-render-html'
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { viewProfile, UserLink } from './UserLink'
import TimeAgo from 'javascript-time-ago'

const timeAgo = new TimeAgo('en-US')

export default Post = ({post, contentWidth, navigation, showAvatar = true}) => {
    try {
        const isReblog = post.reblog && post.reblog.account
        let account = post.account
        if (isReblog) account = post.reblog.account
        return <View>
            { isReblog ? <View style={styles.reblogNotice}>
                    <UserLink account={post.account} navigation={navigation} small={true} /><Text style={styles.reblogNoticeText}> reblogged</Text>
                </View> : <></>
            }
            <View style={styles.post}>
            {
                showAvatar ? <View style={styles.author}>
                    <Pressable onPress={() => viewProfile(account,navigation)}>
                        <Image 
                        style={styles.avatar} source={{
                            uri: account.avatar,
                        }}                        
                        />
                    </Pressable>
                    <View style={styles.authorName}>
                        <View style={styles.nameAndTime}>
                            <Text onPress={() => viewProfile(account,navigation)}
                                style={styles.displayName}>{account.display_name || account.username}</Text>
                            <Text style={styles.timeAgo}> • {timeAgo.format(new Date(post.created_at))}</Text>
                        </View>
                        <Text style={styles.username}>@{account.username}</Text>
                    </View>
                </View> : <View></View>
            }
            <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:isReblog ? post.reblog.content : post.content }}
                    styles={{
                        foregroundColor: 'red',
                        textAlign: 'left',
                        borderWidth: 1
                    }}
                />
        </View>
        </View>
    } catch(e) {
        console.log("Error rendering post",e)
        console.log("Post was",post)
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
})
