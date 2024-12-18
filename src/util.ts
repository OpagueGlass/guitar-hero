// Utility functions and definitions
import { SampleLibrary } from "./tonejs-instruments";
import { Constants, Data } from "./types";
import * as Tone from "tone";

export {
    not,
    samples,
    attr,
    isNotNullOrUndefined,
    playNote,
    RNG,
    triggerTailNote,
    releaseTailNote,
    convertToData,
    getHighScore,
};

/**
 * Load the samples from the SampleLibrary
 */
const samples = SampleLibrary.load({
    instruments: [
        "bass-electric",
        "bassoon",
        "cello",
        "clarinet",
        "contrabass",
        "flute",
        "french-horn",
        "guitar-acoustic",
        "guitar-electric",
        "guitar-nylon",
        "harmonium",
        "harp",
        "organ",
        "piano",
        "saxophone",
        "trombone",
        "trumpet",
        "tuba",
        "violin",
        "xylophone",
    ],
    baseUrl: "samples/",
});

/**
 * Plays a note with the given data
 *
 * @param data The data to play
 */
function playNote(data: Data) {
    samples[data.instrument].triggerAttackRelease(
        Tone.Frequency(data.pitch, "midi").toNote(),
        data.end - data.start,
        undefined,
        data.velocity,
    );
}

/**
 * Starts playing with the given data
 *
 * @param data The data to trigger the attack
 */
function triggerTailNote(data: Data) {
    samples[data.instrument].triggerAttack(
        Tone.Frequency(data.pitch, "midi").toNote(),
        undefined,
        data.velocity,
    );
}

/**
 * Stops playing with the given data
 *
 * @param data The data to release the
 */
function releaseTailNote(data: Data) {
    samples[data.instrument].triggerRelease(
        Tone.Frequency(data.pitch, "midi").toNote(),
    );
}

/**
 * Gets the last high score from the sidebar
 */ 
const getLastScore = (str: string | null) => Number(str) || 0;

/**
 * Gets the current high score
 */
const getHighScore = (str: string | null, score: number) =>
    String(Math.max(getLastScore(str), score));

/**
 * Converts the given data to a Data object
 */
const convertToData = (
    userPlayed: boolean,
    instrument: string,
    velocity: number,
    pitch: number,
    start: number,
    end: number,
): Data => ({
    userPlayed: userPlayed,
    instrument: instrument,
    velocity: velocity / Constants.MIDI_MAX_VALUE,
    pitch: pitch,
    start: start,
    end: end,
});

/**
 * Composable not: invert boolean result of given function
 * @param f a function returning boolean
 * @param x the value that will be tested with f
 */
const not =
    <T>(f: (x: T) => boolean) =>
    (x: T) =>
        !f(x);

/**
 * set a number of attributes on an Element at once
 * @param e the Element
 * @param o a property bag
 */
const attr = (e: Element, o: { [p: string]: unknown }) => {
    for (const k in o) e.setAttribute(k, String(o[k]));
};

/**
 * Type guard for use in filters
 * @param input something that might be null or undefined
 */
function isNotNullOrUndefined<T extends object>(
    input: null | undefined | T,
): input is T {
    return input != null;
}

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 */
abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
 h    * Takes hash value and scales it to the range [-1, 1]
     */
    public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;
}
