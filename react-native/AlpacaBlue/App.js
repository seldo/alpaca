/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import 'react-native-gesture-handler';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './HomeScreen';
import { LoginScreen } from './LoginScreen';
import { TimelineScreen } from './TimelineScreen';
import { NotificationsScreen } from './NotificationsScreen';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const MainApp = () => {
  return <Tab.Navigator>
    <Tab.Screen name="Timeline" component={TimelineScreen} />
    <Tab.Screen name="Mentions" component={NotificationsScreen} />
  </Tab.Navigator>
}

const App = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{
          headerShown: false
        }}>
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Login" component={LoginScreen} />
        <Drawer.Screen name="Posts" component={MainApp} />
      </Drawer.Navigator>      
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
