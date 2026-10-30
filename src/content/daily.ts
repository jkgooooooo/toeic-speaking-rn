export type PracticeQuestion = {
  id: string;
  number: number;
  prompt: string;
  preparationSeconds: number;
  responseSeconds: number;
};

export const dailyPractice = {
  id: 'daily-weekend-v1',
  title: '일상에 대해 말하기',
  directions: 'You will answer three questions about your free time. Answer each question after the tone.',
  questions: [
    { id: 'weekend-5', number: 5, prompt: 'What do you usually do on weekends?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'weekend-6', number: 6, prompt: 'Do you prefer spending your free time indoors or outdoors? Why?', preparationSeconds: 3, responseSeconds: 15 },
    { id: 'weekend-7', number: 7, prompt: 'Describe a hobby you would like to try. Explain why you are interested in it.', preparationSeconds: 3, responseSeconds: 30 },
  ] satisfies PracticeQuestion[],
};
