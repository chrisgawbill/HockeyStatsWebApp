/**
 * 16x16 pixel sprite frames. Palette: `.` transparent, `J` jersey (team color
 * via `currentColor`), `S` skin, `H` helmet, `V` visor, `A` jersey accent
 * stripe, `K` stick shaft, `B` stick blade, `P` pants, `W` skate.
 */
export type SpriteFrame = string[];

export const SKATER_IDLE: SpriteFrame = [
  '................',
  '......HHHH......',
  '.....HHHVHH.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '.....JJJJAJ.....',
  '....JJJJJAJJ....',
  '....JJJJJAJJ....',
  '....JJJJJAJJKKB.',
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
  '.....HHHVHH.....',
  '.....SSSSSS.....',
  '......SSSS......',
  '.....JJJJAJ.....',
  '....JJJJJAJJ....',
  '....JJJJJAJJ....',
  '....JJJJJAJJKKB.',
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
  '.....HHHVHH.....',
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
