// Update the view according to the given State.
// All dependencies on SVG and HTML are isolated to this file.
export { updateView };
import { NoteCircle, State, Tail, Body } from "./types";
import { Viewport, Shape } from "./types";
import {
    attr,
    isNotNullOrUndefined,
    playNote,
    triggerTailNote,
    releaseTailNote,
    getHighScore,
} from "./util";

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");

/**
 * Update the SVG game view.
 *
 * @param s the current game model State
 * @returns void
 */
function updateView() {
    return function (s: State): void {
        const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
                HTMLElement,
            preview = document.querySelector(
                "#svgPreview",
            ) as SVGGraphicsElement & HTMLElement,
            gameover = document.querySelector(
                "#gameOver",
            ) as SVGGraphicsElement & HTMLElement,
            container = document.querySelector("#main") as HTMLElement;

        svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
        svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

        // Text fields
        const multiplier = document.querySelector(
            "#multiplierText",
        ) as HTMLElement;
        const scoreText = document.querySelector("#scoreText") as HTMLElement;
        const highScoreText = document.querySelector(
            "#highScoreText",
        ) as HTMLElement;

        /**
         * Renders the current state to the canvas.
         *
         * In MVC terms, this updates the View using the Model.
         *
         * @param s Current state
         */
        const render = (s: State) => {
            // Create a new SVG element for the body
            const createBodyView =
                (rootSVG: HTMLElement) => (shape: Shape) => (body: Body) => {
                    const e = document.createElementNS(
                        rootSVG.namespaceURI,
                        shape,
                    );
                    attr(e, body);
                    rootSVG.appendChild(e);
                    return e;
                };

            // Update the circle and tail view
            const updateCircleView =
                (rootSVG: HTMLElement) => (note: NoteCircle) => {
                    const createCircleView = createBodyView(rootSVG)("circle");
                    const e =
                        document.getElementById(note.id) ||
                        createCircleView(note);
                    attr(e, { cy: note.cy });
                };

            const updateTailView = (rootSVG: HTMLElement) => (tail: Tail) => {
                const createTailView = createBodyView(rootSVG)("line");
                const e =
                    document.getElementById(tail.id) || createTailView(tail);
                attr(e, { y1: tail.y1, y2: tail.y2 });
            };

            // Update elements in the canvas
            s.notes.forEach(updateCircleView(svg));
            s.tails.forEach(updateTailView(svg));

            scoreText.textContent = String(s.hitScore);
            multiplier.textContent = `x${s.multiplier}`;
        };

        render(s);

        // Play the notes
        s.playExit.forEach(playNote);
        s.startPlay.forEach(triggerTailNote);
        s.stopPlay.forEach(releaseTailNote);

        // Remove elements that have exited the canvas
        s.exit
            .map((body) => {
                return document.getElementById(body.id);
            })
            .filter(isNotNullOrUndefined)
            .forEach((body) => {
                try {
                    svg.removeChild(body);
                } catch (e) {
                    // rarely it can happen that a circle or tail can be in
                    // exit for both expiring and colliding in the same
                    //tick, which will cause this exception
                    console.log("Already removed: " + body.id);
                }
            });

        if (s.gameEnd) {
            show(gameover);
            highScoreText.textContent = getHighScore(
                highScoreText.textContent,
                s.hitScore,
            );
        } else {
            hide(gameover);
        }
    };
}
