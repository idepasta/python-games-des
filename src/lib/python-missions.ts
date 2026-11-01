import { hooksForGame } from "@/lib/canvas-games";
import { runPython, type PyHooks } from "@/lib/python-vm";

export type ValidationRule =
  | { type: "includes"; value: string; message: string }
  | { type: "includesAny"; values: string[]; message: string }
  | { type: "regex"; value: string; message: string }
  | { type: "run"; inputs: string[]; printsInclude: string[]; message: string; hooks?: PyHooks }
  | { type: "game"; message: string };

export type PythonStep = {
  id: string;
  title: string;
  prompt: string;
  hint: string;
  success: string;
  starterCode: string;
  rules: ValidationRule[];
  game?: { kind: "miner" | "platformer" | "flappy" | "city" | "dino"; level: number };
};

export type PythonMission = {
  id: string;
  emoji: string;
  title: string;
  teaser: string;
  story: string;
  steps: PythonStep[];
};

export type StepCheck = { ok: boolean; message: string };

const includes = (value: string, message: string): ValidationRule => ({ type: "includes", value, message });
const includesAny = (values: string[], message: string): ValidationRule => ({ type: "includesAny", values, message });
const regex = (value: string, message: string): ValidationRule => ({ type: "regex", value, message });
const run = (inputs: string[], printsInclude: string[], message: string, hooks?: PyHooks): ValidationRule => (
  { type: "run", inputs, printsInclude, message, hooks }
);
const game = (message: string): ValidationRule => ({ type: "game", message });

