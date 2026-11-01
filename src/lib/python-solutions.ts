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
  "magic-8-ball/import": `import random
`,
  "magic-8-ball/list": `import random
answers = ["Yes", "No", "Ask again"]
`,
  "magic-8-ball/ask": `import random
answers = ["Yes", "No", "Ask again", "Definitely"]
question = input("Ask the Magic 8-Ball: ")
`,
  "magic-8-ball/choice": `import random
answers = ["Yes", "No", "Ask again", "Definitely"]
question = input("Ask the Magic 8-Ball: ")
print(random.choice(answers))
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
  "python-miner/walk": `move_right()
move_right()
`,
  "python-miner/mine": `move_right()
mine_block()
move_right()
move_right()
`,
  "python-miner/loop": `while block_ahead() != "goal":
    if block_ahead() == "dirt":
        mine_block()
    else:
        move_right()
move_right()
`,
  "python-miner/diamond": `while block_ahead() != "goal":
    if block_ahead() == "air":
        move_right()
    else:
        mine_block()
move_right()
`,
  "python-miner/build": `move_right()
mine_block()
move_right()
place_block("plank")
move_down()
move_right()
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
glide()
coast()
`,
  "flappy-bird/two": `flap()
glide()
glide()
coast()
glide()
`,
  "flappy-bird/loop": `for n in [1, 2]:
    flap()
    glide()
    coast()
`,
  "flappy-bird/sense": `while ahead() != "goal":
    gap = gap_ahead()
    if row() > gap:
        flap()
    elif row() < gap:
        coast()
    else:
        glide()
if ahead() == "goal":
    glide()
`,
  "city-drive/drive": `move_right()
move_right()
`,
  "city-drive/crate": `move_right()
shoot()
move_right()
move_right()
`,
  "city-drive/loop": `while block_ahead() != "goal":
    if block_ahead() == "crate":
        shoot()
    else:
        move_right()
move_right()
`,
  "city-drive/corner": `move_right()
move_right()
shoot()
move_right()
move_down()
move_down()
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
