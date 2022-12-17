import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html'

export const ProfileScreen = ({ navigation, route }) => {
    let contentWidth = useWindowDimensions().width

    let account = route.params.account

    useEffect( () => {
        navigation.setOptions({
            title: account.display_name ? account.display_name : account.username
        })    
    },[])

    return (
        <SafeAreaView style={styles.container}>
            <Image 
                style={styles.headerImage}
                source={{
                    uri: account.header
                }} />
            <Image 
                style={styles.avatarImage}
                source={{
                    uri: account.avatar
                }} />
            <Text style={styles.nameTitle}>{ account.display_name ? account.display_name : account.username }</Text>
            <View style={styles.description} >
                <RenderHtml contentWidth={contentWidth} source={{html: account.note }} />
            </View>
            <View style={styles.counts}>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.following_count}</Text>
                    <Text> following</Text>
                </View>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.followers_count}</Text>
                    <Text> followers</Text>
                </View>
                <View style={styles.count}>
                    <Text style={styles.number}>{account.statuses_count}</Text>
                    <Text> posts</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#fff',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        borderWidth: 1
    },
    headerImage: {
        width: '100%',
        height: 180
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: -50,
        marginLeft: 20,
        borderWidth: 5,
        borderColor: '#fff'
    },
    nameTitle: {
        paddingLeft: 20,
        paddingTop: 5,
        fontSize: 20,
        fontWeight: '800'
    },
    description: {
        paddingLeft: 10,
        marginLeft: 10
    },
    counts: {
        flex: true,
        flexDirection: 'row',
        paddingLeft: 20,
        paddingRight: 20,
        justifyContent: 'space-around'
    },
    number: {
        fontWeight: '700'
    },
    count: {
        flex: true,
        flexDirection: 'row'
    }
});
