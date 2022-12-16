import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorize, logout } from 'react-native-app-auth';
import {KEY_INSTANCES,OAUTH_APP_NAME,OAUTH_FAKE_CALLBACK,OAUTH_APP_WEBSITE} from './config'

export const HomeScreen = ({ navigation }) => {

    const [isLoggedIn,setIsLoggedIn] = useState(false)
    const [instanceInput,setInstanceInput] = useState("")

    const startLogin = async () => {
        console.log("Logging in");
        let instanceName = instanceInput.trim().toLowerCase()
        // see if we have a client app for this instance
        let instanceBasePath = "https://" + instanceName
        let clientKey = KEY_INSTANCES+instanceName
        let client = JSON.parse(await AsyncStorage.getItem(clientKey))
        if (!client) {
            // register a new client
            let formData = new FormData();
            formData.append("client_name", OAUTH_APP_NAME)
            formData.append("redirect_uris", OAUTH_FAKE_CALLBACK)
            formData.append("scopes","read write")
            formData.append("website",OAUTH_APP_WEBSITE)
            let instanceUrl = instanceBasePath + "/api/v1/apps"
            let appData = await fetch(instanceUrl, {
              method: "POST",
              body: formData
            })
            client = await appData.json()
            AsyncStorage.setItem(clientKey,JSON.stringify(client))
            console.log("Registered a client",client)
        }
        // use the client to make the auth request and receive the authState
        try {
            const config = {
                clientId: client.client_id,
                clientSecret: client.client_secret,
                redirectUrl: client.redirect_uri,
                scopes: ['read','write'],
                serviceConfiguration: {
                    authorizationEndpoint: instanceBasePath + '/oauth/authorize',
                    tokenEndpoint: instanceBasePath + '/oauth/token',
                    revocationEndpoint: instanceBasePath + '/oauth/revoke',
                }    
            };
            
            let auth = await authorize(config);            
            // make sure auth includes accessToken, accessTokenExpirationDate and refreshToken
            console.log("auth is",auth)
            auth.instanceBasePath = instanceBasePath
            await AsyncStorage.setItem('auth', JSON.stringify(auth))
            navigation.navigate('Posts')
        } catch (error) {
            console.log("Authorization triggered an error")
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
                <TextInput 
                    style={styles.input}
                    onChangeText={(text) => setInstanceInput(text)}
                ></TextInput>
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
