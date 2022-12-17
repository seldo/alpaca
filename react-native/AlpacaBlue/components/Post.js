import RenderHtml from 'react-native-render-html'
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { viewProfile } from './UserLink'

export default Post = ({post, contentWidth, navigation, showAvatar = true}) => {
    console.log("post got navigation",navigation)
    try {
        return <View style={styles.post}>
            {
                showAvatar ? <View style={styles.author}>
                    <Pressable onPress={() => viewProfile(post.account,navigation)}>
                        <Image 
                        style={styles.avatar} source={{
                            uri: post.account.avatar,
                        }}                        
                        />
                    </Pressable>
                    <View style={styles.authorName}>
                        <Text onPress={() => viewProfile(post.account,navigation)}
                            style={styles.displayName}>{post.account.display_name || post.account.username}</Text>
                        <Text style={styles.username}>@{post.account.username}</Text>
                    </View>
                </View> : <View></View>
            }
            <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:post.content ? post.content : post.reblog.content ? post.reblog.content : ""}}
                    styles={{
                        foregroundColor: 'red',
                        textAlign: 'left',
                        borderWidth: 1
                    }}
                />
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
    author: {
        flex: true,
        flexDirection: "row"
    },
    authorName: {
        paddingLeft: 8
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
