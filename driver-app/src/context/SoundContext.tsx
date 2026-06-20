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

    // Prepare audio mode for background playback
    useEffect(() => {
        async function configureAudio() {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    // Use RING stream on Android for max volume (bypasses media volume)
                    shouldDuckAndroid: false,
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
        isPlayingRef.current = true;

        // Stop any currently playing sound first
        await stopAlert();

        // Re-set playing to true since stopAlert sets it to false
        isPlayingRef.current = true;

        console.log(`Attempting to play sound type: ${type}`);

        let source;
        let shouldLoop = false;
        let volume = 1.0;

        if (type === 'RIDE_REQUEST') {
            // Local ride alert - looping at full volume
            source = require('../../assets/sounds/ride_alert.mp3');
            shouldLoop = true;
            volume = 1.0;
        } else if (type === 'ONLINE_POP') {
            source = { uri: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3' };
            shouldLoop = false;
            volume = 0.8;
        } else {
            source = { uri: 'https://cdn.freesound.org/previews/536/536108_10860334-lq.mp3' };
            shouldLoop = false;
            volume = 0.8;
        }

        try {
            isLoadingRef.current = true;
            const { sound } = await Audio.Sound.createAsync(
                source,
                {
                    shouldPlay: false,
                    isLooping: shouldLoop,
                    volume: volume,
                }
            );

            isLoadingRef.current = false;

            // Check if stopAlert was called while we were loading
            if (!isPlayingRef.current) {
                console.log('Stop requested during sound load, unloading.');
                await sound.unloadAsync();
                return;
            }

            soundRef.current = sound;
            await sound.setVolumeAsync(volume);
            await sound.playAsync();
            console.log('Sound playing at full volume');
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
