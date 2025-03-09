import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from "../assets/styles/styles";
import auth from "@react-native-firebase/auth";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null); // to keep track whether user is authenticated
    const [isLogin, setIsLogin] = useState(true);

    const handleAuthentication = async () => {
        try {
            if (user) {
                // if the user is already authenticated, log them out
                console.log('user logged out successfully!');
                await signOut(auth);
            } else {
                // log user in or sign them up
                if (isLogin) {
                // log in
                await auth().signInWithEmailAndPassword(email, password);
                console.log('log in successful!');
                } else {
                // sign up
                await auth().createUserWithEmailAndPassword(email, password);
                console.log('account creation successful!');
                }
            }
        } catch (error) {
            console.error('auth error:', error.message);
        }
    };

    const handleEmailChange = (text) => {
        setEmail(text);
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
    };

    const toggleLoginSignup = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
    };

    return (
        <View style={styles.authContainer}>
            <Text style={styles.title}>l o g i n</Text>

            <TextInput
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                placeholder="Email"
            />
            <View>
                <Text style={styles.labelText}>email</Text>
            </View>

            <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                placeholder="Password"
            />
            <View>
                <Text style={styles.labelText}>password</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
                    <Text style={styles.buttonText}>{isLogin ? "login" : "sign up"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomContainer}>
                <Text style={styles.toggleText} onPress={toggleLoginSignup}>
                    {isLogin ? 'need an account? sign up' : 'already have an account? log in'}
                </Text>
            </View>
        </View>
    );
};

export default LoginPage;
