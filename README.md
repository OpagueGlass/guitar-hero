# Guitar Hero

<p align="center">
    <img src="https://raw.githubusercontent.com/OpagueGlass/guitar-hero/main/.github/guitar-hero.png" alt="Guitar Hero Gameplay"/>
</p>

Developing a browser-based rhythm game with the Functional Reactive Programming (FRP) approach by using Observables from
RxJS to handle animation, user interaction, and other related stream behaviours.

Play the live demo at [StackBlitz](https://stackblitz.com/github/OpagueGlass/guitar-hero).

## Introduction

Guitar hero is a rhythm game where players press keyboard keys to simulate playing a selection of songs on an
instrument. Players align the notes that scroll on screen to the buttons on the canvas, pressing the corresponding keys
in synchronisation to the music to score points.

## Design

The game is designed with the combination of functional and reactive programming. The design details and justifications
can be found in [`.github/design.md`](https://github.com/OpagueGlass/guitar-hero/blob/main/.github/design.md)

## How to Play

The green, red, blue, yellow columns corresponds to keys H, J, K, L respectively.

Press the respective keys when the notes circles land on the buttons of the canvas. Notes are played when the keys are
pressed, but with a random duration if the note somewhat aligns and a random note if it misses.

Notes have tails if they are longer than 1 second, with the length of the tail corresponding to the length of the note.  
Tails move down with the note circle, and must be held with the same key for the correct duration to be played
correctly, otherwise they will stop playing.

The score multiplier starts at 1x and increases by 0.2 for every 10 consecutive notes hit (for example: 10 notes = 1.2x,
20 notes = 1.4x), and resets to 1x when a note is missed.

The game ends when the last note finishes playing. Press the R key to restart the game with the same song and high
score.

## Create custom songs

1. Run `.github/midi.py` with the midi files in the same directory.
2. Pick the desired midi file
3. Replace or skip unavailable instruments
4. Select an instrument for the playable notes
5. Place the converted csv file into `./assets`

## Instructions

1. Clone the repository

2. Install Dependencies:

    ```bash
    npm install
    ```

3. Start the Development Server

    ```bash
    npm run dev
    ```

    Alternatively, you can skip steps 1-3 by opening the project directly in
    [StackBlitz](https://stackblitz.com/github/OpagueGlass/guitar-hero).

5. Navigate to `src/types.ts` and edit the `SONG_NAME` attribute in the `Constants` object to the desired song.

6. Open the link in the browser and click the mouse to start the game. Refer to [How to Play](#How-to-Play) for gameplay
   instructions.
