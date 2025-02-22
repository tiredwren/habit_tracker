import { View, StyleSheet } from 'react-native';
import React from 'react';
import TabBarButton from './nav_button';
import { Feather, AntDesign, MaterialIcons } from '@expo/vector-icons';

const TabBar = ({ state, descriptors, navigation }) => {
    const primaryColor = '#ffe8d6';
    const lightGreen = '#b7b7a4';

    // Assign icons based on route names
    const icons = {
        index: Feather,
        log: AntDesign,
    };

    const iconNames = {
        index: "home", // Icon for 'index' page
        log: "book",   // Icon for 'log' page
    };

    return (
        <View style={styles.tabbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel ?? options.title ?? route.name;

                if (['_sitemap', '+not-found'].includes(route.name)) return null;

                const isFocused = state.index === index;
                const IconComponent = icons[route.name] || Feather; // default to feather if not found
                const iconName = iconNames[route.name] || "circle"; // default to a generic icon

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                if (route.name === 'log' | route.name == 'progress') { // so the log component doesn't show on tab bar
                  return null;
              }

                return (
                    <TabBarButton
                        key={route.name}
                        onPress={onPress}
                        isFocused={isFocused}
                        routeName={route.name}
                        color={isFocused ? primaryColor : lightGreen}
                        label={label}
                        icon={<IconComponent name={iconName} size={24} color={isFocused ? primaryColor : lightGreen} />}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#6b705c',
        paddingVertical: 20,
        borderRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        shadowOpacity: 0.3,
        elevation: 5,
    },
});

export default TabBar;
