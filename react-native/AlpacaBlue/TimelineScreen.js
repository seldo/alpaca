import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html'

export const TimelineScreen = ({navigation}) => {

    const [allPosts,setAllPosts] = useState([])

    const fetchTimeline = async (options = {minId: null,maxId: null}) => {
        console.log("options are",options)
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let timelineUrl = new URL("https://seldo.dev/api/v1/timelines/home")
        timelineUrl.searchParams.append('limit',40)
        if(options.maxId) {
            console.log("Max ID was",options.maxId)
            timelineUrl.searchParams.append('max_id',options.maxId)
        }
        console.log("Timeline URL",timelineUrl)
        try {
            let res = await fetch(timelineUrl,{
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }            
            })
            console.log(res)
            let timeline = await res.json()   
            console.log("Fetched items:",timeline.length)
            console.log("Adding posts:",timeline.map( (p,index) => index + ":" + p.content))
            return timeline        
        } catch (e) {
            console.log("Failed to fetch timeline",e)
            return []
        }
    }

    // initialize to the top of the timeline
    useEffect( () => {
        (async () => {
            let timeline = await fetchTimeline()
            setAllPosts(timeline)
        })();
    },[])

    let contentWidth = useWindowDimensions().width

    const fetchMoreItems = async () => {
        console.log(`Ran out of items; currently we only have ${allPosts.length} items`)
        let maxId = allPosts[allPosts.length-1].id
        console.log(`must fetch items up to ${maxId}`)
        try {
            (async () => {
                console.log("here")
                let morePosts = await fetchTimeline({maxId:maxId})
                let newPosts = allPosts.concat(morePosts)
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
    const Post = ({post}) => (
        <View style={styles.item}>
          <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:post.content ? post.content : post.reblog.content}}
                    styles={{
                        foregroundColor: 'red',
                        textAlign: 'left',
                        borderWidth: 1
                    }}
                />
        </View>
      );
    
    return (
        <View style={styles.container}>
            <Text>This will be a timeline.</Text>
            <SafeAreaView>
                <VirtualizedList
                    data={allPosts}
                    initialNumToRender={10}
                    renderItem={({ item }) => <Post post={item} />}
                    keyExtractor={item => item.id}
                    getItemCount={getItemCount}
                    getItem={getItem}
                    onEndReached={fetchMoreItems}
                />
            </SafeAreaView>
            <Text>What</Text>
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
