/**
 * The five papers and the full Class 10 chapter list.
 *
 * `weightage` is the number of marks the chapter carries in the 80-mark theory
 * paper. It is the single most important number in this file — the planner uses
 * it to decide what gets studied first, so chapters are never worked through in
 * plain numerical order.
 *
 * `standardOnly` marks content that belongs to Maths Standard. Joyuu is on
 * Basic, so those items stay hidden unless the level is switched in Settings.
 */

export type CbqFrequency = 'low' | 'medium' | 'high' | 'very_high';

export type ChapterSeed = {
  number: number;
  name: string;
  unit?: string;
  weightage: number;
  cbq: CbqFrequency;
  standardOnly?: boolean;
  /** Official NCERT chapter PDF, where one exists. */
  ncertUrl?: string;
};

export type SubjectSeed = {
  slug: string;
  name: string;
  shortName: string;
  /** Colour token used across the UI. */
  accent: 'rose' | 'violet' | 'amber' | 'sky' | 'emerald';
  /** From the published CBSE 2026 datesheet. */
  paperDate: string;
  sortOrder: number;
  chapters: ChapterSeed[];
};

const ncertMaths = (n: number) => `https://ncert.nic.in/textbook/pdf/jemh1${String(n).padStart(2, '0')}.pdf`;
const ncertScience = (n: number) => `https://ncert.nic.in/textbook/pdf/jesc1${String(n).padStart(2, '0')}.pdf`;

