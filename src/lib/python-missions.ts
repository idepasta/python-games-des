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
  game?: { kind: "checkers" | "othello" | "platformer" | "flappy" | "bowling" | "dino"; level: number };
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
    emoji: "🦸",
    title: "Mad Libs",
    teaser: "Variables, input(), and f-strings",
    story: `Write a chaotic news flash about a superhero.
Pick a hero or a funny character, such as Spider-Man 🕷️, Deadpool 🟥, Shrek 🟢, or SpongeBob 🧽.
The phone asks for a silly object 🍕 and a wild verb 💃.
Then print() mash those words into one sentence with emojis.
Tap the pictures on the phone, or type your own words.
The weirder the combo, the better.`,
    steps: [
      {
        id: "var",
        title: "Pick a hero",
        prompt: "Create a variable called name and set it to a quoted hero or funny character, such as \"Spider-Man\", \"Deadpool\", or \"Shrek\".",
        hint: "Write name = \"Spider-Man\"",
        success: "Your hero is stored! 🦸",
        starterCode: `# Superhero Mad Libs
# Store a hero or a funny character.
name = 
`,
        rules: [
          regex("name\\s*=\\s*['\"][^'\"]+['\"]", "Set name to a quoted hero, like name = \"Spider-Man\"."),
        ],
      },
      {
        id: "noun",
        title: "Ask for a silly object",
        prompt: "Use input() to ask for a noun (a thing, like pizza or rubber duck) and save it in noun. The phone shows emoji buttons for this question.",
        hint: 'Write noun = input("Drop a silly object 🍕: ")',
        success: "The phone can now ask for chaos! 🍕",
        starterCode: `name = "Spider-Man"
# Ask for a silly object.
noun = 
`,
        rules: [
          includes("input(", "Call input() so the phone can ask a question."),
          includes("noun", "Save the answer in a variable named noun."),
        ],
      },
      {
        id: "verb",
        title: "Ask for a wild verb",
        prompt: "Ask for a verb (an action, like moonwalk or yeet) and save it in verb using input().",
        hint: 'Write verb = input("Drop a wild verb 💃: ")',
        success: "Two questions are ready. 💃",
        starterCode: `name = "Spider-Man"
noun = input("Drop a silly object 🍕: ")
# Ask for a wild verb too.
verb = 
`,
        rules: [
          regex("verb\\s*=\\s*input\\s*\\(", "Save the second answer with verb = input(...)."),
        ],
      },
      {
        id: "story",
        title: "Print the news flash",
        prompt: "Use an f-string and print() to mash name, noun, and verb into one chaotic sentence. Put at least one emoji in the printed story.",
        hint: 'Write print(f"🦸 Breaking news: {name} yeeted a {noun} and had to {verb} on live TV! 😂")',
        success: "The news flash is live. Try it on the phone! 📺",
        starterCode: `name = "Spider-Man"
noun = input("Drop a silly object 🍕: ")
verb = input("Drop a wild verb 💃: ")
# Mash the words into one sentence with emojis.
print()
`,
        rules: [
          includes("print(", "Call print() to show the story on the phone."),
          includesAny(["f\"", "f'"], "Use an f-string so variables go inside the sentence."),
          includes("{name}", "Put {name} inside the f-string."),
          includes("{noun}", "Put {noun} inside the f-string."),
          includes("{verb}", "Put {verb} inside the f-string."),
          includesAny(["🦸", "😂", "😱", "💥", "💀", "✨", "📺", "🍕", "🕷️"], "Put at least one emoji in the printed story."),
          run(
            ["rubber duck", "moonwalk"],
            ["rubber duck", "moonwalk"],
            "Run the story so print() shows the noun and the verb.",
          ),
        ],
      },
    ],
  },
  {
    id: "ascii-decoder",
    emoji: "🔡",
    title: "ASCII Decoder",
    teaser: "ASCII, input() text, int(), and float()",
    story: `Computers store every letter as a number. That number system is called ASCII.
A is 65. H is 72. I is 73. S is 83. a is 97.
ord("A") reads the number. chr(65) turns a number back into A.
input() always gives text, even if you type 7 or 65.
int() turns text into a whole number so you can do math.
float() turns text into a decimal, like 2.5.
Tap a letter or a code on the phone, then decode the secret.`,
    steps: [
      {
        id: "ord",
        title: "Read a letter's number",
        prompt: "Print the ASCII number for A with print(ord(\"A\")).",
        hint: 'Write print(ord("A"))',
        success: "A is 65. Every letter has a number.",
        starterCode: `# Every letter has a secret number.
print()
`,
        rules: [
          includes("ord(", "Call ord() to read a letter's ASCII number."),
          includes('"A"', 'Pass "A" to ord().'),
          includes("print(", "Print the number so it shows on the phone."),
          run([], ["65"], "print(ord(\"A\")) should show 65."),
        ],
      },
      {
        id: "chr",
        title: "Turn a number into a letter",
        prompt: "Decode 72 and 73. Print chr(72), then print chr(73), so the phone shows H then I.",
        hint: "print(chr(72)) on one line, then print(chr(73)).",
        success: "72 and 73 decode to HI.",
        starterCode: `print(chr(65))
`,
        rules: [
          includes("chr(72)", "Call chr(72) to get H."),
          includes("chr(73)", "Call chr(73) to get I."),
          run([], ["H", "I"], "The phone should print H and then I."),
        ],
      },
      {
        id: "text",
        title: "input() is always text",
        prompt: "Ask for a number with input() and save it in raw. Print raw + raw. If the player types 7, the phone should show 77, because the two answers are still words glued together.",
        hint: 'raw = input("Type 7: ") then print(raw + raw)',
        success: "7 + 7 became 77. That is text, not math.",
        starterCode: `raw = input("Type 7: ")
print(raw)
`,
        rules: [
          includes("input(", "Call input() to read the typed number as text."),
          includes("raw", "Save the answer in raw."),
          includes("raw + raw", "Glue the text to itself with raw + raw."),
          run(["7"], ["77"], "Typing 7 should print 77, because input() is text."),
        ],
      },
      {
        id: "int",
        title: "Convert with int()",
        prompt: "Ask for an ASCII code with int(input(...)), save it in code, then print(chr(code)). Typing 83 should print S.",
        hint: 'code = int(input("Type an ASCII code: ")) then print(chr(code))',
        success: "int() turned the text into a number, then chr() decoded S.",
        starterCode: `raw = input("Type an ASCII code: ")
print(raw)
`,
        rules: [
          includes("int(", "Wrap input() with int() so the code is a whole number."),
          includes("input(", "Read the typed code with input()."),
          includes("chr(", "Decode the number with chr()."),
          run(["83"], ["S"], "Typing 83 should print S."),
        ],
      },
      {
        id: "float",
        title: "Convert with float()",
        prompt: "Ask for a decimal price with float(input(...)), save it in price, then print price * 2. Typing 2.5 should print 5.",
        hint: 'price = float(input("Price: ")) then print(price * 2)',
        success: "float() turned the text into a decimal, so the math worked.",
        starterCode: `price = input("Price: ")
print(price)
`,
        rules: [
          includes("float(", "Wrap input() with float() so the price is a decimal."),
          includes("input(", "Read the typed price with input()."),
          includes("* 2", "Multiply the price by 2."),
          run(["2.5"], ["5"], "Typing 2.5 should print 5 after float() math."),
        ],
      },
    ],
  },
  {
    id: "checkers",
    emoji: "🟥",
    title: "Checkers",
    teaser: "Diagonal slides and jumps",
    story: `Checkers is played on the dark squares.
You move the red piece diagonally forward, toward the top of the board.
move_left() and move_right() slide one dark square.
jump_left() and jump_right() hop over a black piece and capture it.
A jump only works when the next diagonal square holds a black piece and the landing square is open.
Light squares and the edge of the board are not legal landings.
Reach the yellow square to finish the level. The black pieces do not move.`,
    steps: [
      {
        id: "slide",
        title: "Slide to the yellow square",
        prompt: "The yellow square is two diagonal steps forward-right. Call move_right() until the red piece lands on it.",
        hint: "Write move_right() on two lines.",
        success: "The red piece reached the yellow square.",
        starterCode: `# Slide diagonally toward the yellow square.
move_right()
`,
        game: { kind: "checkers", level: 1 },
        rules: [
          includes("move_right()", "Call move_right() to slide diagonally forward."),
          game("The red piece has not reached the yellow square yet."),
        ],
      },
      {
        id: "jump",
        title: "Jump a black piece",
        prompt: "A black piece sits on the next diagonal square. jump_right() hops over it and lands on the yellow square.",
        hint: "Write jump_right() on its own line.",
        success: "You captured the black piece.",
        starterCode: `# Hop over the black piece.
move_right()
`,
        game: { kind: "checkers", level: 2 },
        rules: [
          includes("jump_right()", "Call jump_right() to hop over the black piece."),
          game("Jump the black piece and land on the yellow square."),
        ],
      },
      {
        id: "loop",
        title: "Keep sliding",
        prompt: "The yellow square is straight up the forward-right diagonal. Loop while look_right() is not \"goal\", and move_right() each time. After the loop, move_right() onto the yellow square.",
        hint: 'while look_right() != "goal": then move_right(). One more move_right() after the loop.',
        success: "The loop carried the piece to the yellow square.",
        starterCode: `# Stop when the yellow square is the next diagonal step.
while look_right() != "goal":
    move_left()
`,
        game: { kind: "checkers", level: 3 },
        rules: [
          includes("while ", "Use a while loop so you do not write every slide by hand."),
          includes("look_right()", "Look with look_right() before each slide."),
          includes("move_right()", "Slide with move_right()."),
          game("Slide until the red piece stands on the yellow square."),
        ],
      },
      {
        id: "capture",
        title: "Slide or capture",
        prompt: "Some steps are empty and one step has a black piece. While look_right() is not \"goal\", jump_right() when it is \"black\" and move_right() otherwise. After the loop, move_right() onto the yellow square.",
        hint: 'if look_right() == "black": jump_right(). else: move_right(). Then one more move_right().',
        success: "You captured the piece and reached the yellow square.",
        starterCode: `while look_right() != "goal":
    move_right()
`,
        game: { kind: "checkers", level: 4 },
        rules: [
          includes("if ", "Use if so a black piece is captured and an empty square is a slide."),
          includes("jump_right()", "jump_right() captures the black piece."),
          includes("look_right()", "Decide with look_right()."),
          game("Capture the black piece, then stand on the yellow square."),
        ],
      },
    ],
  },
  {
    id: "rps",
    emoji: "✂️",
    title: "Rock, Paper, Scissors",
    teaser: "if / elif / else and comparing variables",
    story: `You play the phone at Rock, Paper, Scissors.
🪨 rock beats ✂️ scissors.
📄 paper beats 🪨 rock.
✂️ scissors beats 📄 paper.
Tap a picture when the phone asks. The same move is a tie.
Your Python compares the words rock, paper, and scissors, then prints who won.`,
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
        prompt: "Ask the player for a move with input() and save it in player. The phone shows 🪨 📄 ✂️ buttons for this question.",
        hint: 'Write player = input("🪨 Rock, 📄 paper, or ✂️ scissors? ")',
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
player = input("🪨 Rock, 📄 paper, or ✂️ scissors? ")
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
        prompt: "Use if, elif, and else to print Tie! 🤝, You win! 🎉, or You lose! 😬 by comparing player and computer.",
        hint: "Start with if player == computer: then add elif rules for winning moves, and else for losing.",
        success: "The game can decide a winner!",
        starterCode: `import random
choices = ["rock", "paper", "scissors"]
player = input("🪨 Rock, 📄 paper, or ✂️ scissors? ")
computer = random.choice(choices)
print(f"You played {player}")
print(f"Computer chose {computer}")
# Compare player and computer.
if player == computer:
    print("Tie! 🤝")
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
    id: "othello",
    emoji: "⚫",
    title: "Othello",
    teaser: "Flip discs between your own",
    story: `Othello uses black and white discs.
You play white. The cursor shows where you will drop a disc.
move_up(), move_down(), move_left(), and move_right() move the cursor.
play() drops a white disc on the cursor square.
The new disc must trap at least one black disc in a straight line against another white disc.
Trapped black discs flip to white.
can_play() is "yes" on a legal square. square() reads the cursor. Clear every black disc to win.`,
    steps: [
      {
        id: "drop",
        title: "Drop one disc",
        prompt: "The cursor is already on a legal square. Call play() to flip the black disc between your white discs.",
        hint: "Write play() on its own line.",
        success: "The black disc flipped to white.",
        starterCode: `# The cursor is on a legal square.
move_right()
`,
        game: { kind: "othello", level: 1 },
        rules: [
          includes("play()", "Call play() to drop a white disc."),
          game("Flip the black disc."),
        ],
      },
      {
        id: "walk",
        title: "Walk to the corner",
        prompt: "The legal square is three steps to the right. move_right() until the cursor is there, then play().",
        hint: "Three move_right() calls, then play().",
        success: "Both black discs flipped.",
        starterCode: `move_right()
`,
        game: { kind: "othello", level: 2 },
        rules: [
          includes("play()", "Call play() when the cursor is on the legal square."),
          includes("move_right()", "Walk right with move_right()."),
          game("Reach the corner and flip both black discs."),
        ],
      },
      {
        id: "loop",
        title: "Search for a legal square",
        prompt: "Keep moving right while can_play() is not \"yes\". When the cursor finds a legal square, play().",
        hint: 'while can_play() != "yes": move_right(). Then play().',
        success: "The loop found the corner and flipped both discs.",
        starterCode: `while can_play() != "yes":
    move_right()
`,
        game: { kind: "othello", level: 3 },
        rules: [
          includes("while ", "Use a while loop to search the row."),
          includes("can_play()", "Ask can_play() before you drop a disc."),
          includes("play()", "play() when can_play() is \"yes\"."),
          game("Find the legal square, then flip every black disc."),
        ],
      },
      {
        id: "twice",
        title: "Play two squares",
        prompt: "The cursor starts on a legal square. If can_play() is \"yes\", play(). Move down twice, then check can_play() again and play() the second square.",
        hint: 'if can_play() == "yes": play(). Then move_down() twice and repeat the if.',
        success: "Both lines of black discs flipped.",
        starterCode: `move_down()
play()
`,
        game: { kind: "othello", level: 4 },
        rules: [
          includes("if ", "Use if so you only play() on a legal square."),
          includes("can_play()", "Check can_play() before each play()."),
          includes("play()", "Drop a disc on each legal square."),
          includes("move_down()", "Move down to the second line."),
          game("Flip both black discs."),
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
    teaser: "flap() up, coast() forward",
    story: `The bird flies right, one square at a time.
flap() hops up one row and forward one square.
coast() glides forward and stays on the same row.
Green blocks are pipes. Flying into a pipe ends the run.
ahead() tells you the next square: "pipe", "air", or "goal".
Reach a yellow ring to finish. The sky above the pipes is open, so one hop is enough.`,
    steps: [
      {
        id: "one",
        title: "Hop, then coast",
        prompt: "A pipe blocks your row. flap() once to hop above it, then coast() forward onto a yellow ring.",
        hint: "flap(), then coast() twice.",
        success: "The bird reached a yellow ring.",
        starterCode: `# Hop over the pipe, then coast to the ring.
flap()
`,
        game: { kind: "flappy", level: 1 },
        rules: [
          includes("flap()", "Call flap() to hop over the pipe."),
          includes("coast()", "Call coast() to glide forward."),
          game("The bird has not reached a yellow ring yet."),
        ],
      },
      {
        id: "two",
        title: "Coast across the sky",
        prompt: "flap() once over the pipe, then coast() along the open row until you reach a yellow ring.",
        hint: "flap() once, then four coast() calls.",
        success: "The bird coasted to the ring.",
        starterCode: `flap()
`,
        game: { kind: "flappy", level: 2 },
        rules: [
          includes("flap()", "Hop with flap() before the pipe."),
          includes("coast()", "coast() glides forward on the same row."),
          game("Coast to a yellow ring after the hop."),
        ],
      },
      {
        id: "loop",
        title: "Repeat flap and coast",
        prompt: "The same two commands clear this sky. Loop over [1, 2]. Each time, flap() then coast().",
        hint: "for n in [1, 2]: then flap() and coast().",
        success: "The loop reached the yellow ring.",
        starterCode: `for n in [1, 2]:
    flap()
`,
        game: { kind: "flappy", level: 3 },
        rules: [
          includes("for ", "Use a for loop so you do not write every hop by hand."),
          includes("flap()", "flap() hops up."),
          includes("coast()", "coast() glides forward after each hop."),
          game("Reach a yellow ring."),
        ],
      },
      {
        id: "sense",
        title: "Flap only at a pipe",
        prompt: "While ahead() is not \"goal\", flap() if the next square is a pipe. Otherwise coast(). After the loop, coast() onto the ring.",
        hint: 'if ahead() == "pipe": flap(). else: coast(). Then one more coast().',
        success: "The bird hopped the pipe and coasted to the ring.",
        starterCode: `while ahead() != "goal":
    coast()
`,
        game: { kind: "flappy", level: 4 },
        rules: [
          includes("while ", "Keep flying with a while loop."),
          includes("ahead()", "Look with ahead() before each move."),
          includes("flap()", "flap() when the next square is a pipe."),
          includes("coast()", "coast() when the next square is open."),
          game("Hop the pipe, then coast onto a yellow ring."),
        ],
      },
    ],
  },
  {
    id: "bowling",
    emoji: "🎳",
    title: "Bowling",
    teaser: "Aim the ball and roll",
    story: `Bowling rolls a ball up a wooden lane toward the pins.
roll() moves the ball one step forward.
aim_left() and aim_right() slide the ball sideways.
A pin you touch falls down, and pins touching it fall too.
Dark squares are gutters. Rolling into a gutter ends the turn.
pins_ahead() reads the next square: "pin", "lane", "gutter", or "end". Knock down every pin.`,
    steps: [
      {
        id: "roll",
        title: "Roll straight",
        prompt: "The pins are straight ahead. Call roll() until the ball hits them.",
        hint: "Write roll() on two lines.",
        success: "Every pin fell.",
        starterCode: `# Roll toward the pins.
roll()
`,
        game: { kind: "bowling", level: 1 },
        rules: [
          includes("roll()", "Call roll() to send the ball forward."),
          game("The pins are still standing."),
        ],
      },
      {
        id: "aim",
        title: "Aim, then roll",
        prompt: "Straight ahead is a gutter. aim_right() so the ball lines up with the pin, then roll() until it falls.",
        hint: "aim_right(), then roll() three times.",
        success: "The pin fell.",
        starterCode: `roll()
`,
        game: { kind: "bowling", level: 2 },
        rules: [
          includes("aim_right()", "Call aim_right() before you roll into the gutter."),
          includes("roll()", "roll() sends the ball toward the pin."),
          game("Line up the pin, then knock it down."),
        ],
      },
      {
        id: "loop",
        title: "Roll until the end",
        prompt: "Keep rolling while pins_ahead() is not \"end\". The center pin knocks down the pins beside it.",
        hint: 'while pins_ahead() != "end": roll()',
        success: "The loop cleared the pins.",
        starterCode: `while pins_ahead() != "end":
    aim_left()
`,
        game: { kind: "bowling", level: 3 },
        rules: [
          includes("while ", "Use a while loop for the whole lane."),
          includes("pins_ahead()", "Look with pins_ahead() before each roll."),
          includes("roll()", "roll() moves the ball forward."),
          game("Knock down every pin."),
        ],
      },
      {
        id: "spare",
        title: "Steer around the gutter",
        prompt: "Roll while the next square is lane or a pin. If pins_ahead() is \"gutter\", aim_right() instead. Stop when pins_ahead() is \"end\".",
        hint: 'while pins_ahead() != "end": if pins_ahead() == "gutter": aim_right(). else: roll().',
        success: "You steered around the gutter and got the spare.",
        starterCode: `while pins_ahead() != "end":
    roll()
`,
        game: { kind: "bowling", level: 4 },
        rules: [
          includes("while ", "Keep going with a while loop."),
          includes("if ", "Use if so a gutter means aim and an open lane means roll."),
          includes("pins_ahead()", "Read pins_ahead() before you choose."),
          includes("aim_right()", "aim_right() slides away from the gutter."),
          includes("roll()", "roll() when the next square is safe."),
          game("Avoid the gutter and knock the pin down."),
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
    story: "Build a phone quiz about four Greek trap artists: Trannos, Light, Snik, and Rack. The phone asks for a name and checks it against the lineup.",
    steps: [
      {
        id: "lineup",
        title: "Store the lineup",
        prompt: "Make a list called artists with these four names, in quotes: Trannos, Light, Snik, Rack.",
        hint: 'artists = ["Trannos", "Light", "Snik", "Rack"]',
        success: "The lineup is stored.",
        starterCode: `# Greek trap quiz
artists = 
`,
        rules: [
          includes("artists", "Name the list artists."),
          includes("Trannos", "Put Trannos in the list."),
          includes("Light", "Put Light in the list."),
          includes("Snik", "Put Snik in the list."),
          includes("Rack", "Put Rack in the list."),
        ],
      },
      {
        id: "ask",
        title: "Ask for a name",
        prompt: "Print Greek trap quiz, then use input() to ask for a trapper and save the answer in guess.",
        hint: 'print("Greek trap quiz") and guess = input("Name one trapper: ")',
        success: "The phone can ask the first question.",
        starterCode: `artists = ["Trannos", "Light", "Snik", "Rack"]
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
        starterCode: `artists = ["Trannos", "Light", "Snik", "Rack"]
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
        starterCode: `artists = ["Trannos", "Light", "Snik", "Rack"]
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
          run(["Nope", "Trannos", "Light", "Snik", "Rack"], ["Nope!", "Correct!", "4"], "A wrong name should ask again, then four matches score 4."),
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
