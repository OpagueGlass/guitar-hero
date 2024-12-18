## Functional Programming

Extensive application of higher order functions, pure functions, currying and immutable types.

Most functions used are pure functions and all containers and variables used are immutable types. Pure functions always
return the same output for a given input and immutable types prevent the modification of variables and containers after
their creation. This effectively contains the occurrence of side effects, ensuring unintended changes do not occur in
program execution, improving maintainability and reliability.

Higher order functions and currying were used appropriately to promote reusability and modularity without sacrificing
readability due to extensive currying. An example of a higher order function which uses currying is the `scaleToColumn`
function in `main.ts`. When the result of `getMinMax` is passed into `scaleToColumn`, it returns a new function
`getColumn`. Due to partial application, `getColumn` can be repeatedly used without finding the min and max each time.
`scaleToColumn` can also be composed with other values of getMinMax to obtain a different `getColumn` function.

## Model-View-Controller Architecture

<p align="center">
    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/MVC-Process.svg" alt="MVC Architecture"/>
</p>

The Model-View-Controller architecture was utilised by separating the associated parts of the program into three related
modules. This decouples the elements since each is responsible for a single functionality part. Through Separation of
Concerns, this improves extensibility and maintainability, since modules do not heavily affect each other and changes to
modules are simpler.

## Main

Parses the CSV into data objects, delaying each note by their start time and creating the Add action streams for note
circle, background note, and tail. The streams of user input are mapped to an Action. The main game stream pipeline is
also created and subscribed to start the game. Contains the main function that is called on page load.

Delaying the notes requires the mergeMap operator. Since mergeMap is asynchronous, it does not wait for inner
observables to complete, so these delays do not add up and are only applied to the note itself. This is crucial to FRP
and cannot be easily done without observables, since their asynchronous behaviour is essential for the reactive nature
of the program.

The partition operator splits the notes into player and background notes. The partition operator divides an observable
into two with a condition. This also cannot be done easily with functional array methods and must be filtered twice.

The initial subscription is handled by the startWith operator in the subscription stream, so the game automatically
starts after the mouse click. When the R key is pressed, the restart stream emits and the restart action is first
handled to clear the canvas of active notes and tails, and stopping the playback of active tails. After a 1ms delay, the
switchMap operator unsubscribes from the current state stream and subscribes to a new state stream, effectively
restarting the game.

## State

Updates the state with the game's Actions. It handles ticking the game, adding notes and tails, pressing the notes,
holding the tails, restarting, and ending the game.

State is managed by applying actions to the previous state. Purity is maintained by making state immutable, using pure
functions in actions, and returning a new immutable state at the end of each action. Although changing state with
references would reduce redundancy and simplify code, this ensures that changes do not have any side effects, so state
is not changed unexpectedly. This promotes predictability and easier debugging.

## View

Renders the bodies, playing notes and tails and removing bodies that have exited the canvas. It also shows the game's
end screen when the game is over. View only reads from state and does not perform any logic to prevent side effects, so
only rendering glitches can occur here. This helps narrow down the source of bugs so it improves maintainability.

## Types

Includes the constants and custom type definitions. The types of arrays in state are defined to exploit subtyping
polymorphism. For example, this allows notes and tails to be in the same exit array since they share ID as a common
attribute. This prevents code repetition and reduces the number of arrays and if statements for types in view. Although
having fewer types will simplify the custom types and object creation, a lot of filtering is required which reduces the
code quality.

Constants are also used to avoid magic numbers by assigning a name to each number. This improves code readability by
providing meaningful names and these values can be easily changed everywhere.

## Util

Includes utility functions that are not specific to the files above. The not and isNullorUndefined functions take in
generic types. This improves code reusability and modularity since these functions are not limited to a specific type.
