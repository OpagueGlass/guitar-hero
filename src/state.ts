import {
    State,
    Action,
    NoteCircle,
    Viewport,
    Constants,
    Note,
    PlayNote,
    PlayKey,
    Tail,
    keyToColumn,
    instruments,
} from "./types";
import { not, convertToData } from "./util";
export {
    initialState,
    reduceState,
    Tick,
    AddNoteCircle,
    AddBackgroundNote,
    PressNote,
    Restart,
    EndGame,
    AddTail,
    HoldTail,
};

// Helper function to round the sum of two numbers to one decimal place
const roundedSum = (a: number, b: number) => Math.round((a + b) * 10) / 10;

// Increment the multiplier if the streak is a multiple of 10 and not 0
const isTenStreak = (s: State) => s.streak % 10 === 0 && s.streak !== 0;
const incrementMultiplier = (s: State) =>
    isTenStreak(s)
        ? roundedSum(s.multiplier, Constants.MULTIPLIER_INCREMENT)
        : s.multiplier;

/**
 * Starting state
 */
const initialState: State = {
    gameEnd: false,
    hitScore: Constants.STARTING_SCORE,
    missScore: Constants.STARTING_SCORE,
    multiplier: Constants.DEFAULT_MULTIPLIER,
    streak: Constants.STARTING_STREAK,
    notes: [],
    tails: [],
    exit: [],
    playNotes: [],
    playExit: [],
    startPlay: [],
    stopPlay: [],
};

/**
 * Represents a Tick action that updates the game state based on the tick rate
 */
class Tick implements Action {
    /**
     * Instantiates a new Tick action.
     * @param elapsed The elapsed time from the previous tick.
     */
    constructor(public readonly elapsed: number) {}

    /**
     * Applies the Tick action to the given state, updating the positions of
     * active notes and tails,
     * and handling notes that have crossed the border.
     * @param s The current state of the game.
     * @returns The new state of the game after applying the Tick action.
     */
    apply(s: State): State {
        const isNoteActive = <T extends PlayNote>(c: T) =>
            c.cy <= Viewport.CANVAS_BORDER;
        const isTailActive = (c: Tail) => c.y2 <= Viewport.CANVAS_BORDER;

        const activeCircles = s.notes.filter(isNoteActive);
        const inactiveCircles = s.notes.filter(not(isNoteActive));
        const playNotes = s.playNotes.filter(isNoteActive);
        const playExit = s.playNotes.filter(not(isNoteActive));
        const activeTails = s.tails.filter(isTailActive);
        const inactiveTails = s.tails.filter(not(isTailActive));

        return {
            ...s,
            notes: activeCircles.map(Tick.moveNote),
            tails: activeTails.map(Tick.moveTail),
            exit: [...inactiveCircles, ...inactiveTails],
            playNotes: playNotes.map(Tick.moveNote),
            playExit: playExit,
            startPlay: [],
            stopPlay: inactiveTails.filter((tail) => !tail.hasPlayed),
            missScore: s.missScore + inactiveCircles.length,
            streak: inactiveCircles.length > 0 ? 0 : s.streak,
            multiplier: inactiveCircles.length > 0 ? 1 : s.multiplier,
        };
    }

    /**
     * Moves a note down the canvas
     *
     * @param note The note to move
     * @returns The note with the updated position
     */
    static moveNote = <T extends PlayNote>(note: T): T => ({
        ...note,
        cy: note.cy + Note.SPEED,
    });

    /**
     * Moves a tail down the canvas
     *
     * @param tail The tail to move
     * @returns The tail with the updated position
     */
    static moveTail = (tail: Tail): Tail => {
        const remainingLength = tail.length - Note.SPEED;
        return {
            ...tail,
            length: remainingLength,
            y1:
                tail.y1 < Viewport.CANVAS_BORDER
                    ? tail.y1 + Note.SPEED
                    : tail.y1,
            y2:
                remainingLength > Viewport.CANVAS_BORDER
                    ? 0
                    : Viewport.CANVAS_BORDER - remainingLength,
        };
    };
}

/**
 * Represents an action to add a note circle to the game state
 */
class AddNoteCircle implements Action {
    /**
     * Instantiates a new AddNoteCircle action.
     *
     * @param circle The note circle to add to the game state
     */
    constructor(public readonly circle: NoteCircle) {}

    /**
     * Applies the AddNoteCircle action to the given state, adding the new note
     * circle to the state
     *
     * @param s The current state of the game
     * @returns The updated state with the new note circle added
     */
    apply(s: State): State {
        return { ...s, notes: [...s.notes, this.circle] };
    }
}

/**
 * Represents an action to add a background note to the game state
 */
