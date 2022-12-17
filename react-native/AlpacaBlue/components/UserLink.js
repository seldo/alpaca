import { View, Text, StyleSheet, Image } from 'react-native';

export const viewProfile = (account,navigation) => {
    navigation.navigate('Profile',{account})
}

export const UserLink = ({account, navigation, small=false}) => {
    let chosenStyle = styles.big
    if(small) chosenStyle = styles.small
    try {
        return <Text style={chosenStyle} onPress={() => viewProfile(account,navigation)}>{account.display_name || account.username }</Text>
    } catch(e) {
        return <View><Text>Oops</Text></View>
    }
}

export const Others = ({people, navigation}) => {
    try {
        return people.length == 1 ? <Text>
                <UserLink account={people[0]} navigation={navigation} />
            </Text> : people.length == 2 ? <Text>
                <UserLink account={people[0]} navigation={navigation} /> and <UserLink account={people[1]} navigation={navigation} />
            </Text> : people.length == 3 ? <Text>
                <UserLink account={people[0]} navigation={navigation} />, <UserLink account={people[1]} navigation={navigation} /> and {people.length-2} other
            </Text> : <Text>
                <UserLink account={people[0]} navigation={navigation} />, <UserLink account={people[1]} navigation={navigation} /> and {people.length-2} others
            </Text> 
    } catch(e) {
        return <Text>NAME_NOT_FOUND</Text>
    }
}

const styles = StyleSheet.create({
    big: {
        fontWeight: '800'
    },
    small: {
        paddingTop: 1,
        fontWeight: '500',
        fontSize: 12
    }
})
