export type Translation = 'KJV' | 'NIV' | 'ALMEIDA' | 'NVI' | 'ACF' | 'ARC' | 'ARA' | 'NAA' | 'NVT';

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  number: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  name: string;
  namePt: string;
  chapters: number;
}

export interface ProjectionSettings {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  showReference: boolean;
  alignment: 'left' | 'center' | 'right';
  fontFamily: string;
  backgroundOpacity: number;
  overlayColor: string;
  churchName?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  dualTranslation: boolean;
  secondaryTranslation?: Translation;
  isCleanFeed?: boolean; // For OBS/vMix browser source
}

export interface BibleState {
  currentBook: string;
  currentChapter: number;
  translation: Translation;
  secondTranslation?: Translation;
  theme: 'light' | 'dark';
  fontSize: number;
  language: 'en' | 'pt';
  projectionSettings: ProjectionSettings;
  projectedVerse?: number;
  isPro?: boolean;
}
