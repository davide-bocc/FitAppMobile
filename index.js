import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Expo compatibility
registerRootComponent(App);

// React Native integration (must match MainActivity)
AppRegistry.registerComponent("FitApp", () => App);
