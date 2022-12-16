import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorize, logout } from 'react-native-app-auth';

// base config
const config = {
    clientId: 'VmwsQKagYtOFL527d-I5BnLfOhV2N_npI-rZa6P5HpA',
    clientSecret: 'peo_E_9sqx0z8K6GhFc1RK7pjsrItOY6W7fRPw38EtM',
    redirectUrl: 'alpacablue://login',
    scopes: ['read','write','push'],
    serviceConfiguration: {
        authorizationEndpoint: 'https://seldo.dev/oauth/authorize',
        tokenEndpoint: 'https://seldo.dev/oauth/token',
        revocationEndpoint: 'https://seldo.dev/oauth/revoke',
    }    
};

export const HomeScreen = ({ navigation }) => {

    const [isLoggedIn,setIsLoggedIn] = useState(false)

    const startLogin = async () => {
        console.log("Logging in");
        // use the client to make the auth request and receive the authState
        try {
            let auth = await authorize(config);
            // result includes accessToken, accessTokenExpirationDate and refreshToken
            await AsyncStorage.setItem('auth', JSON.stringify(auth))
            navigation.navigate('Posts')
        } catch (error) {
            console.log("Saving did not work")
            console.log(error);
        }
    }

    const logout = async () => {
        try {
            // we log out by losing our auth
            await AsyncStorage.removeItem('auth')
            setIsLoggedIn(false)
        } catch(e) {
            console.log("exception logging out",e)
        }
    }

    useEffect( () => {
        (async () => {
            console.log("Home screen -----------------------")
            auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                navigation.navigate('Posts')
            }
        })();
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("-----home screen got focus")
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                setIsLoggedIn(true)
            }
        });
    },[])

    return (
        <View style={styles.container}>
            <Text>This is Alpaca.Blue</Text>
            { isLoggedIn? <View>
                <Text>You're logged in. Would you like to log out?</Text>
                <Button onPress={logout} title="Logout"></Button>
            </View> : <View>
                <Text>It's an open source iOS client for Mastodon.</Text>            
                <Text>To get started, enter an instance name and click "login".</Text>
                <TextInput style={styles.input}></TextInput>
                <Button onPress={startLogin} title="Login"></Button>
                <Text>Hint: if your Mastodon handle is @somebody@some.domain then your instance name is some.domain</Text>
            </View> }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 10
    },
    input: {
        borderWidth: 1,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderColor: '#000',
        width: 200
    }
});
