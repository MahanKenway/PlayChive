// Persian dictionary: assembled from the parts below. Key = exact English string.
import { UI } from './fa-ui.js?v=1';
import { JS, PATTERNS } from './fa-js.js?v=1';
import { GAMES } from './fa-games.js?v=1';
import { DESCRIPTIONS } from './fa-descriptions.js?v=1';

export const FA = { ...UI, ...JS, ...GAMES, ...DESCRIPTIONS };
export const FA_PATTERNS = PATTERNS;
