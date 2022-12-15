import { StyleSheet, Text, View, Button, SafeAreaView, TextInput } from 'react-native';
import { authorize } from 'react-native-app-auth';

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

const startLogin = async () => {
    console.log("Yo");
    // use the client to make the auth request and receive the authState
    try {
        const result = await authorize(config);
        // result includes accessToken, accessTokenExpirationDate and refreshToken
        console.log(result)
    } catch (error) {
        console.log(error);
    }
}

export const LoginScreen = () => {
    return (
        <View style={styles.container}>
            <SafeAreaView>
                <Text>Enter your instance</Text>
                <TextInput style={styles.input}></TextInput>
                <Button onPress={startLogin} title="Login"></Button>
            </SafeAreaView>
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
