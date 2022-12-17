import { View, Text, StyleSheet, Image } from 'react-native';

export const UserLink = ({account}) => {
    try {
        return <Text style={styles.name}><UserLink account={account} /></Text>
    } catch(e) {
        return <View><Text>Oops</Text></View>
    }
}

export const Others = ({people}) => {
    try {
        return people.length == 1 ? <Text>
                {people[0].display_name || people[0].username }
            </Text> : people.length == 2 ? <Text>
                {people[0].display_name || people[0].username } and {people[1].display_name || people[1].username }
            </Text> : people.length == 3 ? <Text>
                {people[0].display_name || people[0].username}, {people[1].display_name || people[1].username} and {people.length-2} other
            </Text> : <Text>
                {people[0].display_name || people[0].username}, {people[1].display_name || people[1].username} and {people.length-2} others
            </Text> 
    } catch(e) {
        return <Text>NAME_NOT_FOUND</Text>
    }
}

const styles = StyleSheet.create({
    name: {
        fontWeight: '800'
    },
})