class AddBackgroundNote implements Action {
    /**
     * Instantiates a new AddBackgroundNote action.
     *
     * @param note The background note to add to the game state
     */
    constructor(public readonly note: PlayNote) {}

    /**
     * Applies the AddBackgroundNote action to the given state, adding the new
     * background note to the state
     *
     * @param s The current state of the game
     * @returns The updated state with the new background note added
     */
    apply(s: State): State {
        return { ...s, playNotes: [...s.playNotes, this.note] };
    }
}

/**
 * Represents an action to add a tail to the game state
 */
class AddTail implements Action {
    /**
     * Instantiates a new AddTail action.
     *
     * @param tail The tail to add to the game state
     */
    constructor(public readonly tail: Tail) {}

    /**
     * The AddTail action to the given state, adding the new tail to the state
     *
     * @param s The current state of the game
     * @returns The updated state with the new tail added
     */
    apply(s: State): State {
        return { ...s, tails: [...s.tails, this.tail] };
    }
}

/**
 * Represents an action to press a note circle
 */
class PressNote implements Action {
    /**
     * Instantiates a new PressNote action.
     *
     * @param key The key being pressed
     */
    constructor(
        public readonly key: PlayKey,
        public readonly randomNum: number,
    ) {}

    /**
     * Applies the PressNote action to the given state, checking if the pressed
     * keys hits, incorrectly aligns or misses with any note circles and
     * updating the state accordingly.
     *
     * @param s The current state of the game.
     * @returns The new state of the game after applying the PressNote action.
     */
    apply(s: State): State {
        const column = keyToColumn[this.key];
        const isInColumn = (circle: NoteCircle) => circle.cx === column;

        const distanceFromBorder = (circle: NoteCircle) =>
            Math.abs(circle.cy - Viewport.CANVAS_BORDER);

        const isInRange = (circle: NoteCircle) => (range: number) =>
            distanceFromBorder(circle) <= range;

        const isInColumnAndRange = (circle: NoteCircle) => (range: number) =>
            isInColumn(circle) && isInRange(circle)(range);

        const hasTail = (tail: Tail) =>
            tail.x1 === column && tail.y1 >= Viewport.CANVAS_BORDER;

        // Incorrectly aligned circle are within twice the radius of the note
        // circle and hit circles are within the radius of the note circle
        const align = (circle: NoteCircle) =>
            isInColumnAndRange(circle)(Note.RADIUS * 2);
        const hit = (circle: NoteCircle) =>
            isInColumnAndRange(circle)(Note.RADIUS);

        // Returns the note circle closest to the border
        const target = (a: NoteCircle, b: NoteCircle) => (a.cy > b.cy ? a : b);

        // Terminate early since there will be no circles if there are tails in
        // the column
        if (s.tails.some(hasTail)) return s;

        const alignCircles = s.notes.filter(align);
        const hitCircles = alignCircles.filter(hit);

        return hitCircles.length > 0
            ? PressNote.handleHit(s, hitCircles.reduce(target))
            : alignCircles.length > 0
              ? PressNote.handleAlign(
                    s,
                    alignCircles.reduce(target),
                    this.randomNum,
                )
              : PressNote.handleMiss(s, this.randomNum);
    }

    /**
     * Handles the case when a note circle is hit.
     *
     * @param s The current state of the game.
     * @param hitCircle The note circle that was hit.
     * @returns The new state of the game after handling the hit note circle.
     */
    static handleHit(s: State, hitCircle: NoteCircle) {
        const other = (circle: NoteCircle) => circle.id !== hitCircle.id;
        // Updates the state without updating the score or multiplier
        if (hitCircle.hasTail) {
            return {
                ...s,
                notes: s.notes.filter(other),
                exit: [...s.exit, hitCircle],
                startPlay: [...s.startPlay, hitCircle],
            };
        }
        return {
            ...s,
            notes: s.notes.filter(other),
            exit: [...s.exit, hitCircle],
            playExit: [...s.playExit, hitCircle],
            hitScore: roundedSum(s.hitScore, s.multiplier),
            multiplier: incrementMultiplier(s),
            streak: s.streak + 1,
        };
    }

    /**
     * Handles the case when a note circle is incorrectly aligned.
     *
     * @param s The current state of the game.
     * @param alignCircle The note circle that was incorrectly aligned.
     * @returns The new state of the game after handling the incorrectly aligned
     *          note circle.
     */
    static handleAlign(s: State, alignCircle: NoteCircle, randomNum: number) {
        const other = (circle: NoteCircle) => circle.id !== alignCircle.id;
        // Updates the state without updating the score or multiplier
        if (alignCircle.hasTail) {
            return {
                ...s,
                notes: s.notes.filter(other),
                exit: [...s.exit, alignCircle],
                startPlay: [...s.startPlay, alignCircle],
            };
        }
        // Create a new note circle object with a random duration
        const randomDuration = randomNum / 2;
        const note = { ...alignCircle, start: 0, end: randomDuration };
        return {
            ...s,
            notes: s.notes.filter(other),
            exit: [...s.exit, alignCircle],
            playExit: [...s.playExit, note],
            hitScore: roundedSum(s.hitScore, s.multiplier),
        };
    }

