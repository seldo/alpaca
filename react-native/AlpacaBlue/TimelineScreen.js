import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html'

export const TimelineScreen = ({navigation}) => {

    const [allPosts,setAllPosts] = useState([])
    const [isRefreshing,setIsRefreshing] = useState(false)

    const fetchTimeline = async (options = {minId: null,maxId: null}) => {
        console.log("options are",options)
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        console.log("auth is",auth)
        let timelineUrl = new URL(auth.instanceBasePath + "/api/v1/timelines/home")
        timelineUrl.searchParams.append('limit',40)
        try {
            if(options.maxId) {
                console.log("Max ID was",options.maxId)
                timelineUrl.searchParams.append('max_id',options.maxId)
            }
        } catch (e) {
            console.log("Looking for max ID triggered exception")
            console.log(e)
        }
        try {
            if(options.minId) {
                console.log("Min ID was",options.minId)
                timelineUrl.searchParams.append('min_id',options.minId)
            }
        } catch(e) {
            console.log("Looking for minID triggered exception")
            console.log(e)
        }
        console.log("Timeline URL",timelineUrl)
        try {
            let res = await fetch(timelineUrl,{
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }            
            })
            let timeline = await res.json()   
            console.log("Fetched items:",timeline.length)
            //console.log("Adding posts:",timeline.map( (p,index) => index + ":" + p.content))
            return timeline        
        } catch (e) {
            console.log("Failed to fetch timeline",e)
            return []
        }
    }

    // initialize to the top of the timeline
    useEffect( () => {
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("-----timeline got focus")
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                (async () => {
                    let timeline = await fetchTimeline()
                    setAllPosts(timeline)
                })();        
            } else {
                navigation.navigate('Log in')
            }
        });
    },[])



    let contentWidth = useWindowDimensions().width
    const mergeAndSort = (a,b) => {
        let seenIds = []
        let merged = []
        // everything in a
        for(let i = 0; i < a.length; i++) {
            seenIds.push(a[i].id)
            merged.push(a[i])
        }
        // anything in b that wasn't in a
        // so more recently fetched things should go in a
        for(let i = 0; i < b.length; i++) {
            let item = b[i]
            if(!seenIds.includes(item.id)) {
                seenIds.push(item.id)
                merged.push(item)
            }
        }
        // sort by created_at
        let sorted = merged.sort( (a,b) => {
            if (a.created_at > b.created_at) return -1
            return 1
        })
        return sorted
    }

    const fetchMoreItems = async () => {
        console.log(`Ran out of items; currently we only have ${allPosts.length} items`)
        let maxId = allPosts[allPosts.length-1].id
        console.log(`must fetch items up to ${maxId}`)
        try {
            (async () => {
                console.log("here")
                setIsRefreshing(true)
                let morePosts = await fetchTimeline({maxId:maxId})
                setIsRefreshing(false)
                let newPosts = mergeAndSort(morePosts,allPosts)
                setAllPosts(newPosts)
                console.log("Total items",allPosts.length)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")            
            console.log(e)
        }
        return
    }
    const fetchNewItems = async () => {
        console.log(`Is there anything new?`)
        let minId = allPosts[10].id // arbitrary, to see if there's backfill
        console.log(`fetching items after ${minId}`)
        try {
            (async () => {
                console.log("there")
                setIsRefreshing(true)
                let freshPosts = await fetchTimeline({minId:minId})
                setIsRefreshing(false)
                let newPosts = mergeAndSort(freshPosts,allPosts)
                setAllPosts(newPosts)
                console.log("Total items",allPosts.length)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")            
            console.log(e)
        }
        return
    }

    const getItem = (data, index) => {
        return data[index];
    }
    const getItemCount = (data) => data.length
    const Post = ({post}) => {
        try {
            return <View style={styles.item}>
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
    const loadingBar = () => {
        if(isRefreshing) {
            return <ActivityIndicator size="small" color="#0000ff" />
        } else {
            return null
        }
    }

    return (
        <View style={styles.container}>
            <SafeAreaView>
                <VirtualizedList
                    data={allPosts}
                    initialNumToRender={10}
                    renderItem={({ item }) => <Post post={item} />}
                    keyExtractor={item => item.id}
                    getItemCount={getItemCount}
                    getItem={getItem}
                    onRefresh={fetchNewItems}
                    onEndReached={fetchMoreItems}
                    ListFooterComponent={loadingBar}
                    refreshing={isRefreshing}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderColor: '#000'
    },
    item: {
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 0.2,
        borderBottomColor: '#ccc',
        minHeight: 10
    }
});
