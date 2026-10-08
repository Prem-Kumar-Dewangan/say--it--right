import { ScenarioPreset } from '../types';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'missed-deadline',
    title: 'Missed Client Deadline',
    subtitle: 'Deliverable is delayed due to unexpected complications',
    situation: 'Apologize',
    recipient: 'Client',
    desiredTone: 'Responsible',
    medium: 'Email',
    intention: 'Own the delay upfront without over-apologizing or making excuses, present a concrete revised timeline, and protect long-term trust.',
    roughMessage: 'Hey, really sorry but the Q3 reporting deck isn’t ready yet. We had some messy data issues on our end that took way longer than expected. Should hopefully have it to you sometime soon, sorry for the hassle!'
  },
  {
    id: 'disagree-tech-lead',
    title: 'Disagreeing With Team Lead',
    subtitle: 'Pushing back on an architectural or process shift',
    situation: 'Disagree',
    recipient: 'Manager',
    desiredTone: 'Confident',
    medium: 'Slack / Team Chat',
    intention: 'Raise critical architectural risks with the new proposed database migration without appearing combative or obstructive.',
    roughMessage: 'I really don’t think we should switch to this new stack right now. It is super risky, nobody has time to learn it, and we are going to introduce a ton of regressions right before the release.'
  },
  {
    id: 'colleague-scope-creep',
    title: 'Saying No to Urgent Colleague Favor',
    subtitle: 'Colleague asking for help when your plate is already overloaded',
    situation: 'Say no',
    recipient: 'Colleague',
    desiredTone: 'Firm',
    medium: 'Slack / Team Chat',
    intention: 'Decline taking on their slide deck while maintaining a warm working relationship and suggesting where they can get templates or async guidance.',
    roughMessage: 'I can’t help you with the deck this week at all. My plate is completely overflowing and my manager is watching my sprint deadlines.'
  },
  {
    id: 'salary-review',
    title: 'Asking Manager for Compensation Review',
    subtitle: 'Initiating a conversation about a raise or promotion',
    situation: 'Ask',
    recipient: 'Manager',
    desiredTone: 'Confident',
    medium: 'Email',
    intention: 'Schedule dedicated time to align on compensation based on expanded scope and recent high-impact deliverables, keeping it collaborative rather than an ultimatum.',
    roughMessage: 'Hey, I wanted to discuss my salary. I’ve taken on a lot of extra projects over the past six months and I feel underpaid compared to what I’m contributing.'
  },
  {
    id: 'recruiter-ghosting',
    title: 'Following Up After Final Round Silence',
    subtitle: 'Ten days have passed after promised feedback date',
    situation: 'Follow up',
    recipient: 'Recruiter',
    desiredTone: 'Confident',
    medium: 'Email',
    intention: 'Re-engage the recruiter professionally, reiterate strong enthusiasm for the role, and ask for timeline clarity without sounding aggrieved.',
    roughMessage: 'Hi, just following up. You said I would hear back by last Tuesday and I haven’t heard anything yet. Wondering what the status of my application is?'
  },
  {
    id: 'professor-extension',
    title: 'Asking Professor for Essay Extension',
    subtitle: 'Need 48 hours extra due to compounding commitments',
    situation: 'Ask',
    recipient: 'Professor',
    desiredTone: 'Responsible',
    medium: 'Email',
    intention: 'Request a 48-hour extension on the term paper with clear ownership, outline work completed so far, and confirm willingness to accept any standard policy penalty.',
    roughMessage: 'Hi Professor Miller, I am super stressed with two exams on Wednesday and I don’t think I can finish the history paper by Friday midnight. Can I please turn it in Sunday?'
  },
  {
    id: 'friend-loan-boundary',
    title: 'Declining Personal Money Request',
    subtitle: 'Friend asks to borrow funds for unexpected bills',
    situation: 'Say no',
    recipient: 'Friend',
    desiredTone: 'Warm & direct',
    medium: 'Text Message',
    intention: 'Gently and unambiguously decline lending money, preserve mutual affection, and offer non-financial support or moral encouragement.',
    roughMessage: 'Hey man, sorry but I really can’t lend you the $600 right now. Things are tight on my end and I just don’t do loans with friends.'
  }
];
