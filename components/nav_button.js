import { View, Text, Pressable, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const TabBarButton = (props) => {
    const { isFocused, label, icon } = props;
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 0, { damping: 10, stiffness: 100 });
    }, [isFocused]);

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.1]) }],
        backgroundColor: 'transparent',
        paddingHorizontal: isFocused ? 18 : 14,
        paddingVertical: isFocused ? 10 : 8,
        borderRadius: 50,
        flexDirection: 'row', // align icon and text when focused
        alignItems: 'center',
        gap: isFocused ? 6 : 0, // add spacing between icon and text when focused
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        color: isFocused ? '#ffe8d6' : '#b7b7a4',
        fontSize: isFocused ? 18 : 16,
        fontWeight: isFocused ? '600' : '500',
        letterSpacing: isFocused ? 0.5 : 0.3,
        opacity: interpolate(scale.value, [0, 1], [0, 1]), // animation when text when focused
    }));

    return (
        <Pressable {...props} style={styles.container}>
            <Animated.View style={[styles.button, animatedButtonStyle]}>
                {icon}
                {isFocused && (
                    <Animated.Text style={animatedTextStyle}>
                        {label}
                    </Animated.Text>
                )}
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TabBarButton;
