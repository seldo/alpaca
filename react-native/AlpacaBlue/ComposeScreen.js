import { SafeAreaView, View, StyleSheet, Text, Button, TextInput, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { sendPost } from './models/Posts';

export const ComposeScreen = ({ navigation, route }) => {

    const [text,onChangeText] = useState('')

    let contentWidth = useWindowDimensions().width

    const sendPostAndDismiss = async () => {
        let post = {
            text
        }
        if(route.params && route.params.inReplyTo) {
            post.in_reply_to_id = route.params.inReplyTo.id
        }
        let posted = await sendPost(post)
        navigation.goBack()
    }

    useEffect( () => {
        navigation.setOptions({
            headerLeft: () => {
                return <Button 
                onPress={() => navigation.goBack()} 
                title="Dismiss" 
              />
            }
        })
    },[navigation])

    return (
        <SafeAreaView style={styles.modalScreen}>
            { route.params && route.params.inReplyTo ? <Text>It's a reply</Text> : <Text>New post</Text>
            }
            <TextInput
                multiline={true}
                style={[styles.input,{width:contentWidth}]}
                onChangeText={onChangeText}
                value={text}
            />            
            <Button onPress={sendPostAndDismiss} title="Send post" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    modalScreen: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'flex-start',
    },
    input: {
        height: 200,
        backgroundColor: '#fff',
        padding: 10
    }
})