export const SUBJECTS: SubjectSeed[] = [
  {
    slug: 'maths',
    name: 'Mathematics',
    shortName: 'Maths',
    accent: 'rose',
    paperDate: '2026-02-17',
    sortOrder: 1,
    chapters: [
      { number: 1, name: 'Real Numbers', unit: 'Number Systems', weightage: 6, cbq: 'medium', ncertUrl: ncertMaths(1) },
      { number: 2, name: 'Polynomials', unit: 'Algebra', weightage: 4, cbq: 'medium', ncertUrl: ncertMaths(2) },
      {
        number: 3,
        name: 'Pair of Linear Equations in Two Variables',
        unit: 'Algebra',
        weightage: 6,
        cbq: 'medium',
        ncertUrl: ncertMaths(3),
      },
      { number: 4, name: 'Quadratic Equations', unit: 'Algebra', weightage: 6, cbq: 'high', ncertUrl: ncertMaths(4) },
      {
        number: 5,
        name: 'Arithmetic Progressions',
        unit: 'Algebra',
        weightage: 4,
        cbq: 'very_high',
        ncertUrl: ncertMaths(5),
      },
      { number: 6, name: 'Triangles', unit: 'Geometry', weightage: 8, cbq: 'medium', ncertUrl: ncertMaths(6) },
      {
        number: 7,
        name: 'Coordinate Geometry',
        unit: 'Coordinate Geometry',
        weightage: 6,
        cbq: 'high',
        ncertUrl: ncertMaths(7),
      },
      {
        number: 8,
        name: 'Introduction to Trigonometry',
        unit: 'Trigonometry',
        weightage: 8,
        cbq: 'high',
        ncertUrl: ncertMaths(8),
      },
      {
        number: 9,
        name: 'Some Applications of Trigonometry',
        unit: 'Trigonometry',
        weightage: 4,
        cbq: 'very_high',
        ncertUrl: ncertMaths(9),
      },
      { number: 10, name: 'Circles', unit: 'Geometry', weightage: 7, cbq: 'low', ncertUrl: ncertMaths(10) },
      {
        number: 11,
        name: 'Areas Related to Circles',
        unit: 'Mensuration',
        weightage: 3,
        cbq: 'high',
        ncertUrl: ncertMaths(11),
      },
      {
        number: 12,
        name: 'Surface Areas and Volumes',
        unit: 'Mensuration',
        weightage: 7,
        cbq: 'very_high',
        ncertUrl: ncertMaths(12),
      },
      {
        number: 13,
        name: 'Statistics',
        unit: 'Statistics & Probability',
        weightage: 7,
        cbq: 'very_high',
        ncertUrl: ncertMaths(13),
      },
      {
        number: 14,
        name: 'Probability',
        unit: 'Statistics & Probability',
        weightage: 4,
        cbq: 'high',
        ncertUrl: ncertMaths(14),
      },
    ],
  },
  {
    slug: 'science',
    name: 'Science',
    shortName: 'Science',
    accent: 'emerald',
    paperDate: '2026-02-25',
    sortOrder: 2,
    chapters: [
      {
        number: 1,
        name: 'Chemical Reactions and Equations',
        unit: 'Chemical Substances',
        weightage: 6,
        cbq: 'medium',
        ncertUrl: ncertScience(1),
      },
      {
        number: 2,
        name: 'Acids, Bases and Salts',
        unit: 'Chemical Substances',
        weightage: 3,
        cbq: 'high',
        ncertUrl: ncertScience(2),
      },
      {
        number: 3,
        name: 'Metals and Non-metals',
        unit: 'Chemical Substances',
        weightage: 10,
        cbq: 'high',
        ncertUrl: ncertScience(3),
      },
      {
        number: 4,
        name: 'Carbon and its Compounds',
        unit: 'Chemical Substances',
        weightage: 6,
        cbq: 'medium',
        ncertUrl: ncertScience(4),
      },
      {
        number: 5,
        name: 'Life Processes',
        unit: 'World of Living',
        weightage: 9,
        cbq: 'very_high',
        ncertUrl: ncertScience(5),
      },
      {
        number: 6,
        name: 'Control and Coordination',
        unit: 'World of Living',
        weightage: 6,
        cbq: 'medium',
        ncertUrl: ncertScience(6),
      },
      {
        number: 7,
        name: 'How do Organisms Reproduce?',
        unit: 'World of Living',
        weightage: 3,
        cbq: 'medium',
        ncertUrl: ncertScience(7),
      },
      {
        number: 8,
        name: 'Heredity and Evolution',
        unit: 'World of Living',
        weightage: 7,
        cbq: 'high',
        ncertUrl: ncertScience(8),
      },
      {
        number: 9,
        name: 'Light — Reflection and Refraction',
        unit: 'Natural Phenomena',
        weightage: 10,
        cbq: 'very_high',
        ncertUrl: ncertScience(9),
      },
      {
        number: 10,
        name: 'The Human Eye and the Colourful World',
        unit: 'Natural Phenomena',
        weightage: 2,
        cbq: 'medium',
        ncertUrl: ncertScience(10),
      },
      {
        number: 11,
        name: 'Electricity',
        unit: 'Effects of Current',
        weightage: 7,
        cbq: 'very_high',
        ncertUrl: ncertScience(11),
      },
      {
        number: 12,
        name: 'Magnetic Effects of Electric Current',
        unit: 'Effects of Current',
        weightage: 6,
        cbq: 'medium',
        ncertUrl: ncertScience(12),
      },
      {
        number: 13,
        name: 'Our Environment',
        unit: 'Natural Resources',
        weightage: 5,
        cbq: 'low',
        ncertUrl: ncertScience(13),
      },
    ],
  },
  {
    slug: 'social-science',
    name: 'Social Science',
    shortName: 'SSt',
    accent: 'amber',
    paperDate: '2026-03-07',
    sortOrder: 3,
    chapters: [
      // History — India and the Contemporary World II (20 marks)
      { number: 1, name: 'The Rise of Nationalism in Europe', unit: 'History', weightage: 5, cbq: 'medium' },
      { number: 2, name: 'Nationalism in India', unit: 'History', weightage: 5, cbq: 'high' },
      { number: 3, name: 'The Making of a Global World', unit: 'History', weightage: 4, cbq: 'medium' },
      { number: 4, name: 'The Age of Industrialisation', unit: 'History', weightage: 3, cbq: 'medium' },
      { number: 5, name: 'Print Culture and the Modern World', unit: 'History', weightage: 3, cbq: 'low' },
      // Geography — Contemporary India II (20 marks)
      { number: 6, name: 'Resources and Development', unit: 'Geography', weightage: 4, cbq: 'high' },
      { number: 7, name: 'Forest and Wildlife Resources', unit: 'Geography', weightage: 2, cbq: 'low' },
      { number: 8, name: 'Water Resources', unit: 'Geography', weightage: 3, cbq: 'medium' },
      { number: 9, name: 'Agriculture', unit: 'Geography', weightage: 4, cbq: 'medium' },
      { number: 10, name: 'Minerals and Energy Resources', unit: 'Geography', weightage: 3, cbq: 'medium' },
      { number: 11, name: 'Manufacturing Industries', unit: 'Geography', weightage: 2, cbq: 'medium' },
      { number: 12, name: 'Lifelines of National Economy', unit: 'Geography', weightage: 2, cbq: 'low' },
      // Political Science — Democratic Politics II (20 marks)
      { number: 13, name: 'Power Sharing', unit: 'Political Science', weightage: 4, cbq: 'medium' },
      { number: 14, name: 'Federalism', unit: 'Political Science', weightage: 4, cbq: 'high' },
      { number: 15, name: 'Gender, Religion and Caste', unit: 'Political Science', weightage: 4, cbq: 'high' },
      { number: 16, name: 'Political Parties', unit: 'Political Science', weightage: 4, cbq: 'medium' },
      { number: 17, name: 'Outcomes of Democracy', unit: 'Political Science', weightage: 4, cbq: 'medium' },
      // Economics — Understanding Economic Development (20 marks)
      { number: 18, name: 'Development', unit: 'Economics', weightage: 4, cbq: 'high' },
      { number: 19, name: 'Sectors of the Indian Economy', unit: 'Economics', weightage: 4, cbq: 'high' },
      { number: 20, name: 'Money and Credit', unit: 'Economics', weightage: 4, cbq: 'very_high' },
      { number: 21, name: 'Globalisation and the Indian Economy', unit: 'Economics', weightage: 4, cbq: 'medium' },
      { number: 22, name: 'Consumer Rights', unit: 'Economics', weightage: 4, cbq: 'medium' },
      // Map work is examined separately and is reliably winnable.
      { number: 23, name: 'Map Work — History and Geography', unit: 'Map Work', weightage: 5, cbq: 'low' },
    ],
  },
  {
    slug: 'english',
    name: 'English (Language & Literature)',
    shortName: 'English',
    accent: 'sky',
    paperDate: '2026-02-21',
    sortOrder: 4,
    chapters: [
      { number: 1, name: 'Reading — Unseen Passages', unit: 'Reading', weightage: 20, cbq: 'very_high' },
      { number: 2, name: 'Writing — Formal Letter', unit: 'Writing & Grammar', weightage: 5, cbq: 'medium' },
      { number: 3, name: 'Writing — Analytical Paragraph', unit: 'Writing & Grammar', weightage: 5, cbq: 'high' },
      {
        number: 4,
        name: 'Grammar — Tenses, Modals, Subject-Verb Agreement',
        unit: 'Writing & Grammar',
        weightage: 5,
        cbq: 'medium',
      },
      {
        number: 5,
        name: 'Grammar — Reported Speech, Determiners',
        unit: 'Writing & Grammar',
        weightage: 5,
        cbq: 'medium',
      },
      { number: 6, name: 'First Flight — A Letter to God', unit: 'Literature: Prose', weightage: 2, cbq: 'medium' },
      {
        number: 7,
        name: 'First Flight — Nelson Mandela: Long Walk to Freedom',
        unit: 'Literature: Prose',
        weightage: 2,
        cbq: 'high',
      },
      {
        number: 8,
        name: 'First Flight — Two Stories About Flying',
        unit: 'Literature: Prose',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 9,
        name: 'First Flight — From the Diary of Anne Frank',
        unit: 'Literature: Prose',
        weightage: 2,
        cbq: 'medium',
      },
      { number: 10, name: 'First Flight — Glimpses of India', unit: 'Literature: Prose', weightage: 2, cbq: 'medium' },
      { number: 11, name: 'First Flight — Mijbil the Otter', unit: 'Literature: Prose', weightage: 2, cbq: 'low' },
      {
        number: 12,
        name: 'First Flight — Madam Rides the Bus',
        unit: 'Literature: Prose',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 13,
        name: 'First Flight — The Sermon at Benares',
        unit: 'Literature: Prose',
        weightage: 2,
        cbq: 'medium',
      },
      { number: 14, name: 'First Flight — The Proposal (Drama)', unit: 'Literature: Prose', weightage: 2, cbq: 'high' },
      {
        number: 15,
        name: 'Poems — Dust of Snow, Fire and Ice',
        unit: 'Literature: Poetry',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 16,
        name: 'Poems — A Tiger in the Zoo, How to Tell Wild Animals',
        unit: 'Literature: Poetry',
        weightage: 2,
        cbq: 'medium',
      },
      { number: 17, name: 'Poems — The Ball Poem, Amanda!', unit: 'Literature: Poetry', weightage: 2, cbq: 'medium' },
      { number: 18, name: 'Poems — The Trees, Fog', unit: 'Literature: Poetry', weightage: 2, cbq: 'low' },
      {
        number: 19,
        name: 'Poems — The Tale of Custard the Dragon, For Anne Gregory',
        unit: 'Literature: Poetry',
        weightage: 2,
        cbq: 'low',
      },
      {
        number: 20,
        name: 'Footprints Without Feet — A Triumph of Surgery, The Thief\u2019s Story',
        unit: 'Literature: Supplementary',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 21,
        name: 'Footprints Without Feet — The Midnight Visitor, A Question of Trust',
        unit: 'Literature: Supplementary',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 22,
        name: 'Footprints Without Feet — Footprints Without Feet, The Making of a Scientist',
        unit: 'Literature: Supplementary',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 23,
        name: 'Footprints Without Feet — The Necklace, Bholi',
        unit: 'Literature: Supplementary',
        weightage: 2,
        cbq: 'high',
      },
      {
        number: 24,
        name: 'Footprints Without Feet — The Book That Saved the Earth',
        unit: 'Literature: Supplementary',
        weightage: 1,
        cbq: 'low',
      },
    ],
  },
  {
    slug: 'hindi',
    name: 'हिंदी (Course A)',
    shortName: 'Hindi A',
    accent: 'violet',
    paperDate: '2026-03-02',
    sortOrder: 5,
    chapters: [
      { number: 1, name: 'अपठित गद्यांश एवं काव्यांश', unit: 'अपठित बोध', weightage: 14, cbq: 'very_high' },
      {
        number: 2,
        name: 'व्याकरण — पद परिचय, रचना के आधार पर वाक्य भेद',
        unit: 'व्याकरण',
        weightage: 8,
        cbq: 'medium',
      },
      { number: 3, name: 'व्याकरण — वाच्य, अलंकार', unit: 'व्याकरण', weightage: 8, cbq: 'medium' },
      { number: 4, name: 'क्षितिज — सूरदास के पद', unit: 'क्षितिज: काव्य खंड', weightage: 3, cbq: 'medium' },
      {
        number: 5,
        name: 'क्षितिज — तुलसीदास: राम-लक्ष्मण-परशुराम संवाद',
        unit: 'क्षितिज: काव्य खंड',
        weightage: 3,
        cbq: 'medium',
      },
      { number: 7, name: 'क्षितिज — जयशंकर प्रसाद: आत्मकथ्य', unit: 'क्षितिज: काव्य खंड', weightage: 2, cbq: 'medium' },
      {
        number: 8,
        name: 'क्षितिज — सूर्यकांत त्रिपाठी निराला: उत्साह, अट नहीं रही है',
        unit: 'क्षितिज: काव्य खंड',
        weightage: 2,
        cbq: 'medium',
      },
      {
        number: 9,
        name: 'क्षितिज — नागार्जुन: यह दंतुरहित मुस्कान, फसल',
        unit: 'क्षितिज: काव्य खंड',
        weightage: 2,
        cbq: 'medium',
      },
      { number: 12, name: 'क्षितिज — मंगलेश डबराल: संगतकार', unit: 'क्षितिज: काव्य खंड', weightage: 2, cbq: 'medium' },
      { number: 13, name: 'क्षितिज — नेताजी का चश्मा', unit: 'क्षितिज: गद्य खंड', weightage: 3, cbq: 'high' },
      { number: 14, name: 'क्षितिज — बालगोबिन भगत', unit: 'क्षितिज: गद्य खंड', weightage: 3, cbq: 'medium' },
      { number: 15, name: 'क्षितिज — लखनवी अंदाज़', unit: 'क्षितिज: गद्य खंड', weightage: 2, cbq: 'low' },
      { number: 17, name: 'क्षितिज — एक कहानी यह भी', unit: 'क्षितिज: गद्य खंड', weightage: 3, cbq: 'high' },
      { number: 18, name: 'क्षितिज — नौबतखाने में इबादत', unit: 'क्षितिज: गद्य खंड', weightage: 2, cbq: 'medium' },
      { number: 19, name: 'क्षितिज — संस्कृति', unit: 'क्षितिज: गद्य खंड', weightage: 2, cbq: 'low' },
      { number: 24, name: 'क्षितिज — मैं क्यों लिखता हूँ', unit: 'क्षितिज: गद्य खंड', weightage: 2, cbq: 'medium' },
      { number: 20, name: 'कृतिका — माता का आँचल', unit: 'कृतिका', weightage: 3, cbq: 'medium' },
      { number: 22, name: 'कृतिका — साना साना हाथ जोड़ि', unit: 'कृतिका', weightage: 2, cbq: 'low' },
      { number: 23, name: 'लेखन — अनुच्छेद, पत्र, सूचना, विज्ञापन', unit: 'लेखन', weightage: 5, cbq: 'medium' },
    ],
  },
];

export const SUBJECT_BY_SLUG = Object.fromEntries(SUBJECTS.map((s) => [s.slug, s])) as Record<string, SubjectSeed>;
