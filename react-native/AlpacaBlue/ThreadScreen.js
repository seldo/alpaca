import { SafeAreaView, View, StyleSheet, VirtualizedList, Text, Button, TextInput, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { getThread } from './models/Posts';
import Post from './components/Post'

export const ThreadScreen = ({ navigation, route }) => {

    const [thread,setThread] = useState([])
    const [refreshing,setRefreshing] = useState(false)

    let contentWidth = useWindowDimensions().width

    // initialize
    useEffect( () => {
        (async () => {
            let threadPosts = await getThread(route.params.post)
            console.log("thread was",threadPosts)
            setRefreshing(true)
            setThread(threadPosts)
            setRefreshing(false)
        })();
    },[])

    const somethingChanged = async () => {

    }

    const getItem = (data, index) => data[index]
    const getItemCount = (data) => data.length

    return (
        <SafeAreaView style={styles.container}>
            <VirtualizedList
                data={thread}
                initialNumToRender={10}
                renderItem={({ item }) => {
                    return <Post 
                        post={item} 
                        contentWidth={contentWidth} 
                        navigation={navigation} 
                        isThread={true}
                        cb={somethingChanged}
                    />
                }}
                keyExtractor={item => item.id}
                getItemCount={getItemCount}
                getItem={getItem}
                refreshing={refreshing}
                /*
                refreshCount={refreshCount}
                */
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
    threadPost: {
        borderWidth: 1
    },
})
