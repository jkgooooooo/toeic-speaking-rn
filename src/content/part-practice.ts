import type { MockPart, MockQuestion, MockSet } from './mock';

type Pair = [string, string];
const readings = [
  'The Westside Community Center will offer free computer classes next month. Classes are available on Tuesday evenings and Saturday mornings. Please register online by the end of this week. Laptops will be provided for all participants.',
  'Thank you for visiting the Green Leaf Garden. Guided tours begin at ten every morning near the main entrance. Visitors may take photographs, but please stay on the marked paths and do not pick the flowers.',
  'The Riverside Hotel is pleased to announce that its fitness room has reopened. Guests can use the facility between six in the morning and ten at night. Towels and drinking water are available at the front desk.',
  'Attention shoppers. The store will close thirty minutes early this evening for maintenance. Please bring your purchases to the checkout counters by eight thirty. We apologize for any inconvenience and appreciate your understanding.',
  'The city museum is looking for volunteers to help welcome visitors this summer. Volunteers will answer questions and assist with special events. No previous experience is required, and training will be provided.',
  'Welcome to the annual neighborhood book fair. Local authors will give talks throughout the afternoon. You can find the schedule at the information desk, and all proceeds from book sales will support the public library.',
  'Due to road repairs, the number twelve bus will use a different route on Monday. The stop in front of the hospital will be closed. Please use the temporary stop across from the post office instead.',
  'Thank you for choosing our delivery service. Your order will arrive tomorrow between one and four in the afternoon. If no one is available to receive it, the driver will leave a notice at your door.',
  'The photography club meets on the first Wednesday of every month. Members share their work and discuss different techniques. New members are welcome, and you do not need an expensive camera to join.',
  'Our office will host a health and wellness event next Friday. Employees can attend short workshops on exercise and nutrition. Please sign up through the company website before Wednesday so we can prepare enough materials.',
  'The Lakeside Cafe has added several new items to its lunch menu. Sandwiches are served with a choice of soup or salad. You can place an order by phone and pick it up at the counter.',
  'Passengers traveling to Brookdale should proceed to platform three. The train is expected to arrive in approximately ten minutes. Please keep your belongings with you and stand behind the yellow line.',
  'The local swimming pool will be closed for cleaning this weekend. It will reopen at its regular time on Monday morning. During the closure, members may use the pool at the Northside Sports Center.',
  'Join us for a free outdoor concert in Central Park this Sunday. The performance begins at six in the evening. Bring a blanket or a chair, and check the weather forecast before leaving home.',
  'Our company is updating its employee parking system. Starting next month, everyone will need to display a parking permit. You can collect your permit from the security office on the first floor.',
  'The cooking school is offering a beginner class on preparing healthy meals. The class includes a demonstration and hands on practice. All ingredients are included in the registration fee.',
  'The city is adding more bicycle racks near the train station. Installation will take place over the next two weeks. Cyclists are asked to use the racks on the east side of the building during that time.',
  'Thank you for attending today’s presentation. A copy of the slides will be sent to everyone by email. If you have additional questions, please contact our team before the end of the week.',
  'The animal shelter is holding an adoption event on Saturday afternoon. Visitors can meet the animals and speak with staff about caring for a pet. Donations of blankets and food are also welcome.',
  'The art supply shop will be moving to a larger location next month. Our new address is on Pine Street, next to the bakery. We look forward to welcoming you to the new store soon.',
];
const shorts: Pair[] = [
  ['How often do you visit a public library?', 'I visit the public library about twice a month to borrow books.'],
  ['What do you usually eat for breakfast?', 'I usually have toast and fruit with a cup of coffee.'],
  ['Where do you like to go for a walk?', 'I like to walk in the park near my home because it is quiet.'],
  ['Do you prefer to exercise in the morning or in the evening? Why?', 'I prefer exercising in the morning because it gives me energy for the day.'],
  ['How often do you cook dinner at home?', 'I cook dinner at home about four times a week.'],
  ['What kind of music do you listen to while working?', 'I usually listen to quiet instrumental music because it helps me concentrate.'],
  ['Do you prefer reading printed books or e-books? Why?', 'I prefer printed books because I enjoy turning the pages and taking notes.'],
  ['Where do you usually meet your friends?', 'I usually meet my friends at a cafe near the train station.'],
  ['How do you usually find information about local events?', 'I usually check the city website or ask my friends.'],
  ['What is your favorite way to relax after a busy day?', 'I like to take a short walk and listen to music after a busy day.'],
  ['How often do you use a bicycle?', 'I ride my bicycle once or twice a week when the weather is good.'],
  ['Do you prefer taking photos with a phone or a camera? Why?', 'I prefer using my phone because it is easy to carry everywhere.'],
  ['What do you usually do when it rains on the weekend?', 'I usually stay home, make tea, and watch a movie.'],
  ['Where do you usually buy fresh vegetables?', 'I usually buy fresh vegetables at a market near my apartment.'],
  ['How often do you attend a class or workshop?', 'I attend a workshop about once every two months.'],
  ['Do you prefer to plan your trips early or at the last minute? Why?', 'I prefer to plan early because I have more time to compare options.'],
  ['What kind of gift do you like to give your friends?', 'I like to give books because I can choose one that matches their interests.'],
  ['When do you usually check your email?', 'I usually check my email in the morning and again after lunch.'],
  ['Describe a meal you enjoy making and explain why you like it.', 'I enjoy making vegetable soup. It is easy to prepare, and I can use different vegetables depending on the season.'],
  ['Describe a place where you like to spend time and explain why.', 'I like spending time at the neighborhood library. It is quiet, and I can read or learn something new there.'],
];
const opinions: Pair[] = [
  ['Do you prefer to exercise alone or with other people? Give reasons and examples.', 'I prefer exercising with other people. First, a friend can encourage me when I feel tired. For example, I meet a friend for a walk every Saturday, so I rarely skip it. Also, exercising together makes the time more enjoyable.'],
  ['Is it better to spend a vacation in one place or visit several places? Explain your choice.', 'I prefer spending a vacation in one place. I have more time to learn about the area and do not have to pack every day. On my last trip, I stayed in one town and discovered several small local restaurants.'],
  ['Do you prefer working on one task at a time or several tasks at once? Give reasons.', 'I prefer working on one task at a time because it helps me focus. For example, I turn off notifications when I write a report. I make fewer mistakes and can finish my work without feeling rushed.'],
  ['Is it more useful to learn from a book or from a video? Explain your opinion.', 'I prefer learning from videos. I can watch someone demonstrate each step and pause when I need more time. For example, a cooking video helped me learn how to prepare a new dish.'],
  ['Do you prefer visiting a large city or a small town? Give reasons and examples.', 'I prefer visiting a small town. It is usually quieter, and I can explore at a relaxed pace. For example, I enjoyed walking around a small coastal town and talking with local shop owners.'],
  ['Should people plan their weekends in advance? Explain your opinion.', 'I think planning weekends in advance is helpful. It gives me time to arrange activities with friends and make reservations. I also leave some free time so that I can rest or change my plans.'],
  ['Do you prefer listening to music or listening to a podcast while traveling? Why?', 'I prefer listening to podcasts while traveling. I can learn about a new subject during the trip. For example, I listened to a podcast about photography on a long train ride and got several useful ideas.'],
  ['Is it better to eat lunch alone or with coworkers? Give reasons.', 'I prefer eating lunch with coworkers. We can get to know one another and take a break from work. For example, a casual lunch helped me feel comfortable when I joined a new team.'],
  ['Do you prefer to shop near your home or near your workplace? Explain.', 'I prefer shopping near my home because I can go on weekends without traveling far. If I forget something, it is easy to return. It also saves time after a busy day.'],
  ['Do you think people should try a new hobby regularly? Give reasons and examples.', 'Yes, I think trying new hobbies is valuable. It helps people discover interests and meet others. For example, I joined a drawing class and made friends while learning a new skill.'],
  ['Do you prefer to receive instructions in writing or in person? Why?', 'I prefer written instructions because I can review them whenever I need to. For example, a checklist helps me follow each step when I use a new program. I can also share the instructions with my coworkers.'],
  ['Is it better to take public transportation or drive to work? Explain your choice.', 'I prefer public transportation because I do not have to look for parking. I can also read during the trip. Taking the train gives me time to prepare for the day.'],
  ['Do you prefer to spend free time indoors or outdoors? Give reasons and examples.', 'I prefer spending free time outdoors. Fresh air helps me relax after sitting at a desk. For example, a walk in the park makes me feel refreshed and ready to focus again.'],
  ['Is it better to learn a language through classes or conversations? Explain.', 'I prefer learning through conversations because I can practice responding naturally. When I talk with a partner, I notice which words I need and can ask questions immediately.'],
  ['Would you rather cook for friends at home or meet at a restaurant? Why?', 'I would rather cook at home because we can choose the food and spend as much time together as we like. For example, my friends and I made dinner together and tried a new recipe.'],
  ['Do you prefer to work early in the morning or late in the evening? Give reasons.', 'I prefer working early in the morning. I feel refreshed, and there are fewer interruptions. When I begin early, I can finish important tasks before my afternoon meetings.'],
  ['Should people make a list before shopping? Explain your opinion.', 'Yes, I think a list is useful. It helps people remember what they need and avoid unnecessary purchases. For example, I use a list at the grocery store and finish shopping more quickly.'],
  ['Do you prefer team sports or individual sports? Explain your choice.', 'I prefer team sports because I enjoy working toward a goal with others. Playing with teammates also encourages me to practice. For example, my volleyball team meets every week.'],
  ['Is it better to take a short break often or one long break during work? Why?', 'I prefer taking short breaks. A few minutes away from my desk helps me concentrate again. For example, I stretch and get some water between tasks, which helps me stay comfortable.'],
  ['Do you prefer attending an event in person or online? Give reasons and examples.', 'I prefer attending events in person because I can meet people and ask questions directly. At a recent workshop, I spoke with other participants and learned from their experiences.'],
];
const photos: [number, string, string][] = [
  [require('../../assets/images/practice-photo-01.jpg'), "접수대에서 안내받는 방문객", "A person is working behind a reception desk and talking to a visitor. Another person is sitting in the background."],
  [require('../../assets/images/practice-photo-02.jpg'), "카페에서 음료를 준비하는 직원과 손님", "A cafe worker is preparing a drink behind the counter. A customer is standing in front of her."],
  [require('../../assets/images/practice-photo-03.jpg'), "서류를 함께 살펴보는 동료들", "Two people are sitting at a table and looking at a document. There are laptops and cups on the table."],
  [require('../../assets/images/practice-photo-04.jpg'), "과일을 정리하는 직원과 쇼핑하는 손님", "A store employee is arranging fruit. A customer is standing beside a shopping cart and looking at the produce."],
  [require('../../assets/images/practice-photo-05.jpg'), "책장을 조립하는 두 사람", "Two people are putting together a bookshelf. They are sitting on the floor with tools and pieces of wood."],
  [require('../../assets/images/practice-photo-06.jpg'), "공원에서 자전거를 타고 걷는 사람들", "A person is riding a bicycle on a path. Two other people are walking together nearby."],
  [require('../../assets/images/practice-photo-07.jpg'), "정원에서 식물을 돌보는 두 사람", "Two people are working in a garden. One is planting flowers, and the other is holding a watering can."],
  [require('../../assets/images/practice-photo-08.jpg'), "식당에서 음식을 받는 손님들", "A waiter is carrying plates to two people sitting at a table. There are glasses and flowers on the table."],
  [require('../../assets/images/practice-photo-09.jpg'), "공항에서 책을 읽는 여행객", "A man is sitting at an airport gate and reading a book. A suitcase is next to him."],
  [require('../../assets/images/practice-photo-10.jpg'), "옷가게에서 옷을 살펴보는 손님", "A woman is looking at clothes on a rack in a store. There are many shirts hanging in front of her."],
  [require('../../assets/images/practice-photo-11.jpg'), "버스 정류장에서 기다리는 사람들", "Two people are standing at a bus stop. One person is looking at a phone."],
  [require('../../assets/images/practice-photo-12.jpg'), "부엌에서 요리하고 설거지하는 사람들", "A man is cutting vegetables in a kitchen. Another person is washing dishes at the sink."],
  [require('../../assets/images/practice-photo-13.jpg'), "개를 산책시키는 두 사람", "Two people are walking along a sidewalk with dogs. There are trees along the path."],
  [require('../../assets/images/practice-photo-14.jpg'), "미술관에서 그림을 감상하는 방문객", "One visitor is looking at a painting in a museum. Another person is sitting on a bench."],
  [require('../../assets/images/practice-photo-15.jpg'), "자전거를 수리하는 정비사", "A man is working on a bicycle in a repair shop. Several bicycles and tools are nearby."],
  [require('../../assets/images/practice-photo-16.jpg'), "칠판에 글을 쓰는 강사와 수강생", "A teacher is writing on a whiteboard. Several students are sitting at desks and watching."],
  [require('../../assets/images/practice-photo-17.jpg'), "상자를 정리하는 두 직원", "Two people are unpacking boxes in a room. There are shelves and other boxes behind them."],
  [require('../../assets/images/practice-photo-18.jpg'), "공원에서 식사하는 두 사람", "Two people are sitting at a picnic table in a park. There is food on the table."],
  [require('../../assets/images/practice-photo-19.jpg'), "꽃을 정리하는 직원과 손님", "A florist is arranging flowers behind a counter. A customer is standing nearby."],
  [require('../../assets/images/practice-photo-20.jpg'), "지도와 자료를 살펴보는 안내 직원과 방문객", "Two people are looking at a map at an information desk. There are papers on the counter."],
];

