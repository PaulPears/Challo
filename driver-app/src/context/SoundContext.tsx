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

    const stopAlert = async () => {
        if (soundRef.current) {
            try {
                console.log('Stopping sound');
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            } catch (e) {
                console.log('Error stopping sound:', e);
            }
        }
    };

    const playAlert = async (type: SoundType) => {
        // Stop any currently playing sound first
        await stopAlert();

        console.log(`Attempting to play sound type: ${type}`);

        let source;
        let shouldLoop = false;

        if (type === 'RIDE_REQUEST') {
            // Loud Alarm / Siren
            source = { uri: 'https://cdn.freesound.org/previews/219/219244_4082826-lq.mp3' };
            shouldLoop = true;
        } else if (type === 'ONLINE_POP') {
            // Pop sound for going online
            source = { uri: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3' };
            shouldLoop = false;
        } else {
            // Standard notification ping
            source = { uri: 'https://cdn.freesound.org/previews/536/536108_10860334-lq.mp3' };
            shouldLoop = false;
        }

        try {
            const { sound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: true, isLooping: shouldLoop }
            );
            soundRef.current = sound;
            console.log('Sound playing');
        } catch (error) {
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
