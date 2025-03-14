import './fonts.css';
import { StyleSheet } from 'react-native';

const textStyles = {
    fontFamily: 'Jost',
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffd8e6',
    },

    cardContainer: {
        margin: 10,
        padding: 20,
        backgroundColor: '#fff',
        width: '90%',
        alignSelf: 'center',
        alignContent: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    cardContainerImage: {
        height: 70,
        width: 70,
        borderRadius: 10,
        marginRight: 20,
        borderColor: '#ffe8d6',
        borderWidth: 1,
    },

    cardContainerImagePlaceholder: {
        height: 70,
        width: 70,
        borderRadius: 10,
        marginRight: 20,
        backgroundColor: '#ffe8d6',
        borderWidth: 1,
    },

    cardContainerText: {
        fontSize: 25,
        ...textStyles,
        textAlignVertical: 'center',
        marginRight: 2,
    },

    addHabitContainer: {
        margin: 10,
        padding: 20,
        backgroundColor: '#fff',
        width: '90%',
        alignSelf: 'center',
        borderRadius: 10,
        height: '60%',
    },

    greenContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#b7b7a4',
    },

    authContainer: {
        width: '80%',
        maxWidth: 400,
        backgroundColor: '#cb997e',
        padding: 16,
        borderRadius: 8,
        alignSelf: 'center',
        marginVertical: "50%"
    },

    title: {
        fontSize: 30,
        marginBottom: 25,
        textAlign: 'center',
        color: '#ffe8d6',
        ...textStyles,
    },

    title2: {
        fontSize: 30,
        marginBottom: 25,
        textAlign: 'center',
        color: '#ffe8d6',
        ...textStyles,
    },

    input: {
        height: 40,
        width: '90%',
        backgroundColor: '#ddbea9',
        borderColor: '#ffe8d6',
        borderWidth: 1,
        padding: 10,
        borderRadius: 20,
        alignSelf: 'center',
    },

    imageContainer: {
        flex: 1,
        margin: 2,
        aspectRatio: 1,
    },
    
    image: {
        width: '100%',
        height: '100%',
    },

    buttonContainer: {
        margin: 16,
    },

    buttonContainer2: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
    },

    button: {
        backgroundColor: '#6b705c',
        borderRadius: 50,
        alignItems: 'center',
        paddingVertical: 10,
    },

    saveButton: {
        backgroundColor: '#6b705c',
        borderRadius: 50,
        alignItems: 'center',
        alignSelf: 'center',
        display: 'flex',
        margin: 10,
        paddingHorizontal: 30,
        paddingVertical: 10,
    },

    cancelButton: {
        backgroundColor: '#cb997e',
        borderRadius: 50,
        alignItems: 'center',
        alignSelf: 'center',
        display: 'flex',
        margin: 10,
        paddingHorizontal: 30,
        paddingVertical: 10,
    },

    buttonText: {
        color: '#fff',
        fontSize: 20,
        ...textStyles,
    },

    labelText: {
        textAlign: 'left',
        marginBottom: 5,
        marginLeft: '5%',
        ...textStyles,
    },

    toggleText: {
        color: '#ddbea9',
        textAlign: 'center',
    },

    bottomContainer: {
        marginBottom: 20,
    },

    emailText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        ...textStyles,
    },

    dialogBox: {
        marginVertical: 20,
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: 'white',
        borderRadius: 20,
        width: '80%',
        alignSelf: 'center',
    },

    textContainer: {
        flex: 1,
    },

    arrowButton: {
        padding: 10,
        alignItems: 'center',
    },

    streakContainer: {
        padding: 20,
        alignItems: 'left',
    },

    streakText: {
        fontSize: 14,
        fontWeight: 'bold',
        ...textStyles,
    },

    streakBar: {
        height: 14,
        width: '50%',
        backgroundColor: '#fefae0',
        borderRadius: 5,
        borderColor: '#d4a373',
        borderWidth: 0.5,
        overflow: 'hidden',
        marginVertical: 10,
    },

    deleteButton: {
        position: "absolute",
        top: "60%",
        right: "35%",
        backgroundColor: "transparent",
    },

    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 50,
        marginBottom: 10,
        width: "92%",
        height: 40,
        alignSelf: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    
});

export default styles;