type ScheduleInfo = [string, string, string, string, string, string];
// Title, date, first activity, time, presenter, room.
const schedules: ScheduleInfo[] = [
  ['Community Art Workshop', 'Saturday, May 10', 'Painting basics', '9:00 AM', 'Mia Chen', 'Room A'],
  ['Weekend Cooking Class', 'Saturday, June 7', 'Pasta making', '10:00 AM', 'Noah Kim', 'Kitchen 1'],
  ['Career Skills Day', 'Friday, July 11', 'Resume writing', '9:30 AM', 'Eva Park', 'Room 204'],
  ['Garden Club Meeting', 'Sunday, April 6', 'Growing herbs', '11:00 AM', 'Daniel Lee', 'Garden Hall'],
  ['Photography Meetup', 'Saturday, August 9', 'Camera basics', '1:00 PM', 'Lily Brown', 'Studio A'],
  ['Small Business Seminar', 'Tuesday, March 4', 'Online marketing', '10:30 AM', 'Aaron Cho', 'Room B'],
  ['Health and Wellness Fair', 'Wednesday, June 18', 'Stretching at work', '2:00 PM', 'Sofia Kim', 'Main Hall'],
  ['Local History Day', 'Saturday, September 20', 'City history talk', '11:30 AM', 'James Park', 'Room 3'],
  ['Technology Workshop', 'Thursday, October 9', 'Spreadsheet skills', '9:00 AM', 'Olivia Han', 'Lab 2'],
  ['Book Festival', 'Sunday, November 2', 'Meet the authors', '1:30 PM', 'Ethan Lee', 'Reading Room'],
  ['Travel Planning Event', 'Saturday, May 17', 'Budget travel', '10:00 AM', 'Hana Kim', 'Room C'],
  ['Music Open House', 'Friday, April 11', 'Guitar basics', '3:00 PM', 'Daniel Park', 'Music Room'],
  ['Home Design Day', 'Sunday, July 13', 'Small spaces', '2:30 PM', 'Grace Lee', 'Studio B'],
  ['Language Learning Fair', 'Saturday, August 23', 'English conversation', '9:30 AM', 'Emma Cho', 'Room 101'],
  ['Community Volunteer Day', 'Monday, September 8', 'Volunteer orientation', '10:00 AM', 'Alex Kim', 'Lobby'],
  ['Digital Media Workshop', 'Wednesday, November 12', 'Video editing', '1:00 PM', 'Ryan Park', 'Lab 1'],
  ['Food and Farming Event', 'Saturday, October 4', 'Seasonal produce', '11:00 AM', 'Nina Lee', 'Room D'],
  ['Personal Finance Seminar', 'Tuesday, May 6', 'Saving for a trip', '6:00 PM', 'Ella Kim', 'Room 202'],
  ['Neighborhood Science Day', 'Sunday, June 22', 'Weather science', '10:30 AM', 'Leo Chen', 'Science Hall'],
  ['Writing Workshop', 'Thursday, July 17', 'Writing short stories', '4:00 PM', 'Sarah Lee', 'Library Room'],
];

