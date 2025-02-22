import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import TabBar from '../components/navigation';


const _layout = () => {
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
