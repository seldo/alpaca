import RenderHtml from 'react-native-render-html'
import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Post from "./components/Post"

export const ProfileScreen = ({ navigation, route }) => {

    const [account,setAccount] = useState(route.params.account)
    const [allPosts,setAllPosts] = useState([])
    const [isRefreshing,setIsRefreshing] = useState(false)

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
    
    // initialize
    useEffect( () => {
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("-----profile page got focus")
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                (async () => {
                    setIsRefreshing(true)
                    let posts = await fetchPosts()
                    setIsRefreshing(false)
                    setAllPosts(posts)
                    if(posts[0] && posts[0].account) setAccount(posts[0].account)
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
            <Text style={styles.nameTitle}>{ account.display_name ? account.display_name : account.username }</Text>
            <View style={styles.description} >
                <RenderHtml contentWidth={contentWidth} source={{html: account.note }} />
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
    number: {
        fontWeight: '700'
    },
    count: {
        flex: true,
        flexDirection: 'row'
    }
});
