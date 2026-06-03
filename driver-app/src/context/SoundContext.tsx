import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

type SoundType = 'RIDE_REQUEST' | 'NOTIFICATION' | 'ONLINE_POP';

interface SoundContextType {
    playAlert: (type: SoundType) => Promise<void>;
    stopAlert: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
    const soundRef = useRef<Audio.Sound | null>(null);

    console.log('SoundProvider initialized');

    // Prepare audio mode for background playback
    useEffect(() => {
        async function configureAudio() {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
            } catch (e) {
                console.warn('Error configuring audio mode:', e);
            }
        }
        configureAudio();
    }, []);

    const isPlayingRef = useRef(false);
    const isLoadingRef = useRef(false);

    const stopAlert = async () => {
        isPlayingRef.current = false;
        if (soundRef.current) {
            const soundInstance = soundRef.current;
            soundRef.current = null; // Clear immediately to prevent duplicate stop/unload calls
            try {
                console.log('Stopping sound');
                await soundInstance.stopAsync();
                await soundInstance.unloadAsync();
            } catch (e) {
                console.log('Error stopping sound:', e);
            }
        }
    };

    const playAlert = async (type: SoundType) => {
        // If already loading or playing this specific alert, we might want to skip 
        // but for now, let's just ensure we stop any previous one properly.
        isPlayingRef.current = true;
        
        // Stop any currently playing sound first
        await stopAlert();
        
        // Re-set playing to true since stopAlert sets it to false
        isPlayingRef.current = true;

        console.log(`Attempting to play sound type: ${type}`);

        let source;
        let shouldLoop = false;

        if (type === 'RIDE_REQUEST') {
            source = require('../../assets/sounds/ride_alert.mp3');
            shouldLoop = true;
        } else if (type === 'ONLINE_POP') {
            source = { uri: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3' };
            shouldLoop = false;
        } else {
            source = { uri: 'https://cdn.freesound.org/previews/536/536108_10860334-lq.mp3' };
            shouldLoop = false;
        }

        try {
            isLoadingRef.current = true;
            const { sound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: false, isLooping: shouldLoop }
            );
            
            isLoadingRef.current = false;
            
            // Check if stopAlert was called while we were loading
            if (!isPlayingRef.current) {
                console.log('Stop requested during sound load, unloading.');
                await sound.unloadAsync();
                return;
            }

            soundRef.current = sound;
            await sound.playAsync();
            console.log('Sound playing');
        } catch (error) {
            isLoadingRef.current = false;
            console.error("Failed to play sound", error);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAlert();
        };
    }, []);

    return (
        <SoundContext.Provider value={{ playAlert, stopAlert }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
