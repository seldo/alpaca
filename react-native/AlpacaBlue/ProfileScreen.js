import RenderHtml from 'react-native-render-html'
import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Post from "./components/Post"

export const ProfileScreen = ({ navigation, route }) => {

    const [account,setAccount] = useState(route.params.account)
    const [allPosts,setAllPosts] = useState([])
    const [isRefreshing,setIsRefreshing] = useState(false)
    const [followed,setFollowed] = useState(false)
    const [refreshCount,setRefreshCount] = useState(0)

    let contentWidth = useWindowDimensions().width

    const fetchPosts = async (options = {minId: null,maxId: null}) => {
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let profilePostsUrl = new URL(auth.instanceBasePath + `/api/v1/accounts/${account.id}/statuses`)
        profilePostsUrl.searchParams.append('limit',40)
        try {
            if(options.maxId) {
                console.log("Max ID was",options.maxId)
                profilePostsUrl.searchParams.append('max_id',options.maxId)
            }
        } catch (e) {
            console.log("Looking for max ID triggered exception")
            console.log(e)
        }
        try {
            if(options.minId) {
                console.log("Min ID was",options.minId)
                profilePostsUrl.searchParams.append('min_id',options.minId)
            }
        } catch(e) {
            console.log("Looking for minID triggered exception")
            console.log(e)
        }
        console.log("profilePostsUrl",profilePostsUrl)
        try {
            let res = await fetch(profilePostsUrl,{
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }            
            })
            let posts = await res.json()   
            console.log("Fetched user's posts:",posts.length)
            return posts        
        } catch (e) {
            console.log("Failed to fetch user's posts",e)
            return []
        }
    }

    const getItem = (data, index) => {
        return data[index];
    }
    const getItemCount = (data) => data.length
    const loadingBar = () => {
        if(isRefreshing) {
            return <ActivityIndicator size="small" color="#0000ff" />
        } else {
            return null
        }
    }

    const somethingChanged = async (post) => {
        for(let i = 0; i < allPosts.length; i++) {
            let examiningPost = allPosts[i]
            if (examiningPost.id == post.id) {
                allPosts[i] = post
            }
        }
        setAllPosts(allPosts)
        setRefreshCount(refreshCount+1)
    }

    const getFollowing = async (auth) => {
        let followingRequestUrl = new URL(auth.instanceBasePath + "/api/v1/accounts/relationships?id=" + account.id)
        let followingData = await fetch(followingRequestUrl.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        })
        let following = await followingData.json()
        console.log("Following data",following)
        if (following[0]) return following[0]
        else return null
    }
    
    // initialize
    useEffect( () => {
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("-----profile page got focus")
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                (async () => {
                    setIsRefreshing(true)
                    // get the user's posts
                    let posts = await fetchPosts()
                    setIsRefreshing(false)
                    setAllPosts(posts)
                    if(posts[0] && posts[0].account) setAccount(posts[0].account)
                    // also find out if we follow them
                    let isFollowed = await getFollowing(auth)
                    console.log("isFollowed",isFollowed)
                    setFollowed(isFollowed.following)
                })();        
            } else {
                navigation.navigate('Log in')
            }
        });
    },[])

    useEffect( () => {
        navigation.setOptions({
            title: account.display_name ? account.display_name : account.username
        })    
    },[])

    const toggleFollow = async (account) => {
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let action, fakeFollowStatus
        if(followed) {
            action = "unfollow"
            fakeFollowStatus = false
        } else {
            action = "follow"
            fakeFollowStatus = true
        }
        let followingRequestUrl = new URL(auth.instanceBasePath + `/api/v1/accounts/${account.id}/${action}`)
        let followingData = await fetch(followingRequestUrl.toString(), {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        })
        // don't wait around
        let following = followingData.json()
        // optimistically change UI
        setFollowed(fakeFollowStatus)
    }

    const profileHeader = () => {
        return <View style={[styles.shadowProp,{width:contentWidth}]}>
            <Image 
                style={styles.headerImage}
                source={{
                    uri: account.header
                }} />
            <Image 
                style={styles.avatarImage}
                source={{
                    uri: account.avatar
                }} />
            <View style={styles.followStatus}>
                <Pressable                    
                    onPress={() => toggleFollow(account,followed)}>
                    <View style={styles.followButton}>
                        <Text>{ followed ? "Unfollow" : "Follow" }</Text>
                    </View>
                </Pressable>
            </View>
            <Text style={styles.nameTitle}>{ account.display_name ? account.display_name : account.username }</Text>
            <View style={styles.description} >
                <RenderHtml 
                    contentWidth={contentWidth} 
                    source={{html: account.note }} />
            </View>
            <View style={styles.counts}>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.following_count}</Text>
                    <Text> following</Text>
                </View>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.followers_count}</Text>
                    <Text> followers</Text>
                </View>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.statuses_count}</Text>
                    <Text> posts</Text>
                </View>
            </View>
        </View>
    }

    return (
        <SafeAreaView style={styles.container}>
            <VirtualizedList
                data={allPosts}
                ListHeaderComponent={profileHeader()}
                initialNumToRender={10}
                renderItem={({ item }) => {
                    return <Post 
                        post={item} 
                        contentWidth={contentWidth} 
                        navigation={navigation} 
                        cb={somethingChanged}
                    />
                }}
                keyExtractor={item => item.id}
                getItemCount={getItemCount}
                getItem={getItem}
                /*
                onRefresh={fetchNewItems}
                onEndReached={fetchMoreItems}
                */
                refreshing={isRefreshing}
                refreshCount={refreshCount}
                ListFooterComponent={loadingBar}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#fff',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    headerImage: {
        width: '100%',
        height: 120
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: -50,
        marginLeft: 20,
        borderWidth: 5,
        borderColor: '#fff'
    },
    nameTitle: {
        paddingLeft: 20,
        paddingTop: 5,
        fontSize: 20,
        fontWeight: '800'
    },
    description: {
        paddingLeft: 10,
        marginLeft: 10,
        overflow: 'hidden',
    },
    shadowProp: {
        backgroundColor: '#fff',
        shadowColor: '#ccc',
        shadowOffset: {
            width: 0,
            height: 5
          },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        paddingBottom: 10
    },
    counts: {
        flex: true,
        flexDirection: 'row',
        paddingLeft: 20,
        paddingRight: 20,
        justifyContent: 'space-around'
    },
    followStatus: {
        flex: true,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: -30,
        marginRight: 20
    },
    followButton: {      
        backgroundColor: '#eee',
        borderRadius: 20,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 15,
    },
    number: {
        fontWeight: '700'
    },
    count: {
        flex: true,
        flexDirection: 'row'
    }
});
