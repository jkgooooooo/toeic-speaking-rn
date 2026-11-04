import { mockSets } from './mock';
import { partPracticeSample } from './part-practice';

const library = 'This picture was taken in a library. In the foreground, a man is sitting at a table and reading a book. On the left, a woman is reaching for a book on a shelf. In the background, another woman is arranging books at a counter.';
const park = 'This picture was taken in a park. On the left, a person is watering flowers. In the center, a man is jogging along a path. On the right, two people are sitting on a bench and talking. There are many trees and buildings in the background.';
const samples: Record<string, string[]> = {
  mock1: [
    '', '', library, park,
    'On weekends, I usually go for a walk and spend time with my friends.',
    'I prefer spending my free time outdoors because I can get some fresh air and relax.',
    'I would like to try photography. I enjoy visiting new places, and taking pictures would help me remember them. I could also share my photos with friends.',
    'Registration begins at nine in the morning in the main lobby.',
    'Mark Lee leads the design workshop, and it begins at eleven in the morning.',
    'Actually, the opening talk starts at nine thirty, and Ava Chen leads it. The design workshop begins at eleven and is led by Mark Lee.',
    'I prefer taking a class when I learn a new skill. First, a teacher can explain difficult ideas and answer my questions. For example, when I studied photography, feedback helped me improve quickly. Also, a regular class gives me a schedule, so I can keep practicing. For these reasons, I prefer learning in a class.',
  ],
  mock2: [
    '', '', 'This picture was taken in a bakery. On the right, an employee is arranging pastries on a tray. On the left, two customers are looking at the food. There are many kinds of bread behind the counter.', 'This picture was taken at an outdoor market. A woman is arranging flowers at a stall. On the left, two customers are looking at the plants. There are many colorful flowers in the foreground.',
    'I usually shop for groceries once a week, usually on Saturday morning.',
    'I prefer shopping in a store because I can see the products before I buy them.',
    'Convenient location is most important to me. I often shop after work, so a nearby store saves me time. I also like being able to go back easily if I forget something.',
    'Registration starts at nine in the morning at the front desk.',
    'Noah Bell leads the seasonal salads session, and it starts at eleven in the morning.',
    'Actually, the bread making class begins at nine thirty and is led by Mia Park. Noah Bell leads the seasonal salads session at eleven.',
    'I prefer shopping at a small local store. The staff often know their products well and can answer my questions. For example, a local shopkeeper once helped me choose a useful gift. Small stores are also convenient when I only need a few things. That is why I prefer shopping locally.',
  ],
  mock3: [
    '', '', 'This picture was taken in a meeting room. A woman is writing on a whiteboard. Three other people are sitting at a table and watching her. There are laptops, cups, and a plant on the table.', 'This picture was taken at a train station. On the right, a staff member is showing a map to a passenger. On the left, a traveler is looking at a departure board. A train is standing next to the platform.',
    'I usually take the bus to work because the bus stop is close to my home.',
    'I prefer traveling with other people because we can share experiences and help each other.',
    'I would like to visit a quiet town by the sea. I enjoy walking near the water, and I would like to try local food and take photographs there.',
    'The doors open at ten in the morning in the main hall.',
    'James Gray leads the interview tips session at eleven thirty in the morning.',
    'Actually, the resume workshop begins at ten thirty and is led by Lena Kim. James Gray leads the interview tips session at eleven thirty.',
    'I prefer working in an office. First, it is easier for me to discuss ideas with my coworkers in person. For example, we can solve a problem quickly by meeting at a desk. Also, having a separate workplace helps me focus. For these reasons, I prefer the office.',
  ],
};

const dailySamples: Record<string, string> = {
  'weekend-5': samples.mock1[4],
  'weekend-6': samples.mock1[5],
  'weekend-7': samples.mock1[6],
  'daily-morning': 'I usually have breakfast and check my schedule before I leave home.',
  'daily-lunch': 'I usually have lunch at a small restaurant near my workplace.',
  'daily-cafe': 'I prefer studying at home because it is quiet and I can focus better.',
  'daily-transport': 'I usually take the bus because it is convenient and the bus stop is close to my home.',
  'daily-shopping': 'I prefer shopping in a store because I can see the products before I buy them.',
  'daily-trip': 'I would like to visit a quiet town by the sea. I enjoy walking near the water, and I would like to try local food there.',
  'daily-skill': 'I would like to learn how to cook different kinds of food. I could prepare meals for my family and try new recipes on weekends.',
};

export function sampleAnswer(questionId: string): string | undefined {
  if (dailySamples[questionId]) return dailySamples[questionId];
  const practiceSample = partPracticeSample(questionId);
  if (practiceSample) return practiceSample;
  for (const set of mockSets) {
    const index = set.questions.findIndex(question => question.id === questionId);
    if (index >= 0) return samples[set.id]?.[index] || set.questions[index].prompt;
  }
  return undefined;
}
