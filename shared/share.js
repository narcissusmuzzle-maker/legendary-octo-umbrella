/**
 * Публикация цветов двух верхних полосок для циферблата (Luv Face) через ОБЩЕЕ хранилище Zepp OS (API_LEVEL 3.0+).
 * Приложение пишет, циферблат читает по appId этого приложения (1061613) и тому же имени группы.
 * Пишется двумя способами сразу (циферблат читает первый, который сработал):
 *   1) ShareTypedStorage (@zos/storage), группа «u613stat»: целые числа c0…c5 (цвета 0xRRGGBB: полоска 1 — слова, полоска 2 — все занятия,
 *      каждая слева направо месяц | неделя | день), at — время записи (мс), ts — когда цвета посчитал телефон (мс);
 *   2) ShareLocalStorage (@zos/storage), файл «u613stat.json»: { top: [6 цветов], at, ts }.
 * Любая ошибка глотается: приложение работает как раньше, даже если хранилище на часах недоступно.
 */
import { ShareTypedStorage, ShareLocalStorage } from '@zos/storage'

export const SCOPE = 'u613stat'
export const FILE = 'u613stat.json'
export const TOP_COUNT = 6          // две полоски по три сегмента

/** Плоский список из шести цветов верхних полосок: [r0k0, r0k1, r0k2, r1k0, r1k1, r1k2]. */
export function topColors(colors) {
  const out = []
  for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) out.push(colors[r][k])
  return out
}

/** Записать цвета в общее хранилище. Возвращает короткую строку-итог ('' — всё записано; иначе что не получилось). */
export function publish(colors, phoneTs) {
  const top = topColors(colors)
  const at = Date.now()
  let errs = ''
  try {
    const st = new ShareTypedStorage(SCOPE)
    for (let i = 0; i < TOP_COUNT; i++) st.putInt('c' + i, top[i])
    st.putInt64('ts', phoneTs || 0)
    st.putInt64('at', at)   // последним: циферблат считает данные готовыми, когда увидит свежий at
  } catch (e) { errs += 'typed: ' + String(e).slice(0, 40) + ' ' }
  try {
    const sf = new ShareLocalStorage(FILE)
    sf.setItem('top', top)
    sf.setItem('ts', phoneTs || 0)
    sf.setItem('at', at)
  } catch (e) { errs += 'file: ' + String(e).slice(0, 40) }
  return errs
}
