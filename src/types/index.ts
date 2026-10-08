export type RecipientType = 
  | 'Manager'
  | 'Direct Report'
  | 'Colleague'
  | 'Client'
  | 'Recruiter'
  | 'Professor'
  | 'Friend'
  | 'Partner'
  | 'Family Member'
  | 'Landlord'
  | 'Other';

export type SituationType = 
  | 'Ask'
  | 'Apologize'
  | 'Say no'
  | 'Disagree'
  | 'Follow up'
  | 'Set boundary'
  | 'Deliver bad news';

export type ToneType = 
  | 'Confident'
  | 'Responsible'
  | 'Firm'
  | 'Empathetic'
  | 'Warm & direct'
  | 'Diplomatic'
  | 'Respectful yet urgent'
  | 'Curious & open';

export type MediumType =
  | 'Slack / Team Chat'
  | 'Email'
  | 'Text Message'
  | 'In-Person / Phone Script';

export interface StepItem {
  step: string;
  explanation: string;
}

export interface CommunicationCheck {
  clarityAndAccountabilitySummary: string;
  strengths: string[];
  misunderstandingsAndRisks: string[];
  powerDynamicNote?: string;
}

export interface BetterApproach {
  structuralFormula: string;
  stepBreakdown: StepItem[];
}

export interface MessageVariation {
  label: string;
  message: string;
}

export interface WhyItWorks {
  ruleName: string;
  coachingTakeaway: string;
  transferableSkill: string;
}

export interface CoachingResult {
  communicationCheck: CommunicationCheck;
  betterApproach: BetterApproach;
  suggestedMessage: string;
  alternativeVariations?: MessageVariation[];
  whyItWorks: WhyItWorks;
}

export interface CoachingRequest {
  roughMessage: string;
  recipient: string;
  situation: string;
  intention: string;
  desiredTone: string;
  medium?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface SavedSession {
  id: string;
  userId?: string;
  createdAt: number;
  request: CoachingRequest;
  result: CoachingResult;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  situation: SituationType;
  recipient: RecipientType;
  desiredTone: ToneType;
  medium: MediumType;
  intention: string;
  roughMessage: string;
}
