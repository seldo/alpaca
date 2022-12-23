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
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './HomeScreen';
import { TimelineScreen } from './TimelineScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { SearchScreen } from "./SearchScreen"
import { ProfileScreen } from "./ProfileScreen"
import { SelfScreen } from "./SelfScreen"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const tabIcon = (iconName) => {
  let icon, iconActive
  switch (iconName) {
    case "Timeline":
      icon = require("./assets/icon-home.png")
      iconActive = require("./assets/icon-home-active.png")
      break;
    case "Notifications":
      icon = require("./assets/icon-notifications.png")
      iconActive = require("./assets/icon-notifications-active.png")
      break;
    case "Search":
      icon = require("./assets/icon-search.png")
      iconActive = require("./assets/icon-search-active.png")
      break;
    case "Self":
      icon = require("./assets/icon-avatar.png")
      iconActive = require("./assets/icon-avatar-active.png")
      break;
    }
  return ({focused, color, size}) => {
    let display = icon
    if (focused) display = iconActive
    return <Image 
      source={display}
      style={styles.tabIcon}
    />
  }
}

const composeButton = (props) => {
  let icon = require("./assets/icon-edit.png")
  console.log(props)
  return <TouchableOpacity {...props}><View style={styles.composeButton}>
    <Image 
      source={icon}
      style={styles.composeIcon}
    />
  </View></TouchableOpacity>
}

const MainApp = () => {
  return <Tab.Navigator>
    <Tab.Screen 
      name="Timeline" 
      component={TimelineScreen} 
      options={{
        tabBarIcon: tabIcon("Timeline")
      }}
    />
    <Tab.Screen 
      name="Mentions" 
      component={NotificationsScreen} 
      options={{
        tabBarIcon: tabIcon("Notifications")
      }}
    />
    <Tab.Screen 
      name="Compose" 
      component={SearchScreen} 
      options={{
        tabBarButton: composeButton
      }}
    />
    <Tab.Screen 
      name="Search" 
      component={SearchScreen} 
      options={{
        tabBarIcon: tabIcon("Search")
      }}
    />
    <Tab.Screen 
      name="Self" 
      component={SelfScreen} 
      options={{
        headerTitle: "Your profile",
        tabBarIcon: tabIcon("Self"),
        tabBarLabel: "Profile"
      }}
    />
  </Tab.Navigator>
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
          headerShown: false
        }}>
        <Stack.Group>
          <Stack.Screen name="Log in" component={HomeScreen} />
          <Stack.Screen name="Back" component={MainApp} />
        </Stack.Group>
        <Stack.Group screenOptions={{
          headerShown: true
        }}>
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Group>        
      </Stack.Navigator>      
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
  tabIcon: {
    width: 20,
    height: 20,
  },
  composeButton: {
    marginTop: -5,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#008DFF',
    padding: 10,
    width: 60,
    height: 60,
    borderRadius: 10
  },
  composeIcon: {
    width: 30,
    height: 30,
    marginTop: 5,
    marginLeft: 5
  }
});

export default App;
