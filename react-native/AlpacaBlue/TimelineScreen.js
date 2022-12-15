import { StyleSheet, Text, View, Button, SafeAreaView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const TimelineScreen = ({navigation}) => {

    const [data,setData] = useState([])

    useEffect( () => {
        (async () => {
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            console.log("auth is",auth)
            let res = await fetch('https://seldo.dev/api/v1/timelines/home',{
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }            
            })
            let timeline = await res.json()   
            console.log(timeline)
            setData(timeline)
        })();
    },[])

    useEffect( () => {
       setData(data)
    },[data])
    
    return (
        <View style={styles.container}>
            <Text>This will be a timeline.</Text>
            {
                data ? data.map( (p) => {
                    return <View>
                        <Text>Yo.</Text>
                        <Text>{p.content}</Text>
                    </View>
                }) : <Text>Nothing yet.</Text>
            }
            {
                data ? <Text>Yes</Text> : <Text>No</Text>
            }
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
