import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createSessionStorage } from './session-storage';

const storage = createSessionStorage(Platform.OS, SecureStore, AsyncStorage);

export const { getItem, setItem, removeItem } = storage;
