export type PracticeQuestion = {
  id: string;
  number: number;
  prompt: string;
  preparationSeconds: number;
  responseSeconds: number;
};

export type DailyQuestion = PracticeQuestion & { topic: string };

export const dailyPractice = {
  id: 'daily-weekend-v1',
  title: '일상에 대해 말하기',
  directions: 'You will answer three questions about your free time. Answer each question after the tone.',
  questions: [
    { id: 'weekend-5', topic: '주말', number: 5, prompt: 'What do you usually do on weekends?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'weekend-6', topic: '여가', number: 6, prompt: 'Do you prefer spending your free time indoors or outdoors? Why?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'weekend-7', topic: '취미', number: 7, prompt: 'Describe a hobby you would like to try. Explain why you are interested in it.', preparationSeconds: 3, responseSeconds: 30 },
    { id: 'daily-morning', topic: '아침', number: 5, prompt: 'What do you usually do before you start work or school?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'daily-lunch', topic: '식사', number: 5, prompt: 'Where do you usually have lunch?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'daily-cafe', topic: '카페', number: 6, prompt: 'Do you prefer studying at home or at a cafe? Why?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'daily-transport', topic: '이동', number: 6, prompt: 'How do you usually get around your city, and why?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'daily-shopping', topic: '쇼핑', number: 6, prompt: 'Do you prefer shopping online or in a store? Why?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'daily-trip', topic: '여행', number: 7, prompt: 'Describe a place you would like to visit. Explain why you want to go there.', preparationSeconds: 3, responseSeconds: 30 },
    { id: 'daily-skill', topic: '배움', number: 7, prompt: 'What is one skill you would like to learn? Explain how you would use it.', preparationSeconds: 3, responseSeconds: 30 },
  ] satisfies DailyQuestion[],
};
