const SOLUTIONS: Record<string, string> = {
  "mad-libs/var": `name = "Sam"
`,
  "mad-libs/noun": `name = "Sam"
noun = input("Give me a noun: ")
`,
  "mad-libs/verb": `name = "Sam"
noun = input("Give me a noun: ")
verb = input("Give me a verb: ")
`,
  "mad-libs/story": `name = "Sam"
noun = input("Give me a noun: ")
verb = input("Give me a verb: ")
print(f"{name} saw a {noun} and decided to {verb}!")
`,
  "checkers/slide": `move_right()
move_right()
`,
  "checkers/jump": `jump_right()
`,
  "checkers/loop": `while look_right() != "goal":
    move_right()
move_right()
`,
  "checkers/capture": `while look_right() != "goal":
    if look_right() == "black":
        jump_right()
    else:
        move_right()
move_right()
`,
  "rps/import": `import random
`,
  "rps/choices": `import random
choices = ["rock", "paper", "scissors"]
`,
  "rps/player": `import random
choices = ["rock", "paper", "scissors"]
player = input("Rock, paper, or scissors? ")
`,
  "rps/computer": `import random
choices = ["rock", "paper", "scissors"]
player = input("Rock, paper, or scissors? ")
computer = random.choice(choices)
print(computer)
`,
  "rps/compare": `import random
choices = ["rock", "paper", "scissors"]
player = input("Rock, paper, or scissors? ")
computer = random.choice(choices)
print(f"Computer chose {computer}")
if player == computer:
    print("Tie!")
elif player == "rock" and computer == "scissors":
    print("You win!")
elif player == "paper" and computer == "rock":
    print("You win!")
elif player == "scissors" and computer == "paper":
    print("You win!")
else:
    print("You lose!")
`,
  "guess/import": `import random
`,
  "guess/secret": `import random
secret = random.randint(1, 10)
`,
  "guess/while": `import random
secret = random.randint(1, 10)
guess = 0
while guess != secret:
    pass
`,
  "guess/input-int": `import random
secret = random.randint(1, 10)
guess = 0
while guess != secret:
    guess = int(input("Guess a number from 1 to 10: "))
`,
  "guess/hints": `import random
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
`,
  "hangman/word": `word = "code"
`,
  "hangman/lives": `word = "code"
lives = 6
guessed = ""
`,
  "hangman/in": `word = "code"
lives = 6
guessed = ""
letter = input("Guess a letter: ")
if letter in word:
    guessed = guessed + letter
    print("Good guess!")
else:
    lives = lives - 1
    print("Nope!")
`,
  "hangman/for": `word = "code"
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
for ch in word:
    if ch in guessed:
        shown = shown + ch
    else:
        shown = shown + "_"
`,
  "hangman/play": `word = "code"
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
`,
  "othello/drop": `play()
`,
  "othello/walk": `move_right()
move_right()
move_right()
play()
`,
  "othello/loop": `while can_play() != "yes":
    move_right()
play()
`,
  "othello/twice": `if can_play() == "yes":
    play()
move_down()
move_down()
if can_play() == "yes":
    play()
`,
  "logic-platformer/run": `run(6)
`,
  "logic-platformer/gap": `run(3)
jump()
run(3)
`,
  "logic-platformer/second-gap": `run(2)
jump()
run(1)
jump()
run(3)
`,
  "logic-platformer/timing": `run(2)
jump()
wait(0.7)
run(1)
jump()
wait(0.7)
run(3)
`,
  "flappy-bird/one": `flap()
coast()
coast()
`,
  "flappy-bird/two": `flap()
coast()
coast()
coast()
coast()
`,
  "flappy-bird/loop": `for n in [1, 2]:
    flap()
    coast()
`,
  "flappy-bird/sense": `while ahead() != "goal":
    if ahead() == "pipe":
        flap()
    else:
        coast()
coast()
`,
  "bowling/roll": `roll()
roll()
`,
  "bowling/aim": `aim_right()
roll()
roll()
roll()
`,
  "bowling/loop": `while pins_ahead() != "end":
    roll()
`,
  "bowling/spare": `while pins_ahead() != "end":
    if pins_ahead() == "gutter":
        aim_right()
    else:
        roll()
`,
  "dino-run/cactus": `jump()
run()
`,
  "dino-run/bird": `duck()
run()
`,
  "dino-run/loop": `for n in [1, 2]:
    jump()
    duck()
    run()
`,
  "dino-run/sense": `while ahead() != "goal":
    spot = ahead()
    if spot == "cactus":
        jump()
    elif spot == "bird":
        duck()
    else:
        run()
run()
`,
  "trap-quiz/lineup": `artists = ["Trannos", "Light", "Snick", "Rack"]
`,
  "trap-quiz/ask": `artists = ["Trannos", "Light", "Snick", "Rack"]
print("Greek trap quiz")
guess = input("Name one trapper: ")
`,
  "trap-quiz/check": `artists = ["Trannos", "Light", "Snick", "Rack"]
guess = ""
while not guess in artists:
    guess = input("Name one trapper: ")
    if guess in artists:
        print("Correct!")
    else:
        print("Try another name.")
`,
  "trap-quiz/score": `artists = ["Trannos", "Light", "Snick", "Rack"]
score = 0
for name in artists:
    guess = ""
    while not guess == name:
        guess = input("Name a Greek trapper: ")
        if guess == name:
            score = score + 1
            print("Correct!")
        else:
            print("Nope!")
print(score)
`,
};

export function pythonStepSolution(missionId: string, stepId: string): string {
  const code = SOLUTIONS[`${missionId}/${stepId}`];
  if (!code) throw new Error(`Missing solution for ${missionId}/${stepId}`);
  return code;
}
