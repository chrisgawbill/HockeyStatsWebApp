import { createContext, useContext } from 'react';

import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import { TokenSlot } from '@/features/teams/utils/teamLinesHelper';

/** Lets any token open the shared player stats dialog without prop drilling. */
export const PlayerDialogContext = createContext<
  (player: RosterPlayer, slot: TokenSlot, trigger: HTMLElement) => void
>(() => {});

/** Returns a function that opens the stats dialog for a player. */
export function useOpenPlayerDialog() {
  return useContext(PlayerDialogContext);
}
