import { SafeAreaView, View, StyleSheet, Text, Button, TextInput, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

export const ComposeScreen = ({ navigation }) => {

    const [text,onChangeText] = useState('')

    let contentWidth = useWindowDimensions().width

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
            <TextInput
                multiline={true}
                style={[styles.input,{width:contentWidth}]}
                onChangeText={onChangeText}
                value={text}
            />            
            <Button title="Send post" />
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
