export {
    Constants,
    Viewport,
    Note,
    colours,
    keyToColumn,
    instruments,
    keyToSeed,
};
export type {
    Key,
    Event,
    State,
    Action,
    Data,
    NoteCircle,
    Colour,
    PlayNote,
    PlayKey,
    Tail,
    Shape,
    Body,
};

/**
 * Constants
 */
const Constants = {
    TICK_RATE_MS: 5,
    SONG_NAME: "RockinRobin", // Change this to the name of the song
    MIDI_MAX_VALUE: 127,
    DEFAULT_MULTIPLIER: 1,
    DEFAULT_VELOCITY: 8,
    STARTING_SCORE: 0,
    STARTING_STREAK: 0,
    MULTIPLIER_INCREMENT: 0.2,
} as const;

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    CANVAS_BORDER: 350,
} as const;

const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
    SPEED: 1,
} as const;

const colours = ["limegreen", "red", "blue", "yellow"] as const;

const keyToColumn = {
    KeyH: "20%",
    KeyJ: "40%",
    KeyK: "60%",
    KeyL: "80%",
} as const;

const keyToSeed = {
    KeyH: 0,
    KeyJ: 1,
    KeyK: 2,
    KeyL: 3,
} as const;

const instruments = [
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
] as const;

/**
 * Type definitions
 */

// User input
type Key = PlayKey | "KeyR";

// Play Input
type PlayKey = "KeyH" | "KeyJ" | "KeyK" | "KeyL";
type Event = "keydown" | "keyup" | "keypress";

// Circle and Tail Attributes
type Colour = "limegreen" | "red" | "blue" | "yellow";
type Style = `fill: ${Colour}`;
type ClassType = "shadow";
type XCor = `${number}%`;
type Shape = "circle" | "line";

type Data = Readonly<{
    userPlayed: boolean;
    instrument: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
}>;

interface ID {
    id: string;
}

interface IPlayNote extends Data {
    cy: number;
}

interface INoteCircle extends IPlayNote, ID {
    r: number;
    cx: XCor;
    style: Style;
    class: ClassType;
    hasTail: boolean;
}

interface ITail extends Data, ID {
    y1: number;
    y2: number;
    x1: XCor;
    x2: XCor;
    style: string;
    length: number;
    hasPlayed: boolean;
}

type Tail = Readonly<ITail>;
type PlayNote = Readonly<IPlayNote>;
type NoteCircle = Readonly<INoteCircle>;
type Body = Tail | NoteCircle;

type State = Readonly<{
    gameEnd: boolean;
    hitScore: number;
    missScore: number;
    multiplier: number;
    streak: number;
    notes: ReadonlyArray<NoteCircle>;
    tails: ReadonlyArray<Tail>;
    exit: ReadonlyArray<ID>;
    playNotes: ReadonlyArray<PlayNote>;
    playExit: ReadonlyArray<Data>;
    startPlay: ReadonlyArray<Data>;
    stopPlay: ReadonlyArray<Data>;
}>;

/**
 * Actions modify state
 */
interface Action {
    apply(s: State): State;
}