export const pythonMissions: PythonMission[] = [
  {
    id: "mad-libs",
    emoji: "📝",
    title: "Mad Libs",
    teaser: "Variables, input(), and f-strings",
    story: "Build a silly story app. The phone will ask for words, then print a sentence using those words.",
    steps: [
      {
        id: "var",
        title: "Store a name",
        prompt: "Create a variable called name and set it to a word in quotes, such as \"Sam\".",
        hint: "Write name = \"Sam\"",
        success: "You stored a word in a variable!",
        starterCode: `# Mad Libs step 1
# Store the hero name in a variable.
name = 
`,
        rules: [
          regex("name\\s*=\\s*['\"][^'\"]+['\"]", "Set name to a quoted word, like name = \"Sam\"."),
        ],
      },
      {
        id: "noun",
        title: "Ask for a noun",
        prompt: "Use input() to ask for a noun and save the answer in a variable called noun.",
        hint: 'Write noun = input("Give me a noun: ")',
        success: "The phone can now ask a question!",
        starterCode: `name = "Sam"
# Ask the player for a noun.
noun = 
`,
        rules: [
          includes("input(", "Call input() so the phone can ask a question."),
          includes("noun", "Save the answer in a variable named noun."),
        ],
      },
      {
        id: "verb",
        title: "Ask for a verb",
        prompt: "Ask for a second word. Save it in verb using input().",
        hint: 'Write verb = input("Give me a verb: ")',
        success: "Two questions are ready.",
        starterCode: `name = "Sam"
noun = input("Give me a noun: ")
# Ask for a verb too.
verb = 
`,
        rules: [
          regex("verb\\s*=\\s*input\\s*\\(", "Save the second answer with verb = input(...)."),
        ],
      },
      {
        id: "story",
        title: "Print the story",
        prompt: "Use an f-string and print() to tell a story with name, noun, and verb.",
        hint: 'Write print(f"{name} saw a {noun} and decided to {verb}!")',
        success: "Mad Libs is finished. Try it on the phone!",
        starterCode: `name = "Sam"
noun = input("Give me a noun: ")
verb = input("Give me a verb: ")
# Put the words into one sentence.
print()
`,
        rules: [
          includes("print(", "Call print() to show the story on the phone."),
          includesAny(["f\"", "f'"], "Use an f-string so variables go inside the sentence."),
          includes("{name}", "Put {name} inside the f-string."),
          includes("{noun}", "Put {noun} inside the f-string."),
          includes("{verb}", "Put {verb} inside the f-string."),
          run(
            ["dragon", "dance"],
            ["Sam", "dragon", "dance"],
            "Run the story so print() shows the name, noun, and verb.",
          ),
        ],
      },
    ],
  },
  {
    id: "magic-8-ball",
    emoji: "🎱",
    title: "Magic 8-Ball",
    teaser: "Lists and random.choice()",
    story: "The phone becomes a Magic 8-Ball. It picks a random answer from a list.",
    steps: [
      {
        id: "import",
        title: "Import random",
        prompt: "Add import random at the top so you can pick a surprise answer.",
        hint: "The first line should be: import random",
        success: "Random is ready to use.",
        starterCode: `# Magic 8-Ball step 1
# Unlock surprise answers.
`,
        rules: [includes("import random", "Write import random on its own line.")],
      },
      {
        id: "list",
        title: "Make an answer list",
        prompt: "Create a list called answers with at least three quoted words, such as \"Yes\", \"No\", and \"Ask again\".",
        hint: 'Write answers = ["Yes", "No", "Ask again"]',
        success: "The 8-Ball has answers to choose from.",
        starterCode: `import random
# A list holds many answers inside [ ].
answers = []
`,
        rules: [
          includes("answers", "Name the list answers."),
          includes("[", "Use square brackets to make a list."),
          includesAny(["Yes", "yes", "No", "Ask"], "Put real answer words inside the list."),
        ],
      },
      {
        id: "ask",
        title: "Ask a question",
        prompt: "Use input() to ask the player a yes-or-no question and store it in question.",
        hint: 'Write question = input("Ask the Magic 8-Ball: ")',
        success: "The player can ask the 8-Ball.",
        starterCode: `import random
answers = ["Yes", "No", "Ask again", "Definitely"]
question = 
`,
        rules: [
          includes("input(", "Call input() to read the player's question."),
          includes("question", "Store the question in a variable named question."),
        ],
      },
      {
        id: "choice",
        title: "Pick a random answer",
        prompt: "Print a random item from the list with random.choice(answers).",
        hint: "Write print(random.choice(answers))",
        success: "Shake the 8-Ball on the phone!",
        starterCode: `import random
answers = ["Yes", "No", "Ask again", "Definitely"]
question = input("Ask the Magic 8-Ball: ")
# Pick one answer at random.
print()
`,
        rules: [
          includes("random.choice", "Use random.choice to pick one item from the list."),
          includes("print(", "Print the chosen answer."),
          run(["Will I learn Python?"], ["Yes"], "The phone should print a chosen answer.", { choice: (items) => items[0]! }),
        ],
      },
    ],
  },
  {
    id: "rps",
    emoji: "✂️",
    title: "Rock, Paper, Scissors",
    teaser: "if / elif / else and comparing variables",
    story: "Play against the computer. Compare the player's choice with the computer's choice.",
    steps: [
      {
        id: "import",
        title: "Import random",
        prompt: "Start with import random so the computer can pick rock, paper, or scissors.",
        hint: "Write import random",
        success: "Random is imported.",
        starterCode: `# Rock, Paper, Scissors
`,
        rules: [includes("import random", "Write import random.")],
      },
      {
        id: "choices",
        title: "List the moves",
        prompt: "Make a list called choices with \"rock\", \"paper\", and \"scissors\".",
        hint: 'Write choices = ["rock", "paper", "scissors"]',
        success: "The three moves are in a list.",
        starterCode: `import random
choices = []
`,
        rules: [
          includes("choices", "Name the list choices."),
          includes("rock", "Include rock in the list."),
          includes("paper", "Include paper in the list."),
          includes("scissors", "Include scissors in the list."),
        ],
      },
      {
        id: "player",
        title: "Read the player",
        prompt: "Ask the player for a move with input() and save it in player.",
        hint: 'Write player = input("Rock, paper, or scissors? ")',
        success: "The phone can hear the player's move.",
        starterCode: `import random
choices = ["rock", "paper", "scissors"]
player = 
`,
        rules: [
          includes("player", "Store the move in player."),
          includes("input(", "Use input() to read the move."),
        ],
      },
      {
        id: "computer",
        title: "Computer picks",
        prompt: "Let the computer pick with computer = random.choice(choices) and print that move.",
        hint: "Write computer = random.choice(choices) then print(computer)",
        success: "The computer can play too.",
        starterCode: `import random
choices = ["rock", "paper", "scissors"]
player = input("Rock, paper, or scissors? ")
computer = 
print()
`,
        rules: [
          includes("computer", "Store the computer move in computer."),
          includes("random.choice", "Pick the computer move with random.choice."),
        ],
      },
      {
        id: "compare",
        title: "Compare the moves",
        prompt: "Use if, elif, and else to print Tie!, You win!, or You lose! by comparing player and computer.",
        hint: "Start with if player == computer: then add elif rules for winning moves, and else for losing.",
        success: "The game can decide a winner!",
        starterCode: `import random
choices = ["rock", "paper", "scissors"]
player = input("Rock, paper, or scissors? ")
computer = random.choice(choices)
print(f"Computer chose {computer}")
# Compare player and computer.
if player == computer:
    print("Tie!")
`,
        rules: [
          includes("if ", "Use an if to compare the two moves."),
          includes("elif", "Use elif for extra winning cases."),
          includes("else:", "Use else for the remaining case."),
          includes("==", "Compare with ==."),
          includesAny(["You win", "You lose", "Tie"], "Print a result such as You win!"),
          run(["rock"], ["Tie!"], "When both pick rock, print Tie!", { choice: () => "rock" }),
        ],
      },
    ],
  },
  {
    id: "guess",
    emoji: "🔢",
    title: "Guess the Number",
    teaser: "while loops, logic, and random",
    story: "The phone picks a secret number. Keep guessing until it is right.",
    steps: [
      {
        id: "import",
        title: "Import random",
        prompt: "Write import random so the phone can pick a secret number.",
        hint: "Write import random",
        success: "Random is imported.",
        starterCode: `# Guess the Number
`,
        rules: [includes("import random", "Write import random.")],
      },
      {
        id: "secret",
        title: "Pick a secret",
        prompt: "Store a secret number: secret = random.randint(1, 10)",
        hint: "randint(1, 10) picks a whole number from 1 to 10.",
        success: "A secret number is hiding.",
        starterCode: `import random
secret = 
`,
        rules: [
          includes("secret", "Name the variable secret."),
          includes("random.randint", "Use random.randint to pick the secret."),
        ],
      },
      {
        id: "while",
        title: "Start a while loop",
        prompt: "Make a guess variable and a while loop so the game keeps going until the guess is correct.",
        hint: "Try guess = 0 and while guess != secret:",
        success: "The loop is ready to keep asking.",
        starterCode: `import random
secret = random.randint(1, 10)
guess = 0
# Keep going until the guess matches the secret.
`,
        rules: [
          includes("while ", "Add a while loop."),
          includesAny(["guess", "True"], "Loop using guess or while True."),
        ],
      },
      {
        id: "input-int",
        title: "Read a number",
        prompt: "Inside the loop, read a guess with guess = int(input(...)) so the text becomes a number.",
        hint: 'Write guess = int(input("Guess a number from 1 to 10: "))',
        success: "Each guess is a real number.",
        starterCode: `import random
secret = random.randint(1, 10)
guess = 0
while guess != secret:
    guess = 
`,
        rules: [
          includes("int(", "Wrap input() with int() so the guess is a number."),
          includes("input(", "Ask for a guess with input()."),
        ],
      },
      {
        id: "hints",
        title: "Give hints",
        prompt: "If the guess is too small print Too low!, elif it is too big print Too high!, else print You got it!",
        hint: "Compare guess with secret using < and >.",
        success: "Guess the Number is playable!",
        starterCode: `import random
secret = random.randint(1, 10)
guess = 0
while guess != secret:
    guess = int(input("Guess a number from 1 to 10: "))
    if guess < secret:
        print("Too low!")
`,
        rules: [
          includes("if ", "Use if to check a low guess."),
          includes("elif", "Use elif to check a high guess."),
          includes("else:", "Use else when the guess is correct."),
          includesAny(["Too low", "too low"], "Tell the player when the guess is too low."),
          includesAny(["Too high", "too high"], "Tell the player when the guess is too high."),
          run(["1", "7"], ["Too low!", "You got it!"], "Print Too low! then You got it! for 1 then 7.", { randint: () => 7 }),
        ],
      },
    ],
  },
  {
    id: "hangman",
    emoji: "🔤",
    title: "Word Guess",
    teaser: "String loops, in, and lives",
    story: "A mini hangman: guess letters, reveal the word, and count lives.",
    steps: [
      {
        id: "word",
        title: "Hide a word",
        prompt: "Store the secret word in a variable called word, using quotes, such as \"code\".",
        hint: "Write word = \"code\"",
        success: "The secret word is stored.",
        starterCode: `# Word Guess
word = 
`,
        rules: [regex("word\\s*=\\s*['\"][^'\"]+['\"]", "Set word to a quoted secret, like word = \"code\".")],
      },
      {
        id: "lives",
        title: "Count lives",
        prompt: "Make a lives variable starting at 6, and a guessed variable starting as empty text \"\".",
        hint: "Write lives = 6 and guessed = \"\"",
        success: "Lives and guessed letters are ready.",
        starterCode: `word = "code"
lives = 
guessed = 
`,
        rules: [
          includes("lives", "Create a lives counter."),
          includes("6", "Start with 6 lives."),
          includes("guessed", "Track guessed letters in guessed."),
        ],
      },
      {
        id: "in",
        title: "Check a letter",
        prompt: "Ask for a letter with input(). If letter in word, add it to guessed and print Good guess! else take away one life.",
        hint: "Use if letter in word: and lives = lives - 1 in the else branch.",
        success: "The game knows good and bad letters.",
        starterCode: `word = "code"
lives = 6
guessed = ""
letter = input("Guess a letter: ")
if letter in word:
    print("Good guess!")
`,
        rules: [
          includes(" in ", "Use the in operator to test if the letter is in the word."),
          includes("input(", "Read a letter with input()."),
          includesAny(["lives - 1", "lives=lives-1", "lives = lives - 1"], "Subtract 1 from lives on a miss."),
        ],
      },
      {
        id: "for",
        title: "Show hidden letters",
        prompt: "Loop for ch in word and build a display: show ch if it is in guessed, otherwise show _.",
        hint: "Start with shown = \"\" then for ch in word: and add to shown.",
        success: "The hidden word can appear on the phone.",
        starterCode: `word = "code"
lives = 6
guessed = ""
letter = input("Guess a letter: ")
if letter in word:
    guessed = guessed + letter
    print("Good guess!")
else:
    lives = lives - 1
    print("Nope!")
shown = ""
# Loop over every character in word.
`,
        rules: [
          includes("for ", "Use a for loop."),
          includes(" in word", "Loop over the letters in word."),
          includesAny(["shown", "display", "mask"], "Build a shown or display string."),
        ],
      },
      {
        id: "play",
        title: "Keep playing",
        prompt: "Wrap the guessing in while lives > 0:. Print the shown word. If shown == word, print You won! and break.",
        hint: "while lives > 0: around the input. After the for loop, if shown == word: print You won! then break.",
        success: "Mini hangman is complete. Play it on the phone!",
        starterCode: `word = "code"
lives = 6
guessed = ""
while lives > 0:
    letter = input("Guess a letter: ")
    if letter in word:
        guessed = guessed + letter
        print("Good guess!")
    else:
        lives = lives - 1
        print("Nope!")
    shown = ""
    for ch in word:
        if ch in guessed:
            shown = shown + ch
        else:
            shown = shown + "_"
    print(shown)
`,
        rules: [
          includes("while ", "Keep asking with a while loop."),
          includes("break", "Use break when the word is complete."),
          includesAny(["You won", "You win"], "Print You won! when shown matches word."),
          run(["c", "x", "o", "d", "e"], ["Good guess!", "Nope!", "You won!"], "Play letters until the word is found."),
        ],
      },
    ],
  },
  {
    id: "python-miner",
    emoji: "⛏️",
    title: "Python Miner",
    teaser: "Loops and conditionals on a 2D grid",
    story: "A top-down mine. Brown is dirt, gray is stone, teal is diamond, and yellow marks are where you build. move_up(), move_down(), move_left(), move_right(), mine_block(), place_block(\"plank\"), and block_ahead() control the miner.",
    steps: [
      {
        id: "walk",
        title: "Walk to the goal",
        prompt: "The goal is two steps to the right. Call move_right() until the miner stands on it.",
        hint: "Write move_right() on two lines.",
        success: "The miner reached the goal.",
        starterCode: `# Walk toward the yellow goal.
move_right()
`,
        game: { kind: "miner", level: 1 },
        rules: [
          includes("move_right()", "Call move_right() to walk."),
          game("The miner has not reached the goal yet."),
        ],
      },
      {
        id: "mine",
        title: "Mine the dirt",
        prompt: "Dirt is in the way. Face it, call mine_block(), then walk onto the goal.",
        hint: "move_right(), mine_block(), then move_right() twice.",
        success: "You mined the dirt and reached the goal.",
        starterCode: `# Dirt blocks the path. Mine it, then walk.
move_right()
`,
        game: { kind: "miner", level: 2 },
        rules: [
          includes("mine_block()", "Call mine_block() when dirt is in front of you."),
          game("Mine the dirt, then stand on the goal."),
        ],
      },
      {
        id: "loop",
        title: "Clear a dirt wall",
        prompt: "Three dirt blocks are in a row. Use a while loop and block_ahead() so you mine dirt and walk forward until the goal is in front of you.",
        hint: 'Loop until block_ahead() == "goal", then call move_right() one more time.',
        success: "The loop cleared the wall.",
        starterCode: `# Keep going until the goal is ahead.
while block_ahead() != "goal":
    move_right()
`,
        game: { kind: "miner", level: 3 },
        rules: [
          includes("while ", "Use a while loop so you do not mine by hand three times."),
          includes("block_ahead()", "Look with block_ahead() before you move or mine."),
          game("Mine every dirt block, then step onto the goal."),
        ],
      },
      {
        id: "diamond",
        title: "Collect the diamond",
        prompt: "Mine dirt, stone, and the diamond. Use if and else so air means move_right() and anything else means mine_block().",
        hint: 'If the block ahead is air, move_right(). Otherwise mine_block(). Then step onto the goal.',
        success: "You collected the diamond and reached the goal.",
        starterCode: `while block_ahead() != "goal":
    move_right()
`,
        game: { kind: "miner", level: 4 },
        rules: [
          includes("if ", "Use if so you mine hard blocks and walk through air."),
          includes("mine_block()", "Mine dirt, stone, and the diamond."),
          game("Mine the diamond, then stand on the goal."),
        ],
      },
      {
        id: "build",
        title: "Build a plank",
        prompt: "Mine one dirt, face the yellow mark, and call place_block(\"plank\"). Then walk down to the goal.",
        hint: 'place_block("plank") uses one mined dirt.',
        success: "The blueprint is finished and you reached the goal.",
        starterCode: `# Mine dirt, place a plank on the mark, then find the goal.
move_right()
`,
        game: { kind: "miner", level: 5 },
        rules: [
          includes('place_block("plank")', 'Call place_block("plank") on the yellow mark.'),
          includes("mine_block()", "Mine dirt so you have something to build with."),
          game("Place the plank, then stand on the goal."),
        ],
      },
    ],
  },
  {
    id: "logic-platformer",
    emoji: "🏃",
    title: "Logic Platformer",
    teaser: "Sequence, jumps, and timing",
    story: "A side view with gaps and a red flag. run(steps) jogs right, jump() leaps, and wait(seconds) pauses. If the avatar falls, change the numbers and run the code again.",
    steps: [
      {
        id: "run",
        title: "Run to the flag",
        prompt: "The ground is flat. run(steps) moves that many tiles to the right. Make the run long enough to touch the flag.",
        hint: "Try run(6).",
        success: "The avatar reached the flag.",
        starterCode: `# Run toward the flag.
run(1)
`,
        game: { kind: "platformer", level: 1 },
        rules: [
          includes("run(", "Call run(steps) to move right."),
          game("The avatar has not reached the flag yet."),
        ],
      },
      {
        id: "gap",
        title: "Jump the gap",
        prompt: "Run to the edge, jump(), then run again to the flag. A jump only works from the ground.",
        hint: "run(3), then jump(), then run(3).",
        success: "You jumped the gap and reached the flag.",
        starterCode: `run(3)
# Jump before the hole, then keep running.
`,
        game: { kind: "platformer", level: 2 },
        rules: [
          includes("jump()", "Call jump() at the edge of the gap."),
          game("Jump the gap, then run to the flag."),
        ],
      },
      {
        id: "second-gap",
        title: "Cross two gaps",
        prompt: "There are two holes. Run, jump, run a short way, jump again, then run to the flag.",
        hint: "run(2), jump(), run(1), jump(), run(3).",
        success: "Both gaps are behind you.",
        starterCode: `run(2)
jump()
# The second hole still needs a jump.
`,
        game: { kind: "platformer", level: 3 },
        rules: [
          regex("jump\\(\\)[\\s\\S]*jump\\(\\)", "Call jump() once for each gap."),
          game("Jump both gaps and reach the flag."),
        ],
      },
      {
        id: "timing",
        title: "Wait for the landing",
        prompt: "Jump, then wait(seconds) until the avatar is back on the ground before the next jump. A second jump in the air is a crash.",
        hint: "wait(0.7) after each jump.",
        success: "Your timing carried the avatar to the flag.",
        starterCode: `run(2)
jump()
jump()
run(1)
jump()
run(3)
`,
        game: { kind: "platformer", level: 4 },
        rules: [
          includes("wait(", "Call wait(seconds) so the next jump happens after you land."),
          game("Wait until you land, then jump the next gap."),
        ],
      },
    ],
  },
  {
    id: "flappy-bird",
    emoji: "🐦",
    title: "Flappy Bird",
    teaser: "Flap, glide, and pipes",
    story: "A tiny bird flies to the right. flap() hops up, coast() dips down, and glide() stays level. Green cells are pipes. Reach the yellow goal.",
    steps: [
      {
        id: "one",
        title: "Hop over one pipe",
        prompt: "The pipe is on your row. flap() once, glide() through the gap, then coast() down onto the goal.",
        hint: "flap(), glide(), coast().",
        success: "The bird cleared the pipe.",
        starterCode: `# Hop, then settle onto the goal.
flap()
`,
        game: { kind: "flappy", level: 1 },
        rules: [
          includes("flap()", "Call flap() to hop over the pipe."),
          includes("coast()", "Call coast() to dip onto the goal."),
          game("The bird has not reached the goal yet."),
        ],
      },
      {
        id: "two",
        title: "Cross a wider gap",
        prompt: "Flap over the pipe, glide across, coast down, then glide to the goal.",
        hint: "flap(), glide(), glide(), coast(), glide().",
        success: "The bird crossed the wider gap.",
        starterCode: `flap()
glide()
`,
        game: { kind: "flappy", level: 2 },
        rules: [
          includes("coast()", "Dip with coast() before the last glide."),
          game("Glide to the goal after you clear the pipe."),
        ],
      },
      {
        id: "loop",
        title: "Repeat the flap",
        prompt: "Two pipes use the same pattern. Loop over the list [1, 2]. Each time, flap(), glide(), then coast().",
        hint: "for n in [1, 2]: then flap(), glide(), and coast().",
        success: "The loop cleared both pipes.",
        starterCode: `for n in [1, 2]:
    flap()
`,
        game: { kind: "flappy", level: 3 },
        rules: [
          includes("for ", "Use a for loop so you do not write every flap by hand."),
          includes("glide()", "glide() flies straight through a gap."),
          includes("coast()", "coast() dips after each gap."),
          game("Clear both pipes and land on the goal."),
        ],
      },
      {
        id: "sense",
        title: "Fly by looking ahead",
        prompt: "Pipes are not in a straight line. While ahead() is not \"goal\", compare row() with gap_ahead(). flap() if you are too low, coast() if you are too high, otherwise glide(). After the loop, glide() onto the goal if you are not there yet.",
        hint: "if row() > gap_ahead(): flap(). elif row() < gap_ahead(): coast(). else: glide().",
        success: "The bird threaded every pipe.",
        starterCode: `while ahead() != "goal":
    glide()
`,
        game: { kind: "flappy", level: 4 },
        rules: [
          includes("while ", "Keep flying with a while loop."),
          includes("gap_ahead()", "Look at the next gap with gap_ahead()."),
          includes("row()", "Compare gap_ahead() with row()."),
          includes("flap()", "flap() when the bird is below the gap."),
          game("Match the gap, then reach the goal."),
        ],
      },
    ],
  },
  {
    id: "city-drive",
    emoji: "🚗",
    title: "City Drive",
    teaser: "A plain city and a crate blaster",
    story: "A plain top-down city. Gray is road, dark squares are buildings, and orange crates block the street. move_up(), move_down(), move_left(), move_right(), and block_ahead() drive the car. shoot() pops the crate directly in front of you. Reach the yellow goal.",
    steps: [
      {
        id: "drive",
        title: "Drive to the goal",
        prompt: "The goal is two roads to the right. Call move_right() until the car is on it.",
        hint: "move_right() on two lines.",
        success: "The car reached the goal.",
        starterCode: `# Drive along the road.
move_right()
`,
        game: { kind: "city", level: 1 },
        rules: [
          includes("move_right()", "Call move_right() to drive."),
          game("The car has not reached the goal yet."),
        ],
      },
      {
        id: "crate",
        title: "Pop a crate",
        prompt: "An orange crate blocks the road. Drive up to it, call shoot(), then drive onto the goal.",
        hint: "move_right(), shoot(), then move_right() twice.",
        success: "The crate popped and the car reached the goal.",
        starterCode: `move_right()
`,
        game: { kind: "city", level: 2 },
        rules: [
          includes("shoot()", "Call shoot() while the crate is in front of the car."),
          game("Pop the crate, then stand on the goal."),
        ],
      },
      {
        id: "loop",
        title: "Clear a line of crates",
        prompt: "Three crates sit in a row. Use a while loop and block_ahead(). shoot() a crate, otherwise move_right(). When the goal is ahead, move onto it.",
        hint: 'Loop while block_ahead() != "goal". If the block is "crate", shoot(). Then move_right() one last time.',
        success: "The street is clear.",
        starterCode: `while block_ahead() != "goal":
    move_right()
`,
        game: { kind: "city", level: 3 },
        rules: [
          includes("while ", "Use a while loop for the whole row."),
          includes("shoot()", "Pop each crate with shoot()."),
          includes("block_ahead()", "Look with block_ahead() before you drive or shoot."),
          game("Pop every crate, then stand on the goal."),
        ],
      },
      {
        id: "corner",
        title: "Turn the corner",
        prompt: "Drive right to the crate, shoot() it, then drive down to the goal.",
        hint: "Two move_right() calls, shoot(), move_right(), then move_down() twice.",
        success: "You crossed the city block.",
        starterCode: `move_right()
# The crate is further right.
`,
        game: { kind: "city", level: 4 },
        rules: [
          includes("shoot()", "Pop the crate before you pass it."),
          includes("move_down()", "Turn down toward the goal."),
          game("Pop the crate, then stand on the goal."),
        ],
      },
    ],
  },
  {
    id: "dino-run",
    emoji: "🦖",
    title: "Dino Run",
    teaser: "A 3D desert run",
    story: "A chunky dinosaur runs across a 3D desert. Cacti sit on the ground and birds fly low. jump() hops a cactus, duck() slips under a bird, and run() jogs ahead. Reach the yellow finish.",
    steps: [
      {
        id: "cactus",
        title: "Jump one cactus",
        prompt: "A cactus blocks the trail. jump() over it, then run() to the yellow finish.",
        hint: "jump() on one line, then run().",
        success: "The dinosaur cleared the cactus.",
        starterCode: `# Hop the cactus, then finish.
run()
`,
        game: { kind: "dino", level: 1 },
        rules: [
          includes("jump()", "Call jump() to hop the cactus."),
          includes("run()", "Call run() to reach the finish."),
          game("Jump the cactus, then stand on the finish."),
        ],
      },
      {
        id: "bird",
        title: "Duck under a bird",
        prompt: "A bird flies low in front of you. duck() under it, then run() to the finish.",
        hint: "duck(), then run().",
        success: "The dinosaur slipped under the bird.",
        starterCode: `run()
`,
        game: { kind: "dino", level: 2 },
        rules: [
          includes("duck()", "Call duck() to go under the bird."),
          includes("run()", "Call run() after the duck."),
          game("Duck the bird, then stand on the finish."),
        ],
      },
      {
        id: "loop",
        title: "Repeat the pattern",
        prompt: "The trail is cactus, bird, then a clear step, twice. Loop over [1, 2]. Each time, jump(), duck(), then run().",
        hint: "for n in [1, 2]: then jump(), duck(), and run().",
        success: "The loop cleared both pairs.",
        starterCode: `for n in [1, 2]:
    jump()
`,
        game: { kind: "dino", level: 3 },
        rules: [
          includes("for ", "Use a for loop for the repeated pattern."),
          includes("jump()", "jump() clears each cactus."),
          includes("duck()", "duck() slips under each bird."),
          includes("run()", "run() covers the clear step."),
          game("Clear both pairs and reach the finish."),
        ],
      },
      {
        id: "sense",
        title: "Watch the trail",
        prompt: "The obstacles are mixed. While ahead() is not \"goal\", jump() a cactus, duck() a bird, and run() when the next step is clear. After the loop, run() onto the finish.",
        hint: 'if ahead() == "cactus": jump(). elif ahead() == "bird": duck(). else: run().',
        success: "The dinosaur read the trail and finished.",
        starterCode: `while ahead() != "goal":
    run()
`,
        game: { kind: "dino", level: 4 },
        rules: [
          includes("while ", "Keep going with a while loop."),
          includes("ahead()", "Look with ahead() before each move."),
          includes("jump()", "jump() when ahead() is a cactus."),
          includes("duck()", "duck() when ahead() is a bird."),
          game("React to each obstacle, then stand on the finish."),
        ],
      },
    ],
  },
  {
    id: "trap-quiz",
    emoji: "🎤",
    title: "Trap Quiz",
    teaser: "A quiz about Greek trap",
    story: "Build a phone quiz about four Greek trap artists: Trannos, Light, Snick, and Rack. The phone asks for a name and checks it against the lineup.",
    steps: [
      {
        id: "lineup",
        title: "Store the lineup",
        prompt: "Make a list called artists with these four names, in quotes: Trannos, Light, Snick, Rack.",
        hint: 'artists = ["Trannos", "Light", "Snick", "Rack"]',
        success: "The lineup is stored.",
        starterCode: `# Greek trap quiz
artists = 
`,
        rules: [
          includes("artists", "Name the list artists."),
          includes("Trannos", "Put Trannos in the list."),
          includes("Light", "Put Light in the list."),
          includes("Snick", "Put Snick in the list."),
          includes("Rack", "Put Rack in the list."),
        ],
      },
      {
        id: "ask",
        title: "Ask for a name",
        prompt: "Print Greek trap quiz, then use input() to ask for a trapper and save the answer in guess.",
        hint: 'print("Greek trap quiz") and guess = input("Name one trapper: ")',
        success: "The phone can ask the first question.",
        starterCode: `artists = ["Trannos", "Light", "Snick", "Rack"]
# Ask the player to name a trapper.
`,
        rules: [
          includes("print(", "Print the quiz title."),
          includes("input(", "Ask with input()."),
          includes("guess", "Save the answer in guess."),
        ],
      },
      {
        id: "check",
        title: "Check the answer",
        prompt: "Ask for a name until guess is in artists. If it is, print Correct! If it is not, print Try another name. and ask again.",
        hint: 'guess = "" then while not guess in artists: ask with input(), and use if guess in artists.',
        success: "A wrong name asks again. A lineup name is Correct!",
        starterCode: `artists = ["Trannos", "Light", "Snick", "Rack"]
guess = input("Name one trapper: ")
`,
        rules: [
          includes("while ", "Use a while loop so a wrong name can try again."),
          includes("in artists", "Look for the guess inside artists."),
          includes("if ", "Use if to tell a lineup name from a wrong one."),
          includes("Correct!", "Print Correct! for a lineup name."),
          includes("Try another name.", "Print Try another name. when the guess is not in artists."),
          run(["Mozart", "Trannos"], ["Try another name.", "Correct!"], "A wrong name should ask again, then accept Trannos."),
        ],
      },
      {
        id: "score",
        title: "Score the lineup",
        prompt: "Start score at 0. For each artist, keep asking until guess matches that name. A wrong guess prints Nope! and asks again. A match prints Correct!, adds 1 to score, then moves on. After every name, print the score.",
        hint: 'while not guess == name: ask again. score = score + 1 when guess == name.',
        success: "The quiz keeps score.",
        starterCode: `artists = ["Trannos", "Light", "Snick", "Rack"]
score = 0
for name in artists:
    guess = input("Name a Greek trapper: ")
print(score)
`,
        rules: [
          includes("for ", "Use a for loop over the lineup."),
          includes("while ", "Keep asking while the guess does not match the current name."),
          includes("if ", "Check each answer with if."),
          includes("score + 1", "Add 1 to score for a match."),
          includes("Nope!", "Print Nope! when the name is wrong."),
          run(["Nope", "Trannos", "Light", "Snick", "Rack"], ["Nope!", "Correct!", "4"], "A wrong name should ask again, then four matches score 4."),
        ],
      },
    ],
  },
];

