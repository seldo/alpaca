import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, useWindowDimensions, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Post from './components/Post'
import { UserLink, Others } from './components/UserLink'

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
            let notifications = await res.json()
            console.log("Fetched items:", notifications.length)
            return notifications
        } catch (e) {
            console.log("Failed to fetch notifications", e)
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
            let notificationId = makeIdForNotification(trt[0])
            let notification = { type, lastEvent, id: notificationId }
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
        console.log("batch IDs",batches.map( (n) => n.id ))
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
        console.log(`Ran out of items; currently we only have ${allNotifications.length} items`)
        let maxId = allNotifications[allNotifications.length - 1].id
        console.log(`must fetch items up to ${maxId}`)
        try {
            (async () => {
                console.log("here")
                setIsRefreshing(true)
                let moreNotifications = await fetchNotifications({ maxId: maxId })
                setIsRefreshing(false)
                let newNotifications = mergeAndSort(moreNotifications, allNotifications)
                setAllNotifications(newNotifications)
                console.log("Total items", allNotifications.length)
                let batchedNotifications = batchNotifications(newNotifications)
                setBatchedNotifications(batchedNotifications)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")
            console.log(e)
        }
        return
    }
    const fetchNewItems = async () => {
        console.log(`Is there anything new?`)
        let minId = allNotifications[5].id // a little overlap in case of backfill
        console.log(`fetching items after ${minId}`)
        try {
            (async () => {
                console.log("there")
                setIsRefreshing(true)
                let freshNotifications = await fetchNotifications({ minId: minId })
                setIsRefreshing(false)
                let newNotifications = mergeAndSort(freshNotifications, allNotifications)
                setAllNotifications(newNotifications)
                console.log("Total items", allNotifications.length)
                let batchedNotifications = batchNotifications(newNotifications)
                setBatchedNotifications(batchedNotifications)
            })();
        } catch (e) {
            console.log("Failed to run anonymous function")
            console.log(e.currentTarget)
        }
        return
    }

    const getItem = (data, index) => {
        return data[index];
    }
    const getItemCount = (data) => data.length

    const Notification = ({ event }) => {
        console.log(event)
        return <View style={styles.notification}>
            { event.type == 'reblog' ? <View 
                width={contentWidth} 
            >
                <View 
                    style={styles.notificationContainer}
                >
                    <Image
                        source={require('./assets/icon-repost-active.png')}
                        style={styles.notificationIcon}
                    /> 
                    <Text 
                        style={styles.notificationText}
                    >
                        <Others 
                            people={event.accounts}
                            navigation={navigation}
                            /> reposted your post
                    </Text>
                </View>
                <Post 
                    post={event.status} 
                    contentWidth={contentWidth} 
                    showAvatar={false} 
                />
            </View> : event.type == 'favourite' ? <View 
                width={contentWidth} 
                style={styles.repostContainer}
            > 
                <View style={styles.notificationContainer}>
                    <Image
                        source={require('./assets/icon-heart-active.png')}
                        style={styles.notificationIcon}
                    /> 
                    <Text 
                        style={styles.notificationText}
                    >
                        <Others 
                            people={event.accounts}
                            navigation={navigation}
                            /> liked your post
                    </Text>
                </View>
                <Post 
                    post={event.status} 
                    contentWidth={contentWidth} 
                    showAvatar={false} 
                />
            </View> : event.type == 'mention' ? <View 
                width={contentWidth}
            >
                <View style={styles.notificationContainer}>
                    <Text 
                        style={styles.mentionText}
                    ><Others 
                        people={[event.account]} 
                        navigation={navigation}
                        /> mentioned you</Text>
                </View>
                <Post post={event.status} contentWidth={contentWidth} />
            </View> : event.type == 'follow' ? <View 
                width={contentWidth} 
                style={styles.follow}
            >
                <View style={styles.notificationContainer}>
                    <Image
                        source={require('./assets/icon-avatar-active.png')}
                        style={styles.notificationIcon}
                    /> 
                    <Text><Others 
                        people={event.accounts}
                        navigation={navigation}
                        /> followed you</Text>
                </View>
                <View style={styles.avatarList}>
                {
                    event.accounts.slice(0,10).map( (a) => {
                        return <Image style={styles.avatar} source={{
                            uri: a.avatar,
                        }}
                    />
                    })
                }
                </View>
            </View> : <View></View>
            }
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
                    onRefresh={fetchNewItems}
                    onEndReached={fetchMoreItems}
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
    follow: {
        borderBottomWidth: 0.2,
        borderBottomColor: '#ccc',
        paddingTop: 5,
        paddingBottom: 5,
        paddingRight: 10,
        minHeight: 60
    },
    notificationContainer: {
        width: '95%',
        flex: true,
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 10,
        marginBottom: -15,
        paddingTop: 10
    },
    notificationText: {
        paddingTop: 3,
    },
    mentionText: {
        marginBottom: 15
    },
    notificationIcon: {
        width: 25,
        height: 25,
        marginRight: 5
    },
    avatarList: {
        marginTop: 15,
        paddingLeft: 37,
        height: 30,
        flex: true,
        flexDirection: 'row'
    },
    avatar: {
        marginRight: 2,
        width: 30,
        height: 30,
        borderRadius: 15
    }
});
