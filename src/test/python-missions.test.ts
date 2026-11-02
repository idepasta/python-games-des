import { describe, expect, it } from "vitest";
import { showHintButton, showSolution } from "@/lib/hint-gate";
import { pythonStepSolution } from "@/lib/python-solutions";
import { pythonMissions, validatePythonStep } from "@/lib/python-missions";
import { runPython } from "@/lib/python-vm";

describe("hint button", () => {
  it("stays hidden until the third miss on this step", () => {
    expect(showHintButton(0)).toBe(false);
    expect(showHintButton(2)).toBe(false);
    expect(showHintButton(3)).toBe(true);
    expect(showSolution(4)).toBe(false);
    expect(showSolution(5)).toBe(true);
  });
});

const madLibs = `name = "Spider-Man"
noun = input("Drop a silly object 🍕: ")
verb = input("Drop a wild verb 💃: ")
print(f"🦸 Breaking news: {name} yeeted a {noun} and had to {verb} on live TV! 😂")
`;

const eightBall = `import random
answers = ["Yes", "No", "Ask again", "Definitely"]
question = input("Ask the Magic 8-Ball: ")
print(random.choice(answers))
`;

const rps = `import random
choices = ["rock", "paper", "scissors"]
player = input("🪨 Rock, 📄 paper, or ✂️ scissors? ")
computer = random.choice(choices)
print(f"You played {player}")
print(f"Computer chose {computer}")
if player == computer:
    print("Tie! 🤝")
elif player == "rock" and computer == "scissors":
    print("You win! 🎉")
elif player == "paper" and computer == "rock":
    print("You win! 🎉")
elif player == "scissors" and computer == "paper":
    print("You win! 🎉")
else:
    print("You lose! 😬")
`;

const guess = `import random
secret = random.randint(1, 10)
guess = 0
while guess != secret:
    guess = int(input("Guess a number from 1 to 10: "))
    if guess < secret:
        print("Too low!")
    elif guess > secret:
        print("Too high!")
    else:
        print("You got it!")
`;

const hangman = `word = "code"
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
    if shown == word:
        print("You won!")
        break
`;

describe("python mini interpreter", () => {
  it("maps print and input, including f-strings", () => {
    const result = runPython(madLibs, ["dragon", "dance"]);
    expect(result.status).toBe("done");
    expect(result.prints.join(" ")).toContain("🦸 Breaking news: Spider-Man yeeted a dragon and had to dance on live TV! 😂");
  });

  it("pauses on input until an answer is given", () => {
    const waiting = runPython('name = input("Who? ")\nprint(name)\n');
    expect(waiting.status).toBe("waiting");
    expect(waiting.prompt).toBe("Who? ");
  });

  it("picks from a list with random.choice", () => {
    const result = runPython(eightBall, ["Will it work?"], { choice: (items) => items[0]! });
    expect(result.prints).toEqual(["Yes"]);
  });

  it("runs if/elif/else for rock paper scissors", () => {
    const win = runPython(rps, ["rock"], { choice: () => "scissors" });
    expect(win.prints.join("\n")).toContain("You win!");
    const tie = runPython(rps, ["paper"], { choice: () => "paper" });
    expect(tie.prints.join("\n")).toContain("Tie!");
  });

  it("runs a while loop for guess the number", () => {
    const result = runPython(guess, ["1", "7"], { randint: () => 7 });
    expect(result.prints).toEqual(["Too low!", "You got it!"]);
  });

  it("tracks lives and letters for hangman", () => {
    const result = runPython(hangman, ["c", "x", "o", "d", "e"]);
    expect(result.status).toBe("done");
    expect(result.prints.join("\n")).toContain("Nope!");
    expect(result.prints.join("\n")).toContain("You won!");
  });

  it("blocks dangerous names", () => {
    expect(runPython("eval('1')\n").status).toBe("error");
  });

  it("reads ASCII codes and converts input text to int and float", () => {
    expect(runPython('print(ord("A"))\nprint(chr(72))\n').prints).toEqual(["65", "H"]);
    const glued = runPython("raw = input()\nprint(raw + raw)\n", ["7"]);
    expect(glued.prints).toEqual(["77"]);
    const whole = runPython('n = int(input())\nprint(n + 1)\n', ["7"]);
    expect(whole.prints).toEqual(["8"]);
    const decimal = runPython('n = float(input())\nprint(n * 2)\n', ["2.5"]);
    expect(decimal.prints).toEqual(["5"]);
    expect(runPython('print(int("2.5"))\n').status).toBe("error");
  });
});

describe("python mission curriculum", () => {
  it("has five text games plus the canvas games", () => {
    expect(pythonMissions.map((m) => m.id)).toEqual([
      "mad-libs",
      "ascii-decoder",
      "checkers",
      "rps",
      "guess",
      "hangman",
      "othello",
      "logic-platformer",
      "flappy-bird",
      "bowling",
      "dino-run",
      "trap-quiz",
    ]);
  });

  it("rejects each step starter until the kid fills it in", () => {
    for (const mission of pythonMissions) {
      for (const step of mission.steps) {
        expect(validatePythonStep(step, step.starterCode).ok, `${mission.id}/${step.id}`).toBe(false);
      }
    }
  });

  it("accepts the taught solution for every step", () => {
    for (const mission of pythonMissions) {
      mission.steps.forEach((step) => {
        const code = pythonStepSolution(mission.id, step.id);
        const check = validatePythonStep(step, code);
        expect(check.ok, `${mission.id}/${step.id}: ${check.message}`).toBe(true);
      });
    }
  });

  it("accepts complete solutions on the last step of each mission", () => {
    const checkersCapture = `while look_right() != "goal":
    if look_right() == "black":
        jump_right()
    else:
        move_right()
move_right()
`;
    const othelloTwice = `if can_play() == "yes":
    play()
move_down()
move_down()
if can_play() == "yes":
    play()
`;
    const platformTiming = `run(2)
jump()
wait(0.7)
run(1)
jump()
wait(0.7)
run(3)
`;
    const asciiFloat = `price = float(input("Price: "))
print(price * 2)
`;
    const solutions = [madLibs, asciiFloat, checkersCapture, rps, guess, hangman, othelloTwice, platformTiming];
    pythonMissions.slice(0, solutions.length).forEach((mission, i) => {
      const last = mission.steps[mission.steps.length - 1]!;
      const check = validatePythonStep(last, solutions[i]!);
      expect(check.ok, `${mission.id}: ${check.message}`).toBe(true);
    });
  });
});
