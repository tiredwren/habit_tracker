import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '../components/navigation';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

const _layout = () => {
    const [fontsLoaded] = useFonts({
        'Jost': require('../assets/fonts/Jost/Jost-VariableFont_wght.ttf'), 
    });
    

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={props => <TabBar {...props} />}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "habits",
                    tabBarIcon: "home"
                }}
            />
        </Tabs>
    );
}

export default _layout;
