import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import RenderHtml from 'react-native-render-html'

export const NotificationsScreen = ({ navigation }) => {

    const [allNotifications, setAllNotifications] = useState([])
    const [allBatchedNotifications, setBatchedNotifications] = useState([])
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchNotifications = async (options = { minId: null, maxId: null }) => {
        console.log("options are", options)
        let auth = JSON.parse(await AsyncStorage.getItem('auth'))
        let notificationsUrl = new URL(auth.instanceBasePath + "/api/v1/notifications")
        notificationsUrl.searchParams.append('limit', 50)
        try {
            if (options.maxId) {
                console.log("Max ID was", options.maxId)
                notificationsUrl.searchParams.append('max_id', options.maxId)
            }
        } catch (e) {
            console.log("Looking for max ID triggered exception")
            console.log(e)
        }
        try {
            if (options.minId) {
                console.log("Min ID was", options.minId)
                notificationsUrl.searchParams.append('min_id', options.minId)
            }
        } catch (e) {
            console.log("Looking for minID triggered exception")
            console.log(e)
        }
        console.log("Notifications URL", notificationsUrl)
        try {
            let res = await fetch(notificationsUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.accessToken}`
                }
            })
            console.log(res)
            let Notifications = await res.json()
            console.log("Fetched items:", Notifications.length)
            console.log(Notifications)
            return Notifications
        } catch (e) {
            console.log("Failed to fetch Notifications", e)
            return []
        }
    }

    // initialize Notifications
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            console.log("--notifications got focus")
            let auth = JSON.parse(await AsyncStorage.getItem('auth'))
            if(auth) {
                (async () => {
                    let Notifications = await fetchNotifications()
                    setAllNotifications(Notifications)
                    let batchedNotifications = batchNotifications(Notifications)
                    setBatchedNotifications(batchedNotifications)
                })();
            } else {
                navigation.navigate('Log in')
            }
        });
    }, [])

    const makeIdForNotification = (n) => {
        switch (n.type) {
            case "mention": return "mentioned_" + n.status.id
            case "status": return // FIXME: ignoring notifications for now
            case "reblog": return "reblogged_" + n.status.id
            case "follow": return "followed_you"
            case "follow_request": return n.account.id + "_requested_follow"
            case "favourite": return "favorited_" + n.status.id
            case "poll": return // FIXME: ignoring polls ending for now
            case "update": return // FIXME: ignoring status updates for now
        }
    }

    const batchNotifications = (notifications) => {
        // batch up all the reactions to the same objects
        let thingsReactedTo = {}
        for (let n of notifications) {
            let nId = makeIdForNotification(n)
            if (!thingsReactedTo[nId]) thingsReactedTo[nId] = []
            thingsReactedTo[nId].push(n)
        }
        // process each group of reactions
        let batches = []
        for (let trt of Object.values(thingsReactedTo)) {
            // everything in a group is the same type so we can infer it from the first one
            let type = trt[0].type
            // get the events into most recent order
            trt.sort((a, b) => {
                if (b.created_at > a.created_at) return 1
                else return -1
            })
            let lastEvent = trt[0].created_at // credit the batch with the time of the most recent addition
            let notification = { type, lastEvent }
            switch (type) {
                case "favourite": // fuckin' "u"s
                    // many people can favorite one status
                    notification.status = trt[0].status
                    notification.accounts = trt.map((t) => {
                        return t.account
                    })
                    break;
                case "mention":
                    // only one person can mention you at a time
                    notification.status = trt[0].status
                    notification.account = trt[0].account
                    break;
                case "follow":
                    // many people can follow you
                    notification.accounts = trt.map((t) => {
                        return t.account
                    })
                case "reblog":
                    // many people can reblog one status
                    notification.status = trt[0].status
                    notification.accounts = trt.map((t) => {
                        return t.account
                    })
                    break;
            }
            batches.push(notification)
        }
        // sort by lastEvent
        batches.sort((a, b) => {
            if (b.lastEvent > a.lastEvent) return 1
            else return -1
        })
        return batches
    }

    let contentWidth = useWindowDimensions().width

    const mergeAndSort = (a, b) => {
        let seenIds = []
        let merged = []
        // everything in a
        for (let i = 0; i < a.length; i++) {
            seenIds.push(a[i].id)
            merged.push(a[i])
        }
        // anything in b that wasn't in a
        // so more recently fetched things should go in a
        for (let i = 0; i < b.length; i++) {
            let item = b[i]
            if (!seenIds.includes(item.id)) {
                seenIds.push(item.id)
                merged.push(item)
            }
        }
        // sort by created_at
        let sorted = merged.sort((a, b) => {
            if (a.created_at > b.created_at) return -1
            return 1
        })
        return sorted
    }

    const fetchMoreItems = async () => {
        console.log(`Ran out of items; currently we only have ${allPosts.length} items`)
        let maxId = allPosts[allPosts.length - 1].id
        console.log(`must fetch items up to ${maxId}`)
        try {
            (async () => {
                console.log("here")
                setIsRefreshing(true)
                let morePosts = await fetchTimeline({ maxId: maxId })
                setIsRefreshing(false)
                let newPosts = mergeAndSort(morePosts, allPosts)
                setAllPosts(newPosts)
                console.log("Total items", allPosts.length)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")
            console.log(e)
        }
        return
    }
    const fetchNewItems = async () => {
        console.log(`Is there anything new?`)
        let minId = allPosts[10].id // arbitrary, to see if there's backfill
        console.log(`fetching items after ${minId}`)
        try {
            (async () => {
                console.log("there")
                setIsRefreshing(true)
                let freshPosts = await fetchTimeline({ minId: minId })
                setIsRefreshing(false)
                let newPosts = mergeAndSort(freshPosts, allPosts)
                setAllPosts(newPosts)
                console.log("Total items", allPosts.length)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")
            console.log(e)
        }
        return
    }

    const getItem = (data, index) => {
        return data[index];
    }
    const getItemCount = (data) => data.length

    const Notification = ({ event }) => {
        console.log(event)
        return <View style={styles.item}>
            {event.type == 'reblog' ? <View width={contentWidth}>
                <Text>{event.accounts[0].display_name} and {event.accounts.length-1} others reposted your post</Text>
                <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:event.status.content}}
                    />
            </View> : event.type == 'favourite' ? <View width={contentWidth}>
                <Text>{event.accounts[0].display_name} and {event.accounts.length-1} others liked your post</Text>
                <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:event.status.content}}
                    />
            </View> : event.type == 'mention' ? <View width={contentWidth}>
                <Text>{event.account.display_name} mentioned you</Text>
                <RenderHtml
                    contentWidth={contentWidth}
                    source={{html:event.status.content}}
                    />
            </View> : event.type == 'follow' ? <View width={contentWidth}>
                <Text>{event.accounts[0].display_name} and {event.accounts.length-1} others followed you</Text>
            </View> : <View />}
        </View>
    }
    const loadingBar = () => {
        if (isRefreshing) {
            return <ActivityIndicator size="small" color="#0000ff" />
        } else {
            return null
        }
    }

    return (
        <View style={styles.container}>
            <SafeAreaView>
                <VirtualizedList
                    data={allBatchedNotifications}
                    initialNumToRender={10}
                    renderItem={({ item }) => <Notification event={item} />}
                    keyExtractor={item => item.id}
                    getItemCount={getItemCount}
                    getItem={getItem}
                    /*
                    onRefresh={fetchNewItems}
                    onEndReached={fetchMoreItems}
                    */
                    ListFooterComponent={loadingBar}
                    refreshing={isRefreshing}
                    removeClippedSubviews={true}
                />
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
    },
    item: {
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 0.2,
        borderBottomColor: '#ccc',
        minHeight: 10
    }
});
