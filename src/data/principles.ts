export interface Principle {
  id: string;
  category: string;
  name: string;
  summary: string;
  ruleFormula: string;
  antiPattern: string;
  proPattern: string;
  keyRule: string;
}

export const COMMUNICATION_PRINCIPLES: Principle[] = [
  {
    id: 'apology-without-excuses',
    category: 'Apologize',
    name: 'The Restitution-Over-Remorse Rule',
    summary: 'Over-apologizing forces the recipient into the awkward emotional labor of comforting you. Replace defensive backstory with concrete restitution.',
    ruleFormula: 'Acknowledge Impact → Skip the Excuse → State the Recovery Plan → Confirm Next Checkpoint',
    antiPattern: '"I’m so sorry! My wifi died and my dog was sick and everything was chaotic..."',
    proPattern: '"I apologize for the delay. The deck is updated with the latest numbers and ready for review here. I’ve scheduled 10 minutes to walk through it."',
    keyRule: 'Own the impact on their schedule, not the emotional drama of your excuse.'
  },
  {
    id: 'the-positive-no',
    category: 'Say no',
    name: 'The Boundaried Counter-Offer',
    summary: 'A flat "no" feels dismissive, while an over-justified "no" sounds negotiable. A positive "no" protects your time while respecting their objective.',
    ruleFormula: 'Validate their project → State clear boundary → Offer alternative pathway or timeframe',
    antiPattern: '"I’m just way too slammed, can’t someone else do it?"',
    proPattern: '"I’m fully committed to delivering the onboarding sprint through Thursday, so I can’t take on this deck. I’m happy to share my slides template or review your outline on Friday."',
    keyRule: 'Say yes to the person and the relationship, while saying a firm no to the specific task.'
  },
  {
    id: 'managing-upward-dissent',
    category: 'Disagree',
    name: 'The Shared-Outcome Pivot',
    summary: 'Disagreeing with leaders triggers defensiveness if framed as "your idea vs. my idea". Frame dissent as joint problem-solving around shared business goals.',
    ruleFormula: 'Affirm the core goal → Share observable data/risks → Propose a calibrated test or mitigation',
    antiPattern: '"This plan is unrealistic and engineering won’t be able to hit this deadline."',
    proPattern: '"I’m completely aligned on launching the feature before Q4. Based on our current test coverage, skipping the migration phase introduces an 80% defect risk. Could we scope a phased beta instead?"',
    keyRule: 'Anchor your disagreement in the outcome you both care about, not in personal skepticism.'
  },
  {
    id: 'the-confident-ask',
    category: 'Ask',
    name: 'The Low-Friction Request Rule',
    summary: 'Vague requests impose mental effort on the recipient to figure out what you need. Specific, bounded requests invite swift consent.',
    ruleFormula: 'Context in 1 line → Concrete specific ask → Clear decision threshold or timeline',
    antiPattern: '"Can we chat whenever you have time about some stuff?"',
    proPattern: '"Could we take 15 minutes this Thursday afternoon to review the Q3 budget approvals? I have the two options summarized in a 1-pager."',
    keyRule: 'Lower the cognitive burden of saying "yes" by packaging the request cleanly.'
  },
  {
    id: 'dignified-followup',
    category: 'Follow up',
    name: 'The Graceful Value Re-Anchor',
    summary: 'People don’t ghost because they hate you; they ghost because they are inundated. Re-engaging with added value works 10x better than "nudging".',
    ruleFormula: 'Friendly reference to prior touchpoint → Reaffirm genuine enthusiasm → Provide clean out or timeline',
    antiPattern: '"Checking if you saw my email? Just pinging this again."',
    proPattern: '"I know how busy closing the quarter gets. I wanted to reiterate my enthusiasm for the team’s roadmap, and check if there are any additional materials I can share as you finalize decisions."',
    keyRule: 'Never guilt someone for being slow; make it easy and rewarding for them to reply now.'
  }
];
