/**
 * 16x16 pixel sprite frames. Palette: `.` transparent, `J` jersey (team color
 * via `currentColor`), `S` skin, `H` helmet, `K` stick, `P` pants, `W` skate.
 */
export type SpriteFrame = string[];

export const SKATER_IDLE: SpriteFrame = [
  '................',
  '......HHHH......',
  '.....HHHHHH.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '.....JJJJJJ.....',
  '....JJJJJJJJ....',
  '....JJJJJJJJ....',
  '....JJJJJJJJKKK.',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....WWW..WWW....',
  '....WWW..WWW....',
  '................',
  '................',
];

export const SKATER_SKATE: SpriteFrame = [
  '................',
  '......HHHH......',
  '.....HHHHHH.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '.....JJJJJJ.....',
  '....JJJJJJJJ....',
  '....JJJJJJJJ....',
  '....JJJJJJJJKKK.',
  '....PP....PPP...',
  '....PP...PPP....',
  '....WW...WWW....',
  '....WW....WW....',
  '................',
  '................',
  '................',
];

export const GOALIE_IDLE: SpriteFrame = [
  '................',
  '......HHHH......',
  '.....HHHHHH.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '.....JJJJJJ.....',
  '....JJJJJJJJKK..',
  '....JJJJJJJJ....',
  '...PPJJJJJJPP...',
  '..PPPP....PPPP..',
  '..PPPP....PPPP..',
  '..PPPP....PPPP..',
  '..PPPP....PPPP..',
  '..WWWW....WWWW..',
  '................',
  '................',
];