    /**
     * Handles the case when a note circle is missed
     *
     * @param s The current state of the game
     * @returns The new state of the game after handling a miss
     */
    static handleMiss(s: State, randomNum: number) {
        // Generate a random note and adds it to the state
        const index = Math.abs(Math.ceil(randomNum * instruments.length) - 1);
        const instrument = instruments[index];
        const vel = Constants.DEFAULT_VELOCITY;
        const pitch = Math.floor(randomNum * Constants.MIDI_MAX_VALUE * 0.75);
        const duration = randomNum / 2;

        const data = convertToData(false, instrument, vel, pitch, 0, duration);
        return {
            ...s,
            playExit: [...s.playExit, data],
        };
    }
}

/**
 * Represents an action to hold a tail
 */
class HoldTail implements Action {
    /**
     * Instantiates a new HoldTail action.
     *
     * @param key The key being held
     */
    constructor(public readonly key: PlayKey) {}

    /**
     * Applies the HoldTail action to the given state, checking if the held key
     * aligns or leaves with any tail
     *
     * @param s The current state of the game
     * @returns The new state of the game after applying the HoldTail action
     */
    apply(s: State): State {
        const column = keyToColumn[this.key];
        const isInColumn = (tail: Tail) => tail.x1 === column;

        const distanceFromBorder = (pos: number) =>
            Math.abs(pos - Viewport.CANVAS_BORDER);

        const isInRange = (pos: number) =>
            distanceFromBorder(pos) <= Note.RADIUS * 2;

        // Checks if there is an unplayed tail
        const hasUnplayedTail = (tails: Tail[]) =>
            tails.length > 0 && !tails[0].hasPlayed;

        const played = (tail: Tail) => ({ ...tail, hasPlayed: true });

        // Leave tails are at the border and have finished playing whereas
        // aligned tails are at the border but have not finished playing
        const align = (tail: Tail) => isInColumn(tail) && isInRange(tail.y1);
        const leave = (tail: Tail) => isInColumn(tail) && isInRange(tail.y2);

        const columnTails = s.tails.filter(isInColumn);

        // Terminate early if there are no tails in the column
        if (columnTails.length === 0) return s;

        const alignTail = columnTails.filter(align);
        const leaveTail = columnTails.filter(leave);

        // If there is a leaving unplayed tail, stop playing it and update the
        // score
        if (hasUnplayedTail(leaveTail)) {
            const unplayedTails = s.tails.filter(not(leave));
            const playedTail = leaveTail.map(played);
            return {
                ...s,
                tails: [...unplayedTails, ...playedTail],
                stopPlay: [...s.stopPlay, ...leaveTail],
                hitScore: roundedSum(s.hitScore, s.multiplier),
                multiplier: incrementMultiplier(s),
            };
        }
        // If there is an aligned unplayed tail, only stop playing it
        else if (hasUnplayedTail(alignTail)) {
            const unplayedTails = s.tails.filter(not(align));
            const playedTails = alignTail.map(played);
            return {
                ...s,
                tails: [...unplayedTails, ...playedTails],
                stopPlay: [...s.stopPlay, ...alignTail],
            };
        }
        // No aligned or leaving tails
        return s;
    }
}

/**
 * Represents an action to restart the game
 */
class Restart implements Action {
    /**
     * Instantiates a new Restart action.
     */
    constructor() {}
    /**
     * Applies the Restart action to the given state, resetting the game state
     * to its initial state by removing all notes and tails and stop playing all
     * tails.
     *
     * @param s The current state of the game.
     * @returns The new state of the game after applying the Restart action.
     */
    apply(s: State): State {
        return {
            ...initialState,
            exit: [...s.exit, ...s.notes, ...s.tails],
            stopPlay: s.tails,
        };
    }
}

/**
 * Represents an action to end the game
 */
class EndGame implements Action {
    /**
     * Instantiates a new EndGame action.
     */
    constructor() {}
    /**
     * Applies the EndGame action to the given state, ending the game.
     *
     * @param s The current state of the game
     * @returns The new state of the game after applying the EndGame action
     */
    apply(s: State): State {
        return { ...s, gameEnd: true};
    }
}

/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State
 */
const reduceState = (s: State, action: Action) => action.apply(s);
