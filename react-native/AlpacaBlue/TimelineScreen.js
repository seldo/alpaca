import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html'

export const TimelineScreen = ({navigation}) => {

    const [allPosts,setAllPosts] = useState([])

    const fetchTimeline = async (minId = null,maxId = null) => {
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let timelineUrl = new URL("https://seldo.dev/api/v1/timelines/home")
        timelineUrl.searchParams.append('limit',40)
        let res = await fetch(timelineUrl,{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }            
        })
        let timeline = await res.json()   
        console.log("Timeline items:",timeline.length)
        console.log("Timeline content:",timeline.map( (p,index) => index + ":" + p.content))
        return timeline
    }

    // initialize to the top of the timeline
    useEffect( () => {
        (async () => {
            let timeline = await fetchTimeline()
            setAllPosts(timeline)
        })();
    },[])

    let contentWidth = useWindowDimensions().width

    const getItem = (data, index) => data[index];
    const getItemCount = (data) => data.length;
    const Post = ({content}) => (
        <View style={styles.item}>
          <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:content}}
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
                    initialNumToRender={20}
                    renderItem={({ item }) => <Post content={item.content} />}
                    keyExtractor={item => item.id}
                    getItemCount={getItemCount}
                    getItem={getItem}
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
    }
});
