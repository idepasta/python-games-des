// Hacker mystery missions: fill-in-the-blank Python puzzles. Browser-safe, pure data + checkers.
export type Step = {
  goal: string; // what the student must build
  code: string; // template; blanks written as [[0]], [[1]] ...
  answers: string[][]; // accepted answers per blank
  tools: string[]; // scattered command pieces (includes decoys)
  hint: string;
  win: string;
};
export type Mission = {
  id: string; emoji: string; title: string; story: string;
  steps: Step[];
  prompt: string; // what the terminal asks when running the finished program
  run: (input: string) => { lines: string[]; hacked: boolean };
};

export const normalize = (s: string) =>
  s.trim().replace(/'/g, '"').replace(/\s+/g, " ").replace(/\s*([=<>!+\-*(),:])\s*/g, "$1").replace(/==/g, "==");

export const checkBlank = (value: string, accepted: string[]) =>
  accepted.some((a) => normalize(a) === normalize(value));

export const checkStep = (step: Step, values: string[]) =>
  step.answers.map((acc, i) => checkBlank(values[i] ?? "", acc));

export const blankCount = (code: string) => (code.match(/\[\[\d+\]\]/g) ?? []).length;

export const missions: Mission[] = [
  {
    id: "door", emoji: "🚪", title: "Αποστολή 1: Η Μυστική Πόρτα",
    story: "Ένας μυστηριώδης hacker κλείδωσε την πόρτα του εργαστηρίου! Σε ένα χαρτάκι στο πάτωμα γράφει: «ο κωδικός είναι το ζώο της Python». Φτιάξε το πρόγραμμα της κλειδαριάς για να ανοίξει.",
    steps: [
      { goal: "Αποθήκευσε τον μυστικό κωδικό \"snake\" σε μια μεταβλητή με όνομα secret.", code: "[[0]] = [[1]]", answers: [["secret"], ['"snake"']], tools: ["secret", '"snake"', "snake", "print", "=="], hint: "Το κείμενο (string) στην Python θέλει εισαγωγικά!", win: "Σωστό! Η μεταβλητή secret κρατάει τώρα τον κωδικό 🔐" },
      { goal: "Ρώτα τον χρήστη για κωδικό και αποθήκευσέ τον στη μεταβλητή guess.", code: 'secret = "snake"\nguess = [[0]]("Κωδικός: ")', answers: [["input"]], tools: ["print", "input", "if", "guess"], hint: "Ποια εντολή ΔΙΑΒΑΖΕΙ αυτό που πληκτρολογεί ο χρήστης;", win: "Τέλεια! Το input() περιμένει να γράψει κάτι ο χρήστης ⌨️" },
      { goal: "Αν το guess είναι ίσο με το secret, τύπωσε \"ACCESS GRANTED\". Αλλιώς \"ACCESS DENIED\".", code: 'secret = "snake"\nguess = input("Κωδικός: ")\n[[0]] guess [[1]] secret:\n    print("ACCESS GRANTED")\n[[2]]:\n    [[3]]("ACCESS DENIED")', answers: [["if"], ["=="], ["else"], ["print"]], tools: ["=", "==", "if", "else", "print", "input", "elif"], hint: "Ένα = δίνει τιμή. Δύο == συγκρίνουν!", win: "Η κλειδαριά είναι έτοιμη! Δοκίμασέ την στο τερματικό 👇" },
    ],
    prompt: "Κωδικός: ",
    run: (g) => g.trim() === "snake" ? { lines: ["ACCESS GRANTED"], hacked: true } : { lines: ["ACCESS DENIED"], hacked: false },
  },
  {
    id: "safe", emoji: "🧰", title: "Αποστολή 2: Το Χρηματοκιβώτιο",
    story: "Μέσα στο εργαστήριο υπάρχει χρηματοκιβώτιο με αριθμό. Ο hacker άφησε ένα στοιχείο: «ο αριθμός είναι 7 επί 6». Φτιάξε ένα πρόγραμμα που λέει «πιο πάνω» ή «πιο κάτω» για να τον βρεις!",
    steps: [
      { goal: "Υπολόγισε τον κωδικό: βάλε στη μεταβλητή code το 7 επί 6.", code: "code = 7 [[0]] 6", answers: [["*"]], tools: ["+", "x", "*", "/"], hint: "Στην Python ο πολλαπλασιασμός ΔΕΝ γράφεται x.", win: "Σωστό! code = 42 🤫" },
      { goal: "Το input() δίνει πάντα κείμενο. Μετάτρεψέ το σε ακέραιο αριθμό.", code: "code = 7 * 6\nguess = [[0]](input(\"Αριθμός: \"))", answers: [["int"]], tools: ["str", "int", "print", "number"], hint: "integer = ακέραιος αριθμός.", win: "Μπράβο! Τώρα το guess είναι αριθμός 🔢" },
      { goal: "Αν το guess είναι μικρότερο από το code τύπωσε \"Πιο πάνω!\", αν είναι μεγαλύτερο \"Πιο κάτω!\", αλλιώς \"ΑΝΟΙΞΕ!\".", code: 'code = 7 * 6\nguess = int(input("Αριθμός: "))\nif guess [[0]] code:\n    print("Πιο πάνω!")\n[[1]] guess > code:\n    print("Πιο κάτω!")\n[[2]]:\n    print("ΑΝΟΙΞΕ!")', answers: [["<"], ["elif"], ["else"]], tools: ["<", ">", "elif", "else", "if", "=="], hint: "elif = «αλλιώς, αν…». Το else πιάνει ό,τι περισσέψει.", win: "Το χρηματοκιβώτιο περιμένει τον αριθμό σου! 👇" },
    ],
    prompt: "Αριθμός: ",
    run: (g) => {
      const n = parseInt(g, 10);
      if (Number.isNaN(n)) return { lines: ["ValueError: χρειάζομαι αριθμό!"], hacked: false };
      return n < 42 ? { lines: ["Πιο πάνω!"], hacked: false } : n > 42 ? { lines: ["Πιο κάτω!"], hacked: false } : { lines: ["ΑΝΟΙΞΕ!"], hacked: true };
    },
  },
  {
    id: "agent", emoji: "🕵️", title: "Αποστολή 3: Το Όνομα του Πράκτορα",
    story: "Μέσα στο χρηματοκιβώτιο βρήκες κάρτα: «Ο λογαριασμός του hacker είναι agent + _ + ο αριθμός του». Ένωσε τα κομμάτια για να μάθεις το όνομα χρήστη του!",
    steps: [
      { goal: "Βάλε στη μεταβλητή name το κείμενο \"agent\" και στη number το κείμενο \"007\".", code: "name = [[0]]\nnumber = [[1]]", answers: [['"agent"'], ['"007"']], tools: ['"agent"', "agent", '"007"', "007", "name"], hint: "Και τα δύο είναι κείμενο, άρα θέλουν εισαγωγικά.", win: "Σωστό! Έχεις τα δύο κομμάτια 🧩" },
      { goal: "Κόλλησε τα κομμάτια με το + : name, μετά \"_\", μετά number.", code: 'name = "agent"\nnumber = "007"\nuser = name [[0]] "_" [[1]] [[2]]', answers: [["+"], ["+"], ["number"]], tools: ["+", "+", "-", "number", "name", ","], hint: "Το + ενώνει κείμενα σαν κόλλα.", win: "Βρήκες το όνομα: agent_007 😎" },
      { goal: "Ζήτα το όνομα με input και σύγκρινέ το με το user για να μπεις στον λογαριασμό.", code: 'user = "agent_007"\nlogin = [[0]]("Όνομα χρήστη: ")\n[[1]] login == user:\n    print("Καλώς ήρθες, " + [[2]])\nelse:\n    print("Άγνωστος χρήστης")', answers: [["input"], ["if"], ["login", "user"]], tools: ["input", "print", "if", "login", "else"], hint: "Στο print μπορείς να κολλήσεις τη μεταβλητή login.", win: "Ο λογαριασμός περιμένει! 👇" },
    ],
    prompt: "Όνομα χρήστη: ",
    run: (g) => g.trim() === "agent_007" ? { lines: ["Καλώς ήρθες, agent_007"], hacked: true } : { lines: ["Άγνωστος χρήστης"], hacked: false },
  },
  {
    id: "firewall", emoji: "🧱", title: "Αποστολή 4: Το Τείχος Προστασίας",
    story: "Μπήκες στον λογαριασμό, αλλά ένα firewall ζητάει δύο πράγματα ΜΑΖΙ: το σωστό χρώμα κάρτας («blue») ΚΑΙ επίπεδο πρόσβασης τουλάχιστον 5.",
    steps: [
      { goal: "Διάβασε το χρώμα κάρτας και το επίπεδο (ως αριθμό).", code: 'card = [[0]]("Χρώμα κάρτας: ")\nlevel = [[1]](input("Επίπεδο: "))', answers: [["input"], ["int"]], tools: ["input", "int", "print", "str"], hint: "Το επίπεδο είναι αριθμός, θυμήσου την Αποστολή 2!", win: "Σωστό! Έχεις και τα δύο στοιχεία 📇" },
      { goal: "Άνοιξε ΜΟΝΟ αν card είναι \"blue\" ΚΑΙ level μεγαλύτερο ή ίσο του 5.", code: 'if card == "blue" [[0]] level [[1]] 5:\n    print("FIREWALL DOWN")\nelse:\n    print("BLOCKED")', answers: [["and"], [">="]], tools: ["and", "or", ">", ">=", "=>", "not"], hint: "and = πρέπει να ισχύουν και τα δύο. Το «μεγαλύτερο ή ίσο» γράφεται >= (όχι =>).", win: "Το firewall είναι έτοιμο για δοκιμή! 👇" },
    ],
    prompt: "Χρώμα κάρτας και επίπεδο (π.χ. blue 3): ",
    run: (g) => {
      const [card = "", lv = ""] = g.trim().split(/\s+/); const level = parseInt(lv, 10);
      if (Number.isNaN(level)) return { lines: ["ValueError: γράψε χρώμα και αριθμό, π.χ. blue 7"], hacked: false };
      return card === "blue" && level >= 5 ? { lines: ["FIREWALL DOWN"], hacked: true } : { lines: ["BLOCKED"], hacked: false };
    },
  },
  {
    id: "alarm", emoji: "🚨", title: "Αποστολή 5: Ο Συναγερμός",
    story: "Τελευταίο εμπόδιο! Ο κεντρικός υπολογιστής δίνει μόνο 3 προσπάθειες πριν χτυπήσει συναγερμός. Ο τελικός κωδικός είναι το όνομα της γλώσσας που μαθαίνεις (με μικρά). Φτιάξε τον μετρητή προσπαθειών!",
    steps: [
      { goal: "Ξεκίνα με 3 προσπάθειες στη μεταβλητή tries.", code: "tries = [[0]]", answers: [["3"]], tools: ["3", '"3"', "0", "tries"], hint: "Οι αριθμοί ΔΕΝ θέλουν εισαγωγικά.", win: "Σωστό! tries = 3 ❤️❤️❤️" },
      { goal: "Μετά από λάθος κωδικό, αφαίρεσε 1 από τις προσπάθειες.", code: 'tries = 3\nguess = input("Τελικός κωδικός: ")\nif guess != "python":\n    tries = [[0]] [[1]] 1\n    print("Λάθος! Απομένουν", tries)', answers: [["tries"], ["-"]], tools: ["tries", "guess", "-", "+", "=="], hint: "Η νέα τιμή = η παλιά τιμή μείον 1.", win: "Μπράβο! Ο μετρητής μειώνεται ⏬" },
      { goal: "Αν οι προσπάθειες γίνουν 0, χτύπα συναγερμό. Αλλιώς, αν βρήκε τον κωδικό, τύπωσε \"MISSION COMPLETE\".", code: 'if tries [[0]] 0:\n    print("🚨 ALARM!")\n[[1]] guess == [[2]]:\n    print("MISSION COMPLETE")', answers: [["=="], ["elif"], ['"python"']], tools: ["==", "=", "elif", "else", '"python"', "python"], hint: "Συγκρίνουμε με το κείμενο \"python\", με εισαγωγικά.", win: "Το τελικό πρόγραμμα είναι έτοιμο. Έχεις 3 προσπάθειες! 👇" },
    ],
    prompt: "Τελικός κωδικός: ",
    run: (g) => g.trim() === "python" ? { lines: ["MISSION COMPLETE 🏆"], hacked: true } : { lines: ["Λάθος!"], hacked: false },
  },
];
