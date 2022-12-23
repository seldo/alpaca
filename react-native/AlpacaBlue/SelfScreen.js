import RenderHtml from 'react-native-render-html'
import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { getOwnProfile, fetchPosts } from './models/Posts';

export const SelfScreen = ({ navigation, route }) => {

    const [account,setAccount] = useState(false)
    const [allPosts,setAllPosts] = useState([])
    const [isRefreshing,setIsRefreshing] = useState(false)

    let contentWidth = useWindowDimensions().width

    // initialize
    useEffect( () => {
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("-----self page got focus")
            let account = await getOwnProfile()
            if(account) {
                (async () => {
                    setIsRefreshing(true)
                    setAccount(account)
                    // get the user's posts
                    let posts = await fetchPosts(account)
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
            {
            allPosts.length > 0 ? <VirtualizedList
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
                refreshing={isRefreshing}
                ListFooterComponent={loadingBar}
            /> : <View>
                <Text>Nada</Text>
            </View>
            }
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
