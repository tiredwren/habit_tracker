import { Link, router, useRouter } from "expo-router"; 
import { useEffect, useState } from "react"; 
import { SafeAreaView, Dimensions, View, Text, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native"; 
import * as ImagePicker from "expo-image-picker"; 
import { db } from "./firebaseConfig"; 
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"; 
import styles from "../assets/styles/styles"; 
import { useLocalSearchParams } from "expo-router/build/hooks"; 

const LogProgress = () => { 
    const [newProgress, setProgressLog] = useState({ reflection: "", image: null, inputType: "text", numericInput: "" }); 
    const [progressLogs, setProgressLogs] = useState([]); 
    const [editingLogId, setEditingLogId] = useState(null); 
    const userId = "user_id";  
    const { width } = Dimensions.get('window'); 
    const router = useRouter(); 
    const params = useLocalSearchParams(); 
    const habitRef = params.habitRef;  

    const handleInputChange = (field, value) => { 
        setProgressLog({ ...newProgress, [field]: value }); 
    }; 

    const handleImageUpload = async () => { 
        let result = await ImagePicker.launchImageLibraryAsync({ 
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true, 
            aspect: [4, 3], 
            quality: 1, 
        }); 

        if (!result.canceled) { 
            setProgressLog({ ...newProgress, image: result.assets[0].uri }); 
        } 
    }; 

    const saveProgressLog = async () => {
        if (newProgress.reflection || newProgress.numericInput || newProgress.image) {
            try {
                const currentDate = new Date().toISOString().split("T")[0];
                const progressRef = doc(db, "users", userId, "habits", habitRef, "progress", currentDate);

                if (editingLogId) {
                    const editingLogRef = doc(db, "users", userId, "habits", habitRef, "progress", editingLogId);
                    await setDoc(editingLogRef, {
                        reflection: newProgress.reflection,
                        image: newProgress.image,
                        inputType: newProgress.inputType,
                        numericInput: newProgress.numericInput,
                    }, { merge: true });
                    setEditingLogId(null); 
                } else {
                    const newLogRef = doc(collection(db, "users", userId, "habits", habitRef, "progress"));
                    await setDoc(newLogRef, {
                        date: currentDate,
                        reflection: newProgress.reflection,
                        image: newProgress.image,
                        inputType: newProgress.inputType,
                        numericInput: newProgress.numericInput,
                    });
                }

                setProgressLog({ reflection: "", image: null, inputType: "text", numericInput: "" });
                fetchProgressLogs();
            } catch (error) {
                alert("Error saving progress: " + error.message);
            }
        } else {
            alert("Make sure you've filled at least one field!");
        }
    };
    
    const fetchProgressLogs = async () => { 
        const currentDate = new Date().toISOString().split("T")[0]; 
        const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
        const q = query(progressRef, where("date", "==", currentDate));

        const querySnapshot = await getDocs(q);
        const logs = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        setProgressLogs(logs);
    };

    useEffect(() => { 
        fetchProgressLogs(); 
    }, [habitRef]); 

    const handleLogSelect = (log) => {
        setProgressLog({ reflection: log.reflection, image: log.image, inputType: log.inputType, numericInput: log.numericInput });
        setEditingLogId(log.id); 
    };

    return ( 
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", width: width }}> 
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={[styles.dialogBox, { position: "absolute", top: "0%", height: "87%", width: "100%", padding: 20 }]} 
            > 
                <Text style={[styles.title2, {color: "#b7b7a4", marginBottom: 0}]}>l o g   p r o g r e s s</Text> 
                <Link 
                    style={[styles.buttonText, {color: "#000", alignSelf:"center"}]} 
                    href={{ pathname:"/progress", params: { habitId: habitRef } }}>see progress</Link>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{marginBottom: 1}}> 
                        <View style={styles.addHabitContainer}> 
                            {newProgress.image && ( 
                                <Image 
                                    source={{ uri: newProgress.image }} 
                                    style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }} 
                                /> 
                            )} 
                            <View style={styles.buttonContainer}> 
                                <TouchableOpacity style={styles.button} onPress={handleImageUpload}> 
                                    <Text style={styles.buttonText}>upload image</Text> 
                                </TouchableOpacity> 
                            </View> 
                            <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>reflection</Text> 
                            <TextInput  
                                multiline={true} 
                                value={newProgress.reflection} 
                                onChangeText={(text) => handleInputChange("reflection", text)} 
                                style={[styles.input, { color: "#000", minHeight: 170, textAlignVertical: "top" }]} 
                            /> 

                            {/* New Input Type Field */}
                            <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>input type</Text>
                            <TextInput
                                value={newProgress.inputType}
                                onChangeText={(text) => handleInputChange("inputType", text)}
                                placeholder="Enter input type (number/checkbox)"
                                style={[styles.input, { color: "#000", minHeight: 40 }]}
                            />

                            {/* Conditionally render numeric input field based on input type */}
                            {newProgress.inputType === "number" && (
                                <>
                                    <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>numeric input</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={newProgress.numericInput}
                                        onChangeText={(text) => handleInputChange("numericInput", text)}
                                        style={[styles.input, { color: "#000", minHeight: 40 }]}
                                    />
                                </>
                            )}

                            {/* display all of day's progress logs */}
                            { progressLogs.length > 0 && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.title, {color: "#000", marginBottom: 0, marginTop: 20 }]}>other logs from today</Text>
                                <Text style={[styles.labelText, {color: "#000", marginLeft: 0, marginBottom: 0, marginTop: 20, textAlign: "center" }]}>click on one to edit it, or fill out a new log above</Text>
                                {progressLogs.map(log => (
                                    <TouchableOpacity 
                                        key={log.id} 
                                        style={[styles.cardContainer, {borderWidth: 1,}]}
                                        onPress={() => handleLogSelect(log)}
                                    >
                                        <Text style={styles.logText}>{log.reflection}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            )}

                            <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: "30%", marginTop: "40%" }}> 
                                <View style={styles.buttonContainer2}> 
                                    <TouchableOpacity style={styles.saveButton} onPress={saveProgressLog}> 
                                        <Text style={styles.buttonText}>save</Text> 
                                    </TouchableOpacity> 
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}> 
                                        <Text style={styles.buttonText}>cancel</Text> 
                                    </TouchableOpacity> 
                                </View> 
                            </View>
                        </View> 
                    </ScrollView> 
                </TouchableWithoutFeedback> 
            </KeyboardAvoidingView> 
        </SafeAreaView> 
    ); 
} 

export default LogProgress; 
