/**
 * Available avatar characters.
 * All art is 3:4 ratio, transparent-background PNGs of standing animals.
 */

export interface AvatarDef {
  id: string;
  label: string;
}

export const AVATARS: AvatarDef[] = [
  { id: "cat",      label: "Cat"       },
  { id: "fox",      label: "Fox"       },
  { id: "rabbit",   label: "Rabbit"    },
  { id: "penguin",  label: "Penguin"   },
  { id: "otter",    label: "Otter"     },
  { id: "ferret",   label: "Ferret"    },
  { id: "narwhal",  label: "Narwhal"   },
  { id: "pig",      label: "Pig"       },
  { id: "lemur",    label: "Lemur"     },
  { id: "corgi",    label: "Corgi"     },
  { id: "tabby",    label: "Tabby"     },
  { id: "blackcat", label: "Black Cat" },
];

/** The first avatar used as fallback for legacy/invalid avatar IDs. */
export const DEFAULT_AVATAR = AVATARS[0].id; // "cat"

/** Resolve an avatarId, falling back if the ID doesn't exist in the new set. */
export function resolveAvatarId(id: string): string {
  return AVATARS.some((a) => a.id === id) ? id : DEFAULT_AVATAR;
}
