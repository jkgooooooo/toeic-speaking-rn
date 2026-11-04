import type { PracticeQuestion } from './daily';
import { partPracticeSets } from './part-practice';

export type MockPart = 'reading' | 'photo' | 'short' | 'table' | 'opinion';
export type MockQuestion = PracticeQuestion & { part: MockPart; image?: number; imageLabel?: string; showQuestion: boolean };

export const mockIntroduction = 'This speaking practice test has eleven questions in five parts. Listen carefully to the instructions. The questions will move forward automatically. Speak clearly and use the time given for each answer.';

export const mockDirections: Record<MockPart, string> = {
  reading: 'Questions one and two. Read each text aloud. You will have 45 seconds to prepare and 45 seconds to read.',
  photo: 'Questions three and four. Describe each picture in as much detail as you can. You will have 45 seconds to prepare and 30 seconds to speak.',
  short: 'Questions five through seven. Answer three questions about a familiar topic. After each question, you will have three seconds to prepare. You will have fifteen seconds to answer questions five and six, and thirty seconds to answer question seven.',
  table: 'Questions eight through ten. Answer three questions using the information provided. First, you have forty five seconds to study the information. After each question, you have three seconds to prepare. Answer questions eight and nine in fifteen seconds each. Question ten will be played twice, and you will have thirty seconds to answer.',
  opinion: 'Question eleven. Give your opinion and explain your reasons. You will have 45 seconds to prepare and 60 seconds to speak.',
};
export function practiceDirections(question: MockQuestion, single: boolean): string {
  if (!single) return mockDirections[question.part];
  if (question.part === 'reading') return 'Read the text aloud. You will have 45 seconds to prepare and 45 seconds to read.';
  if (question.part === 'photo') return 'Describe the picture in as much detail as you can. You will have 45 seconds to prepare and 30 seconds to speak.';
  if (question.part === 'table') return `Study the information for 45 seconds. Listen to the question${question.number === 10 ? ' twice' : ''}. You will have three seconds to prepare and ${question.responseSeconds} seconds to answer.`;
  if (question.part === 'opinion') return 'Give your opinion and explain your reasons. You will have 45 seconds to prepare and 60 seconds to speak.';
  return `Listen to the question. You will have three seconds to prepare and ${question.responseSeconds} seconds to answer.`;
}

export const mockCues = {
  prepare: 'Begin preparing now.',
  reading: 'Begin reading aloud now.',
  speaking: 'Begin speaking now.',
  repeat: 'Listen to the question again.',
  shortContext: 'Imagine that you are taking part in an interview about how people spend their free time. Answer the following questions.',
  tableContext: 'Imagine you are answering a caller who wants information about the community workshop schedule.',
};

export const mockSchedule = {
  title: 'Community Innovation Workshop',
  date: 'Saturday, October 17',
  rows: [
    ['9:00 AM', 'Registration', 'Main lobby'],
    ['9:30 AM', 'Opening talk', 'Ava Chen'],
    ['11:00 AM', 'Design workshop', 'Mark Lee'],
    ['12:00 PM', 'Lunch break', 'Garden room'],
    ['1:00 PM', 'Innovation panel', 'Nina Park'],
  ],
};

export const mockQuestions: MockQuestion[] = [
  { id: 'mock1-q1', number: 1, part: 'reading', showQuestion: true, prompt: 'The city library will open a new community learning center next month. Visitors can attend free workshops, borrow books, and meet local artists. For more information, please visit the library website or speak with a staff member.', preparationSeconds: 45, responseSeconds: 45 },
  { id: 'mock1-q2', number: 2, part: 'reading', showQuestion: true, prompt: 'Thank you for choosing Greenway Fitness. Our center offers a variety of classes for all experience levels. Members can book a class online or at the front desk. Please arrive ten minutes early and bring a bottle of water.', preparationSeconds: 45, responseSeconds: 45 },
  { id: 'mock1-q3', number: 3, part: 'photo', showQuestion: false, image: require('../../assets/images/mock-library.png'), imageLabel: '도서관에서 책을 읽고 고르는 사람들이 보이는 사진', prompt: 'Describe the picture in detail.', preparationSeconds: 45, responseSeconds: 30 },
  { id: 'mock1-q4', number: 4, part: 'photo', showQuestion: false, image: require('../../assets/images/mock-park.png'), imageLabel: '공원에서 운동하고 쉬는 사람들이 보이는 사진', prompt: 'Describe the picture in detail.', preparationSeconds: 45, responseSeconds: 30 },
  { id: 'mock1-q5', number: 5, part: 'short', showQuestion: true, prompt: 'What do you usually do on weekends?', preparationSeconds: 3, responseSeconds: 15 },
  { id: 'mock1-q6', number: 6, part: 'short', showQuestion: true, prompt: 'Do you prefer spending your free time indoors or outdoors? Why?', preparationSeconds: 3, responseSeconds: 15 },
  { id: 'mock1-q7', number: 7, part: 'short', showQuestion: true, prompt: 'Describe a hobby you would like to try. Explain why you are interested in it.', preparationSeconds: 3, responseSeconds: 30 },
  { id: 'mock1-q8', number: 8, part: 'table', showQuestion: false, prompt: 'What time does registration begin, and where is it held?', preparationSeconds: 3, responseSeconds: 15 },
  { id: 'mock1-q9', number: 9, part: 'table', showQuestion: false, prompt: 'Who is leading the design workshop, and what time does it begin?', preparationSeconds: 3, responseSeconds: 15 },
  { id: 'mock1-q10', number: 10, part: 'table', showQuestion: false, prompt: 'I heard that the opening talk begins at eleven and that Mark Lee leads it. Is that correct? Please tell me the correct information.', preparationSeconds: 3, responseSeconds: 30 },
  { id: 'mock1-q11', number: 11, part: 'opinion', showQuestion: true, prompt: 'Some people prefer to learn a new skill by taking a class. Others prefer to learn on their own. Which do you prefer, and why? Give reasons and examples to support your opinion.', preparationSeconds: 45, responseSeconds: 60 },
];

