import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Tabs, Stack } from 'expo-router';
import TabBar from '../../components/navigation';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import auth from "@react-native-firebase/auth"

const _layout = () => {
    const [fontsLoaded] = useFonts({
        'Jost': require('../../assets/fonts/Jost/Jost-VariableFont_wght.ttf'), 
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
                    tabBarIcon: "home",
                    headerRight: () => (
                                    <TouchableOpacity onPress={() => router.replace('./')}>
                                        <Text style={{ marginRight: 10, color: '#0000ff' }}>logout</Text>
                                    </TouchableOpacity>
                                )
                }}
            />
        </Tabs>
    );
}

export default _layout;