export const partPracticeSets: MockSet[] = readings.map((reading, index) => {
  const id = `study-${String(index + 1).padStart(2, '0')}`;
  const [title, date, activity, time, presenter, room] = schedules[index];
  const [image, imageLabel] = photos[index];
  const make = (part: MockPart, number: number, prompt: string, preparationSeconds: number, responseSeconds: number, showQuestion: boolean): MockQuestion => ({ id: `${id}-${part}`, number, part, prompt, preparationSeconds, responseSeconds, showQuestion });
  return {
    id, title: `파트 연습 ${String(index + 1).padStart(2, '0')}`,
    questions: [
      make('reading', 1, reading, 45, 45, true),
      { ...make('photo', 3, 'Describe the picture in detail.', 45, 30, false), image, imageLabel },
      make('short', index >= 18 ? 7 : index % 2 === 0 ? 5 : 6, shorts[index][0], 3, index >= 18 ? 30 : 15, true),
      make('table', index % 3 === 0 ? 8 : index % 3 === 1 ? 9 : 10, index % 3 === 0 ? `When does the ${activity} session start, and where is it?` : index % 3 === 1 ? `Who leads the ${activity} session, and when does it start?` : `I heard that the ${activity} session starts at noon. Is that correct? Please provide the correct time and location.`, 3, index % 3 === 2 ? 30 : 15, false),
      make('opinion', 11, opinions[index][0], 45, 60, true),
    ],
    schedule: { title, date, rows: [[time, activity, presenter], ['Location', room, '']] },
    shortContext: 'Imagine that you are answering a question about your everyday life.',
    tableContext: `Imagine you are answering a caller who wants information about the ${title}.`,
  };
});

export function partPracticeSample(questionId: string): string | undefined {
  const match = /^study-(\d{2})-(reading|photo|short|table|opinion)$/.exec(questionId);
  if (!match) return undefined;
  const index = Number(match[1]) - 1;
  const set = partPracticeSets[index];
  if (!set) return undefined;
  if (match[2] === 'reading') return readings[index];
  if (match[2] === 'photo') return photos[index][2];
  if (match[2] === 'short') return shorts[index][1];
  if (match[2] === 'opinion') return opinions[index][1];
  const [, , activity, time, presenter, room] = schedules[index];
  if (index % 3 === 1) return `${presenter} leads the ${activity} session, and it starts at ${time}.`;
  if (index % 3 === 2) return `Actually, the ${activity} session starts at ${time} in ${room}, not at noon.`;
  return `The ${activity} session starts at ${time} in ${room}.`;
}
