export type Lesson = { emoji: string; title: string; how: string; p1: string; p2: string; concepts: string[]; glitch: string };

export const lessons: Lesson[] = [
{ emoji: "🚦", title: "The Smart Traffic Light",
how: `Real traffic lights do not just use timers. They use inductive wire loops buried in the asphalt. When a massive metal car drives over the loop, it alters the magnetic field. The computer (microcontroller) reads this as a "1" and changes the light.`,
p1: `car_waiting = input("Is there a car waiting? (yes/no): ")

if car_waiting == "yes":
    print("Traffic Light: GREEN 🟢 - Let the car pass!")
else:
    print("Traffic Light: RED 🔴 - Saving energy.")`,
p2: `import time, random

while True:
    # Simulating a magnetic road sensor reading (1 = car, 0 = no car)
    sensor_reading = random.choice([0, 1])

    if sensor_reading == 1:
        print("Sensor triggered! Changing lights to GREEN 🟢 for 5 seconds.")
        time.sleep(5) # Pause to let cars pass
        print("Changing back to RED 🔴.")
    else:
        print("Road is clear. Light remains RED 🔴.")

    time.sleep(2)`,
concepts: [`input() is how the computer asks the human a question. The if / else statement is the core of Artificial Intelligence—it is how the computer makes a decision based on the answer!`,
`while True: creates an "infinite loop". Real machines never turn off; they loop forever! However, computers calculate millions of times a second. We use time.sleep(2) to force the computer's brain to pause for 2 seconds so it doesn't overheat and crash!`],
glitch: `Sometimes, carbon-fiber bicycles or small scooters do not have enough metal mass to trigger the magnetic field. Riders can get stuck at an empty red light forever until a bigger, heavier car pulls up behind them to trigger the sensor!` },

{ emoji: "🔋", title: "EV Cold Weather Range Estimator",
how: `Lithium-ion batteries rely on chemical reactions. In freezing temperatures, these reactions slow down. An EV’s Battery Management System (BMS) uses a thermistor to measure the battery pack's temperature and mathematically reduces your estimated range on the dashboard so you don't get stranded.`,
p1: `temp = int(input("Outside temperature in Celsius: "))
battery = 100

if temp < 0:
    print("Warning: Freezing temps. Battery range reduced by 20%.")
    battery = battery - 20

print(f"Usable battery: {battery}%")`,
p2: `def calculate_real_range(base_range, outside_temp):
    if outside_temp >= 15:
        efficiency = 1.0 # 100% efficient
    else:
        # Drops by 2% for every degree below 15C
        drop = (15 - outside_temp) * 0.02
        efficiency = 1.0 - drop

    actual_range = base_range * efficiency
    return actual_range

print(f"Normal Range: 400km. Real Range at -5°C: {calculate_real_range(400, -5)}km")`,
concepts: [`Everything a user types into an input() is read as text (like a word). The int() command stands for Integer. It magically converts the word you typed into a real math number so the computer can do calculations with it.`,
`def creates a custom Function. Think of a function like a mini-robot inside your code. You hand it two raw materials (the range and the temperature), it does complex math inside its belly, and it returns the final answer back to you!`],
glitch: `(The Arachova Chaos) In extreme cold and snow (like the severe winter storms in Arachova and Mount Parnassos in Greece), many drivers miscalculated how much the freezing temperatures and cabin heating would slash their EV range. The batteries stalled in the middle of the road, causing massive traffic jams! Drivers literally had to push dead electric cars out of the snow.` },

{ emoji: "🧴", title: "Automatic Hand Sanitizer Dispenser",
how: `An Infrared (IR) distance sensor shoots out a tiny beam of invisible light. If a hand is placed underneath, the light bounces back to the receiver. The Arduino calculates the distance. If distance < 10cm, it triggers a mini water pump for exactly 1 second.`,
p1: `distance = int(input("How close is the hand in cm? "))

if distance < 10:
    print("PUMP ON: Dispensing gel.")`,
p2: `import time, random

while True:
    ir_distance_cm = random.randint(2, 30)
    print(f"IR Sensor reads: {ir_distance_cm} cm")

    if ir_distance_cm < 10:
        print("🖐️ Hand detected! Engaging servo motor...")
        time.sleep(1) # Pump squirts for exactly 1 second
        print("Servo stopped. Waiting 3 seconds to prevent spamming.")
        time.sleep(3) # Anti-spam delay!

    time.sleep(1)`,
concepts: [`The < symbol is a comparison operator. It asks the computer a simple True/False question: "Is the number on the left smaller than the number on the right?"`],
glitch: `In 2017, a viral video from a tech company showed a soap dispenser that worked perfectly for white hands but refused to dispense for a dark-skinned employee. The engineers used cheap infrared sensors and only tested them on light skin. Darker pigmentation absorbs more light, meaning the sensor couldn't detect the reflection. This is a huge CS lesson on why diverse teams must calibrate sensors!` },

{ emoji: "📸", title: "The Speed Camera Radar",
how: `A speed camera uses the Doppler Effect (bouncing radar waves off your car). The computer measures how fast the waves bounce back to calculate your speed. If speed > limit, it triggers a high-voltage relay to fire the camera flash.`,
p1: `speed = int(input("Enter vehicle speed: "))
limit = 100

if speed > limit:
    print("📸 FLASH! Ticket issued.")`,
p2: `import random, time

limit = 100

while True:
    vehicle_speed = random.randint(60, 140)
    print(f"Vehicle detected traveling at {vehicle_speed} km/h.")

    if vehicle_speed > limit:
        fine = (vehicle_speed - limit) * 5 # €5 for every km over the limit
        print(f"📸 FLASH! Speeding violation. Fine: €{fine}")
    else:
        print("Vehicle speed acceptable.")

    time.sleep(3)`,
concepts: [`random.randint(60, 140) tells the computer to roll a massive, invisible multi-sided dice to pick a random integer (whole number) anywhere between 60 and 140. It is great for simulating unpredictable real-world events!`],
glitch: `Radars only measure speed; they don't know what is flying past! A speed camera in Switzerland once caught a duck flying 52 km/h in a 30 km/h zone. In Germany, a pigeon triggered a camera flash while flying 45 km/h, resulting in the police hilariously printing out a 25-euro speeding ticket for the bird!` },

{ emoji: "🚪", title: "Automatic Supermarket Sliding Doors",
how: `Above the sliding doors is a PIR (Passive Infrared) sensor. It does not see "people"; it detects moving blobs of heat. When triggered, the microcontroller activates an electric motor to pull the doors apart.`,
p1: `motion = input("Did someone walk up to the door? (yes/no): ")

if motion == "yes":
    print("Opening sliding doors...")`,
p2: `import time, random

while True:
    motion_detected = random.choice([True, False])

    if motion_detected:
        print("🚶 Heat signature detected! Activating motor to OPEN doors.")
        print("Holding doors open for 4 seconds...")
        time.sleep(4) # Keep motor engaged so nobody gets crushed
        print("Closing doors safely.")
    else:
        print("No movement. Doors remain closed.")

    time.sleep(2)`,
concepts: [`True and False are called Booleans. They are the absolute core of all computer logic, acting just like digital ON and OFF switches inside the processor.`],
glitch: `Supermarkets frequently experience "Ghost Openings." If a sudden burst of hot air from a street vent or a bright beam of sunlight suddenly hits the PIR sensor, the rapid temperature change tricks the computer into thinking a human walked by, causing the doors to slide open for nobody!` },

{ emoji: "🌡️", title: "The Smart Thermostat (HVAC Control)",
how: `Inside a smart thermostat is a digital thermometer chip. It constantly polls the room temperature. However, you never want the heater to flicker on and off rapidly. You use "Hysteresis" (a deadband zone) so the heater turns on at 20°C and stays on until it reaches 24°C.`,
p1: `target_temp = 22
current_temp = int(input("What is the room temperature? "))

if current_temp < target_temp:
    print("🔥 Heating ON.")
elif current_temp > target_temp:
    print("❄️ Air Conditioning ON.")`,
p2: `import time

room_temp = 18 # Starting cold

while True:
    print(f"Room Temperature is {room_temp}°C")

    if room_temp < 20:
        print("🔥 Activating Boiler. Heating the room...")
        room_temp = room_temp + 2
    elif room_temp >= 24:
        print("🛑 Target reached. Boiler OFF.")
        room_temp = room_temp - 1
    else:
        # Deadband: Do nothing between 20 and 24 to save the machine!
        print("Standby mode.")
        room_temp = room_temp - 1

    time.sleep(2)`,
concepts: [`elif stands for Else-If. It allows the computer to check multiple different conditions in a row. "If it's cold do X, else if it's hot do Y."`],
glitch: `In January 2016, a massive software bug hit Google Nest smart thermostats. The buggy code accidentally drained the device's internal battery, causing the computer to shut down entirely. Because the "brain" died, it disconnected from the boiler, leaving thousands of people freezing in their homes in the middle of winter!` },

{ emoji: "🪴", title: "The Smart Plant Watering System",
how: `Water conducts electricity. A soil sensor has two metal prongs. If the soil is dry, electricity struggles to cross the gap (high resistance). The computer reads this resistance and turns on a water pump.`,
p1: `soil_moisture = int(input("What is the soil moisture percentage? "))

if soil_moisture < 30:
    print("💧 Plant is thirsty. Turning on the water pump!")
else:
    print("🌱 Soil is wet enough. Pump stays off.")`,
p2: `import time

current_moisture = 40

while True:
    print(f"Current moisture: {current_moisture}%")

    if current_moisture < 30:
        print("💧 CRITICAL: Moisture low! Activating water pump for 3 seconds...")
        time.sleep(3)
        current_moisture = 60 # The soil is wet again!
        print("✅ Watering complete.")
    else:
        current_moisture = current_moisture - 5 # Sun dries the soil

    time.sleep(2)`,
concepts: [`Variables like current_moisture act as the computer's memory. We can overwrite the old memory with new math, like current_moisture = current_moisture - 5, which updates the value as the sun dries the soil!`],
glitch: `If the metal sensor prongs are left powered on in wet soil for too long, they undergo a chemical reaction called electrolysis and completely dissolve into rust! Engineers have to write code so the sensor only turns on for a single microsecond every hour to prevent the metal from destroying itself.` },

{ emoji: "🪙", title: "The Vending Machine Coin Counter",
how: `As a coin drops into the slot, optical lasers measure its exact size, and magnets measure its metallic composition. The microcontroller adds the value to balance and only unlocks the snack motors when balance >= price.`,
p1: `total = 0
price = 2

while total < price:
    coin = int(input(f"Insert coin (Balance: €{total}): "))
    total = total + coin

print("Snack dispensed!")`,
p2: `price = 1.50
balance = 0.0

# Simulating hardware dropping coins into the slot
inserted_coins = [0.25, 0.50, 0.50, 0.50]

for coin in inserted_coins:
    balance = balance + coin
    print(f"Accepted €{coin:.2f}. Current balance: €{balance:.2f}")

    if balance >= price:
        print("✅ MOTOR UNLOCKED: Dispensing Snack.")
        change = balance - price
        if change > 0:
            print(f"🪙 Dispensing change: €{change:.2f}")
        break`,
concepts: [`A List [] is like a backpack holding multiple items. A for loop is a special command that tells the computer to open the backpack, pull out one coin at a time, and process it until the backpack is empty!`],
glitch: `Decades ago, clever hackers used to freeze water in the exact shape of coins. The "ice coin" would pass the optical size check, trigger the physical lever, and then melt away in the cash box leaving no evidence! Modern machines fixed this by adding electromagnetic sensors that only accept specific metallic signatures.` },

{ emoji: "🧊", title: "The Open-Refrigerator Alarm",
how: `A magnetic "reed switch" connects the fridge door to the frame. When the door opens, the magnet pulls away, breaking the circuit. The computer starts counting seconds and triggers a Piezo Buzzer if open too long.`,
p1: `door_state = input("Is the fridge door 'open' or 'closed'? ")

if door_state == "open":
    print("🚨 BEEP BEEP BEEP! Close the fridge!")`,
p2: `import time

seconds_open = 0
door_sensor = "OPEN"

while door_sensor == "OPEN":
    seconds_open = seconds_open + 1
    print(f"Door has been open for {seconds_open} seconds...")

    if seconds_open > 5:
        print("🚨 ALARM TRIGGERED! BEEP BEEP BEEP! You are wasting energy!")
        break

    time.sleep(1) # Count exactly 1 real second`,
concepts: [`The break command is an emergency stop button. It instantly shatters the while loop and forces the program to stop looping immediately!`],
glitch: `If you place heavy, strong magnets (like large souvenir or kids' letters magnets) on the outside of the fridge door right next to the internal sensor, the external magnet's field can trick the fridge's computer into thinking the door is permanently closed. The alarm will never go off, even if the door is left wide open!` },

{ emoji: "💡", title: "Automatic Energy-Saving Streetlights",
how: `Streetlights use an LDR (Light Dependent Resistor). When sunlight hits it, its electrical resistance drops. As the sun sets and it gets dark, the resistance skyrockets, and the Raspberry Pi turns the LED lights on.`,
p1: `time_of_day = input("Is it 'day' or 'night' outside? ")

if time_of_day == "night":
    print("💡 Streetlights turning ON.")
else:
    print("☀️ Streetlights turning OFF.")`,
p2: `import time

ambient_light_sensor = 100 # 100 is bright sunlight, 0 is pitch black

while ambient_light_sensor > 0:
    print(f"Sensor reading: {ambient_light_sensor}% sunlight.")

    if ambient_light_sensor < 25:
        print("💡 It is getting dark. Relays engaged. Streetlights ON.")
    else:
        print("☀️ Sufficient daylight. Streetlights OFF.")

    ambient_light_sensor = ambient_light_sensor - 20
    time.sleep(2)`,
concepts: [`while ambient_light_sensor > 0: means the computer will keep looping and checking the sensor AS LONG AS the light is greater than zero. Once it hits zero, the loop finishes.`],
glitch: `During total solar eclipses, the sudden drop in sunlight tricks city grids worldwide. The sensors think night has fallen in the middle of the afternoon, triggering entire cities to turn on their streetlights for just 3 minutes!` },
];
