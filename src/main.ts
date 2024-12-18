import "./style.css";

import {
    from,
    fromEvent,
    interval,
    merge,
    Observable,
    of,
    partition,
} from "rxjs";
import {
    map,
    filter,
    scan,
    mergeMap,
    delay,
    take,
    skip,
    switchMap,
    startWith,
} from "rxjs/operators";
import * as Tone from "tone";
import {
    Key,
    Constants,
    Note,
    Data,
    Action,
    NoteCircle,
    Colour,
    PlayNote,
    Viewport,
    Tail,
    PlayKey,
    colours,
    keyToSeed,
    Event,
} from "./types";
import {
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
} from "./state";
import { updateView } from "./view";
import { samples, convertToData, RNG } from "./util";

/**
 * Creates an observable of keyboard events
 * 
 * @param e The keyboard event to listen for
 * @returns An observable of the keyboard event
 */
const keyEvent$ = (e: Event) => (keyCode: Key) =>
    fromEvent<KeyboardEvent>(document, e).pipe(
        filter(({ code }) => code === keyCode),
    );

/**
 * This is the function called on page load. The main game loop
 * is called here.
 */
export function main(csv_contents: string) {
    // Finds the min and max pitch values of a given array of data
    const getMinMax = (dataArr: Data[]) =>
        dataArr.reduce(
            (acc, data) =>
                ({
                    min: Math.min(acc.min, data.pitch),
                    max: Math.max(acc.max, data.pitch),
                }) as const,
            { min: dataArr[0].pitch, max: dataArr[0].pitch } as const,
        );

    // Scales the pitch values to the four columns
    const scaleToColumn =
        ({ min, max }: Readonly<{ min: number; max: number }>) =>
        (data: Data): number =>
            Math.floor(((data.pitch - min) / (max - min + 1)) * 4) + 1;

    // Parse a line of the CSV file
    const parseLine = (line: string) => {
        const [userPlayed, instrument, velocity, pitch, start, stop] =
            line.split(",");
        return convertToData(
            userPlayed === "True",
            instrument,
            Number(velocity),
            Number(pitch),
            Number(start),
            Number(stop),
        );
    };

    /** Parse the CSV file */
    const notes = csv_contents.trim().split("\n").slice(1).map(parseLine);

    // Calculate the end time of the game with 100ms buffer
    const endTime =
        notes[notes.length - 1].end * 1000 +
        (Viewport.CANVAS_BORDER * Constants.TICK_RATE_MS) / Note.SPEED;

    // Get the column of a note based on its pitch
    const getColumn = scaleToColumn(
        getMinMax(notes.filter((data) => data.userPlayed)),
    );

    // Get the colour of a note based on its column
    const getColour = (data: Data): Colour => colours[getColumn(data) - 1];

    // Create a note circle based on the data
    const createNoteCircle =
        (data: Data) =>
        (id: number): NoteCircle => {
            return {
                ...data,
                r: Note.RADIUS,
                cx: `${20 * getColumn(data)}%`,
                cy: 0,
                style: `fill: ${getColour(data)}`,
                class: "shadow",
                id: `circle${id}`,
                hasTail: data.end - data.start > 1,
            };
        };

    // Create a tail based on the note circle
    const createTail = (circle: NoteCircle): Tail => {
        const tailLength =
            ((circle.end - circle.start) * 1000 * Note.SPEED) /
                Constants.TICK_RATE_MS +
            Viewport.CANVAS_BORDER;
        return {
            userPlayed: circle.userPlayed,
            instrument: circle.instrument,
            velocity: circle.velocity,
            pitch: circle.pitch,
            start: circle.start,
            end: circle.end,
            y1: circle.cy,
            y2:
                tailLength > Viewport.CANVAS_BORDER
                    ? 0
                    : Viewport.CANVAS_BORDER - tailLength,
            x1: circle.cx,
            x2: circle.cx,
            id: `${circle.id}tail`,
            style:
                `stroke: ${getColour(circle)} ;` +
                `stroke-width: ${Note.TAIL_WIDTH}`,
            length: tailLength,
            hasPlayed: false,
        };
    };

    // Create a play note based on the data
    const createPlayNote = (data: Data): PlayNote => {
        return {
            ...data,
            cy: 0,
        };
    };

    /** Create the streams */

    // Delay the notes based on their start time and split them into player and
    // hidden notes
    const notes$ = from(notes).pipe(
        mergeMap((data) => of(data).pipe(delay(data.start * 1000))),
    );

    const [playerNotes$, backgroundNotes$] = partition(
        notes$,
        (data) => data.userPlayed,
    );

    // Create note circles stream for the player notes
    const noteCircle$ = playerNotes$.pipe(
        map((data, id) => createNoteCircle(data)(id)),
    );

    const addNoteCircle$ = noteCircle$.pipe(
        map((circle) => new AddNoteCircle(circle)),
    );

    // Create background notes stream
    const addBackgroundNote$ = backgroundNotes$.pipe(
        map(createPlayNote),
        map((note) => new AddBackgroundNote(note)),
    );

    // Create tail stream for the notes with tails
    const addTail$ = noteCircle$.pipe(
        filter((c) => c.hasTail),
        map(createTail),
        map((tail) => new AddTail(tail)),
    );

    /** User input */

    // Create streams for HoldTail actions
    const fromKeyUpDownAction = (keyCode: PlayKey) =>
        keyEvent$("keydown")(keyCode).pipe(
            filter(({ repeat }) => !repeat),
            mergeMap((_) =>
                keyEvent$("keyup")(keyCode).pipe(
                    filter(({ repeat }) => !repeat),
                    take(1),
                    map((_) => new HoldTail(keyCode)),
                ),
            ),
        );

    // Create streams for the PressNote actions with random values
    const fromKeyPressAction = (keyCode: PlayKey) =>
        keyEvent$("keypress")(keyCode).pipe(
            scan((acc: number) => RNG.hash(acc), keyToSeed[keyCode]),
            map((random: number) => Math.abs(RNG.scale(random))),
            map((scaledRandom: number) => new PressNote(keyCode, scaledRandom)),
        );

    // Streams for the user input
    const green$ = fromKeyPressAction("KeyH"),
        red$ = fromKeyPressAction("KeyJ"),
        blue$ = fromKeyPressAction("KeyK"),
        yellow$ = fromKeyPressAction("KeyL"),
        greenTail$ = fromKeyUpDownAction("KeyH"),
        redTail$ = fromKeyUpDownAction("KeyJ"),
        blueTail$ = fromKeyUpDownAction("KeyK"),
        yellowTail$ = fromKeyUpDownAction("KeyL");

    const restart$ = keyEvent$("keypress")("KeyR").pipe(
        map((_) => new Restart()),
    );

    /**
     *  The main game stream pipeline
     */
    const tick$ = interval(Constants.TICK_RATE_MS),
        end$ = tick$.pipe(
            skip(Math.ceil(endTime / Constants.TICK_RATE_MS)),
            map((_) => new EndGame()),
        ),
        gameClock$: Observable<Action> = tick$.pipe(
            map((elapsed) => new Tick(elapsed)),
        ),
        actions$: Observable<Action> = merge(
            addNoteCircle$,
            gameClock$,
            addBackgroundNote$,
            addTail$,
            green$,
            red$,
            blue$,
            yellow$,
            greenTail$,
            redTail$,
            blueTail$,
            yellowTail$,
            restart$,
            end$,
        ),
        state$ = actions$.pipe(scan(reduceState, initialState));

    const subscription$ = restart$.pipe(
        mergeMap((_) => of(null).pipe(delay(1))),
        startWith(null),
        switchMap((_) => state$),
    );

    subscription$.subscribe(updateView());
}

/**
 * Display key mapping with live highlighting of the currently depressed key
 */
function showKeys() {
    function showKey(k: Key) {
        const arrowKey = document.getElementById(k)!;
        keyEvent$("keydown")(k).subscribe((_) =>
            arrowKey.classList.add("highlight"),
        );
        keyEvent$("keyup")(k).subscribe((_) =>
            arrowKey.classList.remove("highlight"),
        );
    }
    showKey("KeyH");
    showKey("KeyJ");
    showKey("KeyK");
    showKey("KeyL");
    showKey("KeyR");
}

// The following simply runs the main function on window load.
if (typeof window !== "undefined") {
    // Load in the instruments and then starts the game!
    const start_game = (contents: string) => {
        document.body.addEventListener(
            "mousedown",
            function () {
                main(contents);
                showKeys();
            },
            { once: true },
        );
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        for (const instrument in samples) {
            samples[instrument].toDestination();
            samples[instrument].release = 0.5;
        }
        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then((text) => start_game(text))
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
    });
}
