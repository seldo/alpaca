import { SafeAreaView, View, VirtualizedList, StyleSheet, TextInput, Text, useWindowDimensions, ActivityIndicator, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Avatar } from "./components/Avatar"
import RenderHtml from 'react-native-render-html'

export const SearchScreen = ({ navigation }) => {

    const [searchResults, setSearchResults] = useState([])
    const [isRefreshing, setIsRefreshing] = useState(false)

    let searchString

    const setSearchString = (text) => {
        console.log(text)
        searchString = text
    }

    const search = async (options = { resolve: true }) => {
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let searchUrl = auth.instanceBasePath + `/api/v2/search?q=${searchString}`
        if (options.resolve) {
            searchUrl += `&resolve=true`
        }
        if (options.type) {
            searchUrl += `&type=${options.type}`
        }
        console.log("Search URL:", searchUrl)
        // TODO the rest of the search parameters
        try {
            let searchData = await fetch(searchUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }
            })
            let searchResults = await searchData.json()
            if (searchResults.error) {
                console.log(`Search results for "${query}" returned error`, searchResults.error)
                return false
            }
            return searchResults.accounts.map( i => {
                i.type = 'account'
                return i
            }).concat(searchResults.hashtags.map( i => {
                i.type = 'hashtag'
                return i
            })).concat(searchResults.statuses.map( i => {
                i.type = 'status'
                return i
            }))
        } catch (e) {
            console.log(`Search method threw error`, e)
            return false
        }
    }

    const showSearch = async (event) => {
        let searchResults = await search()
        console.log("Search results", searchResults)
        setSearchResults(searchResults)
    }

    const SearchResult = ({ item }) => {
        console.log(item)
        switch (item.type) {
            case 'account':
                return <View style={styles.accountResult}>
                    <Avatar account={item} navigation={navigation} />
                </View>
            case 'hashtag':
                return <View><Text>#{item.name}</Text></View>
            case 'status':
                return <View><Text>{item.type}</Text></View>
        }
    }
    const getItemCount = () => searchResults.length
    const getItem = (data, index) => data[index]

    const LoadingBar = () => {
        if (isRefreshing) {
            return <ActivityIndicator size="small" color="#0000ff" />
        } else {
            return <></>
        }
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeSearch}>
                <View style={styles.searchBox}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setSearchString(text)}
                        returnKeyType='search'
                        placeholder="People, posts, hashtags..."
                        onSubmitEditing={showSearch}
                    ></TextInput>
                    <Button
                        onPress={showSearch}
                        title="Search"
                    />
                </View>
                <View style={styles.searchResults}>
                    <VirtualizedList
                        style={styles.searchList}
                        data={searchResults}
                        initialNumToRender={0}
                        renderItem={({ item }) => <SearchResult item={item} />}
                        keyExtractor={item => item.id}
                        getItemCount={getItemCount}
                        getItem={getItem}
                        refreshing={isRefreshing}
                    />
                </View>
                <LoadingBar />
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
    searchBox: {
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
    },
    input: {
        width: '80%',
        height: 40,
        borderRadius: 20,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 10,
        paddingBottom: 10
    },
    safeSearch: {
        flex: true,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    searchResults: {
        flex: true,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingLeft: 10,
        paddingRight: 10
    },
    accountResult: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 10,
        paddingBottom: 10
    }
});