export function validatePythonStep(step: PythonStep, code: string): StepCheck {
  for (const rule of step.rules) {
    if (rule.type === "includes" && !code.includes(rule.value)) return { ok: false, message: rule.message };
    if (rule.type === "includesAny" && !rule.values.some((value) => code.includes(value))) {
      return { ok: false, message: rule.message };
    }
    if (rule.type === "regex" && !new RegExp(rule.value).test(code)) {
      return { ok: false, message: rule.message };
    }
    if (rule.type === "run") {
      const result = runPython(code, rule.inputs, rule.hooks ?? {});
      if (result.status === "error") return { ok: false, message: result.error || rule.message };
      const output = result.prints.join("\n");
      const missing = rule.printsInclude.find((part) => !output.includes(part));
      if (missing) return { ok: false, message: rule.message };
    }
    if (rule.type === "game") {
      if (!step.game) return { ok: false, message: rule.message };
      const result = runPython(code, [], hooksForGame(step.game.kind, step.game.level));
      if (result.status === "error") return { ok: false, message: result.error || rule.message };
      if (result.game?.status !== "win") return { ok: false, message: result.game?.message || rule.message };
    }
  }
  return { ok: true, message: step.success };
}

export function nextPythonCode(code: string, mission: PythonMission, nextIndex: number): string {
  const next = mission.steps[nextIndex];
  if (!next) return code;
  if (validatePythonStep(next, code).ok) return code;
  return next.starterCode;
}
