/**
 * Chapter quizzes.
 *
 * Written the way the 2026 paper is written: a mix of straight recall, applied
 * MCQs, assertion-reason items and case studies, each carrying its real mark
 * value. Explanations say why the right answer is right and, where it matters,
 * why the tempting wrong one is wrong — that is where most marks leak.
 */

export type QuestionType = 'mcq' | 'assertion_reason' | 'case_study';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionSeed = {
  prompt: string;
  stimulus?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks?: number;
  difficulty?: Difficulty;
  type?: QuestionType;
  standardOnly?: boolean;
};

export type QuizSeed = {
  subjectSlug: string;
  chapterNumber: number;
  title: string;
  description?: string;
  questions: QuestionSeed[];
};

const AR_OPTIONS = [
  'Both A and R are true, and R is the correct explanation of A',
  'Both A and R are true, but R is not the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
];

export const QUIZZES: QuizSeed[] = [
  {
    subjectSlug: 'maths',
    chapterNumber: 1,
    title: 'Real Numbers',
    description: 'Six marks in the paper. Short, scoring, and worth getting fully right.',
    questions: [
      {
        prompt: 'The HCF of 96 and 404 is 4. What is their LCM?',
        options: ['9696', '2424', '4848', '404'],
        correctIndex: 0,
        explanation:
          'HCF × LCM = product of the two numbers. 96 × 404 = 38784, and 38784 ÷ 4 = 9696. This identity only works for two numbers — do not try it with three.',
        marks: 2,
        difficulty: 'easy',
      },
      {
        prompt: 'The decimal expansion of 13/3125 will:',
        options: ['Be non-terminating repeating', 'Terminate', 'Be irrational', 'Not exist'],
        correctIndex: 1,
        explanation:
          '3125 = 5⁵, which is of the form 2ⁿ5ᵐ. A fraction in lowest terms terminates exactly when its denominator has only 2s and 5s as prime factors.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'If a number ends with the digit 0, it must be divisible by:',
        options: ['Only 2', 'Only 5', 'Both 2 and 5', 'Neither'],
        correctIndex: 2,
        explanation:
          'Ending in 0 means the number has 10 as a factor, and 10 = 2 × 5. This is the standard setup for "can 6ⁿ end in 0?" questions — 6ⁿ has no factor of 5, so it cannot.',
        marks: 1,
        difficulty: 'medium',
      },
      {
        prompt:
          'Assertion (A): √2 is an irrational number. Reason (R): The square root of every prime number is irrational.',
        options: AR_OPTIONS,
        correctIndex: 0,
        explanation:
          'Both statements are true, and R is exactly the general fact that makes A true. Assertion-reason items are lost by students who check only whether both are true and forget to ask whether R explains A.',
        marks: 1,
        difficulty: 'medium',
        type: 'assertion_reason',
      },
      {
        prompt:
          'Three bells ring at intervals of 9, 12 and 15 minutes. If they ring together at 8:00 a.m., when do they next ring together?',
        stimulus:
          'A temple has three bells. The first rings every 9 minutes, the second every 12 minutes and the third every 15 minutes. All three are rung together at 8:00 a.m.',
        options: ['8:45 a.m.', '9:00 a.m.', '11:00 a.m.', '12:00 noon'],
        correctIndex: 2,
        explanation:
          'They coincide again after the LCM of the three intervals. 9 = 3², 12 = 2²×3, 15 = 3×5, so LCM = 2²×3²×5 = 180 minutes = 3 hours. 8:00 a.m. + 3 hours = 11:00 a.m. The usual trap is adding the intervals instead of taking the LCM.',
        marks: 2,
        difficulty: 'medium',
        type: 'case_study',
      },
    ],
  },
  {
    subjectSlug: 'maths',
    chapterNumber: 2,
    title: 'Polynomials',
    questions: [
      {
        prompt: 'If α and β are the zeroes of x² − 5x + 6, then α + β and αβ are:',
        options: ['5 and 6', '−5 and 6', '5 and −6', '6 and 5'],
        correctIndex: 0,
        explanation:
          'For ax² + bx + c, sum of zeroes = −b/a = 5 and product = c/a = 6. Watch the sign on −b/a; that single minus sign costs marks every year.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'The number of zeroes of a polynomial equals the number of points where its graph:',
        options: ['Crosses the y-axis', 'Intersects the x-axis', 'Turns', 'Is a straight line'],
        correctIndex: 1,
        explanation:
          'A zero is a value of x where y = 0, which is precisely where the curve meets the x-axis. Graph-reading questions of this type appear almost every year.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'A quadratic polynomial whose zeroes are 3 and −2 is:',
        options: ['x² − x − 6', 'x² + x − 6', 'x² − x + 6', 'x² + 5x + 6'],
        correctIndex: 0,
        explanation:
          'Sum = 1, product = −6, so the polynomial is x² − (sum)x + product = x² − x − 6. Always write the general form first; it removes the guesswork.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'If one zero of 2x² − 8x + k is the reciprocal of the other, then k equals:',
        options: ['2', '4', '8', '1'],
        correctIndex: 0,
        explanation: 'Reciprocal zeroes means αβ = 1. Product of zeroes = k/2 = 1, so k = 2.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'A cubic polynomial has at most how many zeroes?',
        options: ['1', '2', '3', 'Unlimited'],
        correctIndex: 2,
        explanation: 'A polynomial of degree n has at most n zeroes. Degree 3 therefore gives at most 3.',
        marks: 1,
        difficulty: 'easy',
      },
    ],
  },
  {
    subjectSlug: 'science',
    chapterNumber: 1,
    title: 'Chemical Reactions and Equations',
    questions: [
      {
        prompt: 'Which of the following is a displacement reaction?',
        options: ['CaO + H₂O → Ca(OH)₂', 'Fe + CuSO₄ → FeSO₄ + Cu', '2H₂O → 2H₂ + O₂', 'NaOH + HCl → NaCl + H₂O'],
        correctIndex: 1,
        explanation:
          'Iron is more reactive than copper, so it displaces copper from copper sulphate. The first is combination, the third decomposition, the fourth neutralisation — know all four names, they are asked directly.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'Why is the burning of magnesium ribbon preceded by cleaning it with sandpaper?',
        options: [
          'To make it shiny for appearance',
          'To remove the protective layer of magnesium oxide',
          'To reduce its mass',
          'To make it thinner so it burns faster',
        ],
        correctIndex: 1,
        explanation:
          'Magnesium reacts with air to form a layer of MgO on its surface, which prevents burning. Removing it exposes clean metal. This is a standard 2-mark question — the words "protective layer of magnesium oxide" are the marking keywords.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'In the reaction 3Fe + 4H₂O → Fe₃O₄ + 4H₂, the substance being oxidised is:',
        options: ['Fe', 'H₂O', 'Fe₃O₄', 'H₂'],
        correctIndex: 0,
        explanation:
          'Iron gains oxygen, so iron is oxidised and water is the oxidising agent. Oxidation = gain of oxygen or loss of hydrogen.',
        marks: 1,
        difficulty: 'medium',
      },
      {
        prompt:
          'Assertion (A): Chemical equations must be balanced. Reason (R): Matter can neither be created nor destroyed in a chemical reaction.',
        options: AR_OPTIONS,
        correctIndex: 0,
        explanation:
          'Both true, and the law of conservation of mass is exactly why balancing is required. R explains A, so the first option.',
        marks: 1,
        difficulty: 'easy',
        type: 'assertion_reason',
      },
      {
        prompt: 'What change would you observe, and why?',
        stimulus:
          'A white salt is heated strongly in a test tube. It turns yellow while hot, reverts to white on cooling, and a gas with the smell of burning sulphur is released.',
        options: [
          'The salt is zinc carbonate and the gas is CO₂',
          'The salt is zinc sulphate; the yellow-while-hot, white-when-cold change is characteristic of zinc oxide',
          'The salt is lead nitrate and the gas is NO₂',
          'The salt is calcium carbonate and the gas is SO₂',
        ],
        correctIndex: 1,
        explanation:
          'Zinc oxide is yellow when hot and white when cold — a classic identification point. The sulphur smell indicates SO₂, so the original salt was a sulphate. Lead nitrate gives brown fumes, not a sulphur smell.',
        marks: 3,
        difficulty: 'hard',
        type: 'case_study',
      },
    ],
  },
  {
    subjectSlug: 'science',
    chapterNumber: 5,
    title: 'Life Processes',
    description: 'Nine marks and one of the most predictable chapters in the paper.',
    questions: [
      {
        prompt: 'The opening and closing of stomata is controlled by:',
        options: ['Chlorophyll', 'Guard cells', 'Xylem', 'Lenticels'],
        correctIndex: 1,
        explanation:
          'Guard cells swell when water enters, opening the pore, and shrink when water leaves, closing it. Label this correctly in the diagram — the diagram alone is often worth a mark.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'The correct sequence of the human digestive tract is:',
        options: [
          'Mouth → oesophagus → stomach → small intestine → large intestine',
          'Mouth → stomach → oesophagus → small intestine → large intestine',
          'Mouth → oesophagus → small intestine → stomach → large intestine',
          'Mouth → stomach → small intestine → oesophagus → large intestine',
        ],
        correctIndex: 0,
        explanation:
          'Food passes down the oesophagus into the stomach, then the small intestine where most absorption happens, then the large intestine where water is absorbed.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'Why do the walls of the left ventricle appear thicker than those of the other chambers?',
        options: [
          'It stores more blood',
          'It must pump blood to the whole body at high pressure',
          'It receives blood from the lungs',
          'It contains valves',
        ],
        correctIndex: 1,
        explanation:
          'The left ventricle pumps oxygenated blood into the aorta and around the entire body, so it needs more muscular force. The right ventricle only pumps to the lungs, which are nearby.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'The functional unit of the kidney is the:',
        options: ['Neuron', 'Nephron', 'Alveolus', 'Villus'],
        correctIndex: 1,
        explanation:
          'Nephron — kidney. Neuron — nervous system. Alveolus — lungs. Villus — small intestine. These four are deliberately confused in MCQs, so keep them separated.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'Identify the process and explain the observation.',
        stimulus:
          'A potted plant is kept in the dark for 48 hours, then one leaf is partly covered with black paper and the plant is placed in sunlight for six hours. The leaf is tested with iodine.',
        options: [
          'The whole leaf turns blue-black because starch is present throughout',
          'Only the uncovered part turns blue-black, showing light is necessary for photosynthesis',
          'Only the covered part turns blue-black',
          'No part turns blue-black because the plant was destarched',
        ],
        correctIndex: 1,
        explanation:
          'Destarching first removes existing starch, so any starch found afterwards must be newly made. Only the part that received light makes starch, so only that part turns blue-black with iodine. The experiment proves light is essential.',
        marks: 3,
        difficulty: 'medium',
        type: 'case_study',
      },
    ],
  },
  {
    subjectSlug: 'science',
    chapterNumber: 9,
    title: 'Light — Reflection and Refraction',
    description: 'Ten marks, and the sign convention is where most of them are lost.',
    questions: [
      {
        prompt: 'The focal length of a concave mirror of radius of curvature 20 cm is:',
        options: ['5 cm', '10 cm', '20 cm', '40 cm'],
        correctIndex: 1,
        explanation:
          'f = R/2 = 10 cm. For a concave mirror both f and R are negative by the sign convention, so in a numerical you would write f = −10 cm.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'An object is placed at the centre of curvature of a concave mirror. The image is:',
        options: [
          'Virtual, erect and magnified',
          'Real, inverted and the same size',
          'Real, inverted and diminished',
          'At infinity',
        ],
        correctIndex: 1,
        explanation:
          'At C the image forms at C, real, inverted and the same size. Learn the six positions as a table — these MCQs are free marks once the table is memorised.',
        marks: 1,
        difficulty: 'medium',
      },
      {
        prompt: 'A lens has a power of −2.5 D. It is:',
        options: [
          'A convex lens of focal length 40 cm',
          'A concave lens of focal length 40 cm',
          'A convex lens of focal length 25 cm',
          'A concave lens of focal length 25 cm',
        ],
        correctIndex: 1,
        explanation:
          'P = 1/f in metres, so f = 1/(−2.5) = −0.4 m = −40 cm. Negative power means a concave (diverging) lens.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'Light travelling from water into air bends:',
        options: ['Towards the normal', 'Away from the normal', 'Along the normal', 'It does not bend'],
        correctIndex: 1,
        explanation:
          'Going from a denser to a rarer medium, light bends away from the normal. Denser to rarer — away; rarer to denser — towards.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt:
          'Assertion (A): A convex mirror is used as a rear-view mirror in vehicles. Reason (R): A convex mirror always forms a virtual, erect and diminished image with a wide field of view.',
        options: AR_OPTIONS,
        correctIndex: 0,
        explanation:
          'Both are true and R is precisely why A is done. The wide field of view is the key phrase the marking scheme looks for.',
        marks: 1,
        difficulty: 'medium',
        type: 'assertion_reason',
      },
    ],
  },
  {
    subjectSlug: 'social-science',
    chapterNumber: 20,
    title: 'Money and Credit',
    description: 'Four marks, but almost always as a case study — so the format matters as much as the content.',
    questions: [
      {
        prompt: 'Modern currency in India is accepted as a medium of exchange because:',
        options: [
          'It is made of precious metal',
          'It is authorised by the Reserve Bank of India and the law',
          'Shopkeepers like it',
          'It can be exchanged for gold on demand',
        ],
        correctIndex: 1,
        explanation:
          'Rupee notes carry a guarantee from the Central Government, and the RBI issues them under the law. Modern currency has no value of its own — that is exactly the point being tested.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'The main reason formal credit is cheaper than informal credit is that:',
        options: [
          'Banks are run by the government',
          'The RBI supervises the rate of interest and lending terms',
          'Moneylenders charge no interest',
          'Formal lenders require no documents',
        ],
        correctIndex: 1,
        explanation:
          'The RBI monitors formal lenders, so rates stay reasonable. Informal lenders are unsupervised, which is why their high rates push borrowers into debt traps.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'Collateral is best described as:',
        options: [
          'The interest paid on a loan',
          'An asset the borrower owns and uses as a guarantee until the loan is repaid',
          'A document proving income',
          'The instalment amount',
        ],
        correctIndex: 1,
        explanation:
          'Land, buildings, vehicles, livestock or deposits can all serve as collateral. The lack of collateral is the single biggest reason poor households are shut out of formal credit.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'What is the most likely outcome, and why?',
        stimulus:
          'Rani borrows ₹5,000 from a village moneylender at 5% per month to buy seeds. The crop fails because of poor rain. She borrows again the following season to repay the first loan.',
        options: [
          'She benefits because credit always helps farmers',
          'She falls into a debt trap, because the loan did not generate income and the cost of borrowing is very high',
          'The moneylender must waive the loan',
          'Her income rises as a result of the second loan',
        ],
        correctIndex: 1,
        explanation:
          'Credit helps only when it increases earnings. When the crop fails, repayment becomes impossible and fresh borrowing just deepens the hole — the textbook definition of a debt trap. In a 4-mark answer, say what happened, name the debt trap, give the reason, and suggest formal credit as the remedy.',
        marks: 4,
        difficulty: 'medium',
        type: 'case_study',
      },
      {
        prompt: 'Self Help Groups help poor households mainly because they:',
        options: [
          'Give free money',
          'Allow members to borrow without collateral at reasonable rates',
          'Are run by the RBI',
          'Replace banks completely',
        ],
        correctIndex: 1,
        explanation:
          'SHGs pool small savings and lend to members without collateral, and the group itself handles repayment. That is the answer the marking scheme wants, along with the point about women becoming financially self-reliant.',
        marks: 2,
        difficulty: 'medium',
      },
    ],
  },
  {
    subjectSlug: 'english',
    chapterNumber: 6,
    title: 'A Letter to God',
    questions: [
      {
        prompt: 'Lencho described the raindrops as:',
        options: ['Pearls', 'New coins', 'Silver drops', 'Diamonds'],
        correctIndex: 1,
        explanation:
          'He compares the big drops to ten-cent pieces and the small ones to five-cent pieces, because to him rain means money from a good harvest. Quoting the exact image earns the mark.',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'Why did Lencho call the post office employees "a bunch of crooks"?',
        options: [
          'They lost his letter',
          'He believed they had stolen the rest of the money he had asked God for',
          'They refused to help him',
          'They laughed at him',
        ],
        correctIndex: 1,
        explanation:
          'He received only 70 pesos of the 100 he asked for, and since his faith in God was absolute, the only explanation he could accept was that the post office had taken the rest. The irony — the money came from those very employees — is the point of the story.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'The postmaster arranged the money because he:',
        options: [
          'Feared Lencho',
          'Did not want to shake Lencho\u2019s faith',
          'Was ordered to',
          'Knew Lencho personally',
        ],
        correctIndex: 1,
        explanation:
          'He was moved by the depth of Lencho\u2019s faith and acted to protect it. Mention both his kindness and his wish to preserve that faith for full marks.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: 'The main theme of the story is:',
        options: [
          'The cruelty of nature',
          'Unquestioning faith, and human generosity',
          'The importance of farming',
          'Corruption in the postal service',
        ],
        correctIndex: 1,
        explanation:
          'The story contrasts Lencho\u2019s blind faith with the quiet goodness of the people who actually helped him. Theme questions want both halves, not just one.',
        marks: 2,
        difficulty: 'medium',
      },
      {
        prompt: '"The hailstorm left the field white, as if covered with salt." This is an example of:',
        options: ['Metaphor', 'Simile', 'Personification', 'Alliteration'],
        correctIndex: 1,
        explanation:
          'The comparison uses "as if", which makes it a simile. A metaphor would state it directly without "like" or "as".',
        marks: 1,
        difficulty: 'easy',
      },
    ],
  },
  {
    subjectSlug: 'hindi',
    chapterNumber: 13,
    title: 'नेताजी का चश्मा',
    questions: [
      {
        prompt: 'कैप्टन चश्मेवाला नेताजी की मूर्ति पर चश्मा क्यों लगाता था?',
        options: [
          'पैसे कमाने के लिए',
          'देशभक्ति और नेताजी के प्रति सम्मान के कारण',
          'नगरपालिका के आदेश पर',
          'मूर्तिकार के कहने पर',
        ],
        correctIndex: 1,
        explanation:
          'कैप्टन के मन में नेताजी के प्रति गहरा सम्मान था। मूर्ति बिना चश्मे के अधूरी लगती थी, इसलिए वह अपनी दुकान से चश्मा लगा देता था। उत्तर में "देशभक्ति" शब्द अवश्य आना चाहिए।',
        marks: 2,
        difficulty: 'easy',
      },
      {
        prompt: 'हालदार साहब हर बार मूर्ति देखकर क्या अनुभव करते थे?',
        options: ['क्रोध', 'कौतूहल और प्रसन्नता', 'उदासीनता', 'भय'],
        correctIndex: 1,
        explanation:
          'मूर्ति पर हर बार अलग चश्मा देखकर उन्हें कौतूहल होता था और इस छोटी-सी बात में छिपी देशभक्ति देखकर प्रसन्नता भी।',
        marks: 1,
        difficulty: 'easy',
      },
      {
        prompt: 'मूर्ति में सबसे बड़ी कमी क्या थी?',
        options: ['मूर्ति छोटी थी', 'चश्मा संगमरमर का नहीं बना था', 'मूर्ति टूटी हुई थी', 'मूर्ति का रंग फीका था'],
        correctIndex: 1,
        explanation:
          'मूर्तिकार चश्मा नहीं बना पाया था, इसलिए मूर्ति की आँखों पर चश्मा नहीं था — यही कमी कैप्टन पूरी करता था।',
        marks: 1,
        difficulty: 'medium',
      },
      {
        prompt: 'पाठ के अंत में मूर्ति पर सरकंडे का चश्मा देखकर हालदार साहब की आँखें क्यों भर आईं?',
        options: [
          'कैप्टन की मृत्यु के कारण',
          'यह देखकर कि देशभक्ति की भावना बच्चों में भी जीवित है',
          'मूर्ति टूट गई थी',
          'चश्मा सस्ता था',
        ],
        correctIndex: 1,
        explanation:
          'कैप्टन के न रहने पर भी किसी बालक ने सरकंडे का चश्मा लगा दिया था। इससे पता चलता है कि देशभक्ति की परंपरा समाप्त नहीं हुई — यही पाठ का केंद्रीय भाव है।',
        marks: 3,
        difficulty: 'medium',
      },
      {
        prompt: 'इस पाठ का मुख्य संदेश क्या है?',
        options: [
          'व्यापार करना चाहिए',
          'देशभक्ति किसी भी रूप और किसी भी उम्र में प्रकट हो सकती है',
          'मूर्तियाँ बनानी चाहिए',
          'चश्मा पहनना आवश्यक है',
        ],
        correctIndex: 1,
        explanation:
          'लेखक बताते हैं कि देशभक्ति दिखावे की नहीं, छोटे-छोटे कार्यों की वस्तु है। कैप्टन जैसा साधारण व्यक्ति भी सच्चा देशभक्त हो सकता है।',
        marks: 2,
        difficulty: 'medium',
      },
    ],
  },
];
