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
  Text
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeScreen } from './HomeScreen';
import { TimelineScreen } from './TimelineScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { SearchScreen } from "./SearchScreen"

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

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

const iconHome = ({focused, color, size}) => {
  let icon = require("./assets/icon-home.png")
  if (focused) icon = require("./assets/icon-home-active.png")
  return <Image 
    source={icon}
    style={styles.tabIcon}
  />
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
      name="Search" 
      component={SearchScreen} 
      options={{
        tabBarIcon: tabIcon("Search")
      }}
    />
  </Tab.Navigator>
}

const App = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{
          headerShown: false
        }}>
        <Drawer.Screen name="Log in" component={HomeScreen} />
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
  tabIcon: {
    width: 20,
    height: 20,
  },
});

export default App;
