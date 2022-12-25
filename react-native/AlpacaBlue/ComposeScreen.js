import { SafeAreaView, View, StyleSheet, Text, Button, TextInput, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { sendPost } from './models/Posts';
import Post from './components/Post'

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
        navigation.setParams({
            inReplyTo: null
        })
        onChangeText('')
        navigation.goBack()
    }

    useEffect( () => {
        navigation.setOptions({
            headerLeft: () => {
                return <Button 
                onPress={() => {
                    navigation.setParams({
                        inReplyTo: null
                    })
                    navigation.goBack()
                }}
                title="Dismiss" 
              />
            }
        })
    },[navigation])

    return (
        <SafeAreaView style={styles.modalScreen}>
            <View>
            { route.params && route.params.inReplyTo ? <Post 
                post={route.params.inReplyTo} 
                reactionsEnabled={false}
                reactionsHidden={true}
                contentWidth={contentWidth}
                /> : <></>
            }
            </View>
            <View>
                <TextInput
                    multiline={true}
                    style={[styles.input,{width:contentWidth}]}
                    onChangeText={onChangeText}
                    value={text}
                />
            </View>
            <Button onPress={sendPostAndDismiss} title="Send post" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    modalScreen: {
        backgroundColor: '#fff'
    },
    input: {
        height: 200,
        backgroundColor: '#fff',
        padding: 10
    }
})
