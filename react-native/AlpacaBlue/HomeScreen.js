import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

const goToLogin = (navigation) => {
    navigation.navigate('Login', { name: 'Yo' })
}

export const HomeScreen = ({navigation}) => {
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
