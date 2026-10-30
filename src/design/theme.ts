import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#FDFBF8', ink: '#302B36', muted: '#766E7D', line: '#EAE4ED',
    panel: '#F3F0EB', accent: '#E0D8FA', accentInk: '#382C57',
    primary: '#564477', onPrimary: '#FFFAFF', soft: '#F0EBF8', danger: '#AE403D',
  },
  dark: {
    background: '#1B181E', ink: '#F3EDF7', muted: '#B8ADBF', line: '#413747',
    panel: '#2B2730', accent: '#CFC0EF', accentInk: '#2F234C',
    primary: '#D4C2F3', onPrimary: '#2D2048', soft: '#30263E', danger: '#FFB4A9',
  },
};

export type Palette = typeof palettes.light;
export const fonts = { regular: 'PretendardRegular', medium: 'PretendardMedium', bold: 'PretendardBold' };
export function usePalette(): Palette {
  return palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