export type MockSet = {
  id: string;
  title: string;
  questions: MockQuestion[];
  schedule: typeof mockSchedule;
  shortContext: string;
  tableContext: string;
};

type NewSetContent = {
  id: string;
  title: string;
  texts: [string, string];
  photos: [{ image: number; imageLabel: string }, { image: number; imageLabel: string }];
  shortContext: string;
  shortQuestions: [string, string, string];
  tableContext: string;
  schedule: typeof mockSchedule;
  tableQuestions: [string, string, string];
  opinion: string;
};

function makeMockSet(content: NewSetContent): MockSet {
  const prompts = [content.texts[0], content.texts[1], 'Describe the picture in detail.', 'Describe the picture in detail.', ...content.shortQuestions, ...content.tableQuestions, content.opinion];
  return {
    id: content.id, title: content.title, schedule: content.schedule,
    shortContext: content.shortContext, tableContext: content.tableContext,
    questions: mockQuestions.map((base, index) => ({ ...base, ...(index === 2 || index === 3 ? content.photos[index - 2] : {}), id: `${content.id}-q${index + 1}`, prompt: prompts[index] })),
  };
}

export const mockSets: MockSet[] = [
  { id: 'mock1', title: '모의고사 01', questions: mockQuestions, schedule: mockSchedule, shortContext: mockCues.shortContext, tableContext: mockCues.tableContext },
  makeMockSet({
    id: 'mock2', title: '모의고사 02',
    photos: [{ image: require('../../assets/images/mock-bakery.png'), imageLabel: '빵집에서 진열된 빵을 보는 손님과 직원의 사진' }, { image: require('../../assets/images/mock-market.png'), imageLabel: '꽃 시장에서 꽃을 고르는 손님과 판매자의 사진' }],
    texts: [
      'Welcome to the Riverside Art Center. This month we are hosting free evening workshops for anyone interested in painting. Materials are provided, but space is limited. Please visit our website to reserve a place before Friday.',
      'The Oak Street Market is open every Saturday from nine in the morning until three in the afternoon. You can find fresh produce, handmade gifts, and a variety of local foods. Parking is available behind the community center.',
    ],
    shortContext: 'Imagine you are answering questions for a survey about shopping habits.',
    shortQuestions: ['How often do you shop for groceries?', 'Do you prefer shopping online or in a store? Why?', 'What is most important to you when choosing where to shop? Explain your answer.'],
    tableContext: 'Imagine you are answering a caller who wants information about a weekend cooking event.',
    schedule: { title: 'Weekend Cooking Event', date: 'Saturday, June 14', rows: [['9:00 AM', 'Registration', 'Front desk'], ['9:30 AM', 'Bread making', 'Mia Park'], ['11:00 AM', 'Seasonal salads', 'Noah Bell'], ['12:00 PM', 'Lunch break', 'Dining room'], ['1:00 PM', 'Dessert class', 'Eva Stone']] },
    tableQuestions: ['When does registration start, and where is it?', 'Who leads the seasonal salads session, and when does it start?', 'I thought the bread making class starts at eleven with Noah Bell. Is that right? Please provide the correct details.'],
    opinion: 'Do you prefer shopping at a small local store or a large store? Give reasons and examples to explain your choice.',
  }),
  makeMockSet({
    id: 'mock3', title: '모의고사 03',
    photos: [{ image: require('../../assets/images/mock-meeting.png'), imageLabel: '회의실에서 발표를 듣는 동료들의 사진' }, { image: require('../../assets/images/mock-station.png'), imageLabel: '기차역에서 안내를 받는 승객과 전광판을 보는 여행객 사진' }],
    texts: [
      'Attention passengers. The afternoon train to Harbor City will depart from platform four instead of platform two. Please check the information boards for further updates. Station staff are available near the ticket office if you need assistance.',
      'Our neighborhood garden is looking for volunteers this spring. No gardening experience is necessary, and tools will be provided. Volunteers can sign up for a morning or afternoon shift on our website. We look forward to seeing you there.',
    ],
    shortContext: 'Imagine you are taking part in an interview about travel and transportation.',
    shortQuestions: ['How do you usually travel to work or school?', 'Do you prefer traveling alone or with other people? Why?', 'Describe a place you would like to visit and explain why you want to go there.'],
    tableContext: 'Imagine you are answering a caller asking about a local career fair.',
    schedule: { title: 'Local Career Fair', date: 'Friday, September 12', rows: [['10:00 AM', 'Doors open', 'Main hall'], ['10:30 AM', 'Resume workshop', 'Lena Kim'], ['11:30 AM', 'Interview tips', 'James Gray'], ['12:30 PM', 'Lunch break', 'Cafe'], ['2:00 PM', 'Employer panel', 'Room B']] },
    tableQuestions: ['What time do the doors open, and where?', 'Who leads the interview tips session, and what time is it?', 'Someone told me the resume workshop begins at eleven thirty with James Gray. Is that correct? Tell me the correct details.'],
    opinion: 'Some people prefer to work from home, while others prefer to work in an office. Which do you prefer? Give reasons and examples.',
  }),
];

export function getMockSet(id?: string): MockSet | undefined {
  return mockSets.find(set => set.id === id) ?? partPracticeSets.find(set => set.id === id);
}
