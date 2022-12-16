import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const goToLogin = (navigation) => {
    navigation.navigate('Login', { name: 'Yo' })
}

export const HomeScreen = ({ navigation }) => {

    useEffect( () => {
        (async () => {
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                navigation.navigate('Posts')
            }
        })();
    },[])

    return (
        <View style={styles.container}>
            <Text>Click to login!</Text>
            <Button onPress={() => goToLogin(navigation)} title="Login"></Button>
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
});
