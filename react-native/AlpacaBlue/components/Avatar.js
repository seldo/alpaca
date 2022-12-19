import { View, Text, Pressable, Image, StyleSheet } from 'react-native'
import { viewProfile } from './UserLink'
import TimeAgo from 'javascript-time-ago'

export const Avatar = ({post,account,navigation}) => {

    const timeAgo = new TimeAgo('en-US')

    return <View style={styles.author}>
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
                { post ? <Text style={styles.timeAgo}> • {timeAgo.format(new Date(post.created_at))}</Text> : <></> }
            </View>
            <Text style={styles.username}>@{account.acct}</Text>
        </View>
    </View>
}

const styles = StyleSheet.create({
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
