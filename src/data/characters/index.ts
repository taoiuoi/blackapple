import { Character } from '../../types';
import { nguyTuViet } from './nguyTuViet';
import { gianDiNinh } from './gianDiNinh';
import { chuLacThien } from './chuLacThien';
import { lucTuHien } from './lucTuHien';
import { phanQuyMan } from './phanQuyMan';
import { dongKy } from './dongKy';

export {
  nguyTuViet,
  gianDiNinh,
  chuLacThien,
  lucTuHien,
  phanQuyMan,
  dongKy
};

export const ALL_CHARACTERS: Character[] = [
  nguyTuViet,
  gianDiNinh,
  chuLacThien,
  lucTuHien,
  phanQuyMan,
  dongKy
];